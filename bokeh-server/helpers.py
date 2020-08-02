import pandas as pd
import datetime
import time
import pickle
import pymongo
import os

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
def cache_waveform_request(run_id, event_id):
    """
    Inserts a request into the request collection that
    asks for a waveform

    Args:
        run_id (str): Run ID of the run
        event_id (str): Event ID of the event
    """
    print("cacheing waveform for run ", run_id, "and event ", event_id)
    request = my_request.find_one({"run_id": run_id, "event_id": event_id})
    waveform = my_waveform.find_one({"run_id": run_id, "event_id": event_id})
    # cache to request if not already in it
    if request == None and waveform == None:
        post = {
            "status": "new",
            "run_id": run_id,
            "event_id": event_id,
            "request": "waveform",
        }
        my_request.insert_one(post)  # insert mongo document into 'fetch'


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
        print("Still Getting Events...")
        # Wait for waveform to be loaded
        time.sleep(10)
        if datetime.datetime.now() >= endtime:
            return "Get Events Timeout. Please Try Again."
        
def get_run(session_id):
    print(session_id)
    run_id = my_sesssion.find_one({session_id: {"$exists": True}})[session_id]
    return run_id