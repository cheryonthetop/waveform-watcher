import pandas as pd
import datetime
import time
import pickle
import pymongo
import os
import threading
from tornado import gen

# Connect to MongoDB
APP_DB_URI = os.environ.get("APP_DB_URI", None)
if APP_DB_URI == None:
    print("MongoDB Connection String Not Set")

my_db = pymongo.MongoClient(APP_DB_URI)["waveform"]
my_request = my_db["request"]
my_events = my_db["events"]
my_waveform = my_db["waveform"]
my_sesssion = my_db["sessions"]

##### DB routine helpers
def get_events_from_cache(run_id):
    """
    Gets events from the cache

    Args:
        run_id (str): Run ID of the run

    Returns:
        DataFrame: All events from the run with DIMS as the fields
    """
    events = None
    document = my_events.find_one({"run_id": run_id})
    if document:
        if document["events"]:
            events = pd.DataFrame(pickle.loads(document["events"]))
        else:
            return document["msg"]
    return events


def wait_for_events(run_id):
    """
    Repeatedly waits for events to be returned from the cache       

    Args:
        run_id (str): Run ID of the run

    Returns:
        DataFrame/str: A dataframe with all events from the run, or
        an error message if the events are not retrieved, or a timeout message
        to indicate the waveform has not yet been found in the cache for 5 minutes
    """
    # wait for 5 minutes max
    endtime = datetime.datetime.now() + datetime.timedelta(0, 60 * 5)
    while True:
        events = get_events_from_cache(run_id)
        if isinstance(events, pd.DataFrame):
            print("retrieved events")
            return events
        if isinstance(events, str):
            return events
        print("Still Getting Events...")
        # Wait for waveform to be loaded
        time.sleep(10)
        if datetime.datetime.now() >= endtime:
            return "Get Events Timeout. Please Try Again."


def get_run(session_id):
    """
    Gets the run the session is dealing with and removes it
    from the database because this is single use.

    Args:
        session_id (str): The session ID

    Returns:
        str: The run ID
    """
    run_id = my_sesssion.find_one({session_id: {"$exists": True}})[session_id]
    threading.Thread(target=delete_run, args=[session_id])
    return run_id


def delete_run(session_id):
    """
    Deletes the run stored in the sesssion.

    Args:
        session_id (str): The session ID
    """
    my_session.delete_one({session_id: {"$exists": True}})


@gen.coroutine
def enable_btn(btn):
    """
    Enables button

    Args:
        btn (bokeh.Model): A button widget
    """
    btn.disabled = False


@gen.coroutine
def disable_btn(btn):
    """
    Disables button

    Args:
        btn (bokeh.Model): A button widget
    """
    btn.disabled = True


@gen.coroutine
def clear_options(multi_select):
    """
    Clears options in the multi select box

    Args:
        multi_select (bokeh.Model): A multi select box
    """
    multi_select.options = []


@gen.coroutine
def update_options(multi_select, event):
    """
    Updates the options in the multi_select widget

    Args:
        multi_select (bokeh.Model): A multi select box
        event (str): Event ID of the event
    """
    if event not in multi_select.options:
        multi_select.options.append(event)


@gen.coroutine
def update_source(source, events):
    """
    Updates the source data with real events once they are
    retrieved from the database

    Args:
        source (bokeh.Model): A ColumnDataSource
        events (DataFrame): The true data source
    """
    source.update(data=events)
