"""
Fetches run and waveform data and caches them into the DB
according to the user requests
"""

import pickle
import threading
from threading import Thread
import os
from bson.binary import Binary
import straxen
import holoviews as hv
import pymongo
import time
import bokeh
import pandas as pd
import traceback
import strax

# Bokeh backend setup
hv.extension("bokeh")
renderer = hv.renderer("bokeh")  # Bokeh Server
lock = threading.Lock()  # A Lock to address race condition

# Get the number of processors/cores available in the system
cpu_count = os.cpu_count()
print("Number of processors/cores available in the system: ", cpu_count)

APP_DB_URI = os.environ.get("APP_DB_URI", None)
if APP_DB_URI == None:
    print("MongoDB Connection String Not Set")
my_db = pymongo.MongoClient(APP_DB_URI)["waveform"]
my_request = my_db["request"]
my_waveform = my_db["waveform"]
my_events = my_db["events"]
my_software = my_db["software"]
my_run = my_db["run"]
dims = [
    "cs1",
    "cs2",
    "z",
    "r",
    "e_light",
    "e_charge",
    "e_light",
    "e_ces",
    "drift_time",
    "n_peaks",
    "event_number",
]
straxen.contexts.x1t_context_config['fuzzy_for'] = ('pulse_counts', 'lone_hits')
st = straxen.contexts.xenon1t_dali()
xenon1t_runs = st.select_runs(available="event_info")['name'].values
st_nt = straxen.contexts.xenonnt_online()
st_nt.set_context_config({'check_available': ('event_info','peak_basics')})
xenonnt_runs = st_nt.select_runs(available="peak_basics")['name'].values
st_nt.set_config(dict(nn_architecture=straxen.aux_repo+ 'f0df03e1f45b5bdd9be364c5caefdaf3c74e044e/fax_files/mlp_model.json',
                   nn_weights= straxen.aux_repo+'f0df03e1f45b5bdd9be364c5caefdaf3c74e044e/fax_files/mlp_model.h5'))
def load_waveform(run_id, event_id):
    """
    Renders a waveform

    Args:
        run_id (str): Run ID of the run
        event_id (str): Event ID of the event

    Returns:
        JSON-like str: The waveform of the event
    """
    waveform = None
    if run_id in xenon1t_runs:
        events = st.get_array(run_id, "event_info")
        event = events[int(event_id)]
        waveform = waveform_display(context=st, run_id=run_id, time_within=event)
    elif run_id in xenonnt_runs:
        # Make events as XENONnT runs do not have events
        st_nt.make(run_id, "event_info")
        events = st_nt.get_array(run_id, "event_info")
        event = events[int(event_id)]
        waveform = waveform_display(context=st_nt, run_id=run_id, time_within=event)        
    lock.acquire()
    try:
        waveform = renderer.server_doc(waveform).roots[-1]
    finally:
        lock.release()
    waveform = bokeh.embed.json_item(waveform)
    return waveform


def load_events(run_id):
    """
    Loads the events for a run

    Args:
        run_id (str): Run ID of the run

    Returns:
        pd.DataFrame: The events dataframe
    """
    if run_id in xenon1t_runs:
        events = st.get_df(run_id, "event_info")
    elif run_id in xenonnt_runs:
        st_nt.make(run_id, "event_info")
        events = st_nt.get_df(run_id, "event_info")
    return events


def cache_events(run_id, events, msg):
    """
    Caches the events into MongoDB by breaking down
    all the columns to avoid document over size limit
    of 16MB

    Args:
        run_id (str): Run ID of the run
        events (pd.DataFrame): The events dataframe
        msg (str): Error message, empty string if no error
    """
    post = {"run_id": run_id}
    if (not msg):
        document = my_events.find_one(post)
        if document == None:
            for dim in dims:
                post[dim] = list(events[dim])
            my_events.insert_one(post)
    else:
        post["msg"] = msg
        my_events.insert_one(post)


def cache_waveform(run_id, event_id, waveform, msg):
    """
    Caches the waveform into MongoDB

    Args:
        run_id (str): Run ID of the run
        event_id (str): Event ID of the event
        waveform (JSON-like str): The waveform
        msg (str): Error message, empty string if no error
    """
    post = {"event_id": event_id, "run_id": run_id, "waveform": waveform, "msg": msg}
    document = my_waveform.find_one(post)
    if document == None:
        my_waveform.insert_one(post)


def process_waveform(run_id, event_id):
    """
    Fetches/loads and caches waveform

    Args:
        run_id (str): Run ID of the run
        event_id (str): Event ID of the event
    """
    print("starts processing waveform for run ", run_id, " and ", event_id)
    try:
        waveform = load_waveform(run_id, event_id)
        cache_waveform(run_id, event_id, waveform, "")
    except Exception as e:
        print("An exception occured ")
        traceback.print_tb(e.__traceback__)
        if hasattr(e, "message"):
            cache_waveform(run_id, event_id, None, e.message)
        else:
            cache_waveform(run_id, event_id, None, "Data Not Available")
    finally:
        document = my_request.delete_one(
            {"status": "use", "run_id": run_id, "event_id": event_id}
        )
        print("Just cached the waveform for run ", run_id, "and event ", event_id)


def process_events(run_id):
    """
    Fetches/loads the events from a run

    Args:
        run_id (str): Run ID of the run
    """
    print("starts processing events for run ", run_id)
    try:
        events = load_events(run_id)
        cache_events(run_id, events, "")
    except Exception as e:
        print("An exception occured ", e)
        traceback.print_tb(e.__traceback__)
        if hasattr(e, "message"):
            cache_events(run_id, None, e.message)
        else:
            cache_events(run_id, None, "Data Not Available")
    finally:
        document = my_request.delete_one({"status": "use", "run_id": run_id})
        print("Just cached the events for run ", run_id)


def fetch_request():
    """
    Fetches and process requests
    """
    while True:
        document = my_request.find_one_and_update(
            {"status": "new"}, {"$set": {"status": "use"}}
        )
        while document:
            request = document["request"]
            if request == "waveform":
                run_id = document["run_id"]
                event_id = document["event_id"]
                process_waveform(run_id, event_id)
            else:
                run_id = document["run_id"]
                process_events(run_id)
            document = my_request.find_one_and_update(
                {"status": "new"}, {"$set": {"status": "use"}}
            )
        # Sleep the app if no new requests
        time.sleep(10)


if __name__ == "__main__":
    print("service starting")
    my_run.delete_one({})
    my_run.insert_one({"runs": [*xenon1t_runs, *xenonnt_runs]})
    my_software.delete_one({})
    my_software.insert_one({"strax": strax.__version__, "straxen": straxen.__version__})
    threads = []
    for i in range(0, min(8, cpu_count)):
        t = Thread(target=fetch_request, daemon=True)
        threads.append(t)
        t.start()
    # Main thread sleeps for 1 day and terminates
    # Daemonic threads are terminated automatically
    time.sleep(60 * 60 * 24)
