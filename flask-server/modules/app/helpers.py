import os
import datetime
from bson.son import SON
import pymongo
import numpy as np
import pickle
import time

###### Helper Routine
APP_DB_URI = os.environ.get("APP_DB_URI", None)
if APP_DB_URI == None:
    print("MongoDB Connection String Not Set")
my_db = pymongo.MongoClient(APP_DB_URI)["waveform"]
my_app = my_db["app"]
my_auth = my_db["auths"]
my_request = my_db["request"]
my_waveform = my_db["waveform"]
my_run = my_db["run"]
my_events = my_db["events"]
def authenticate(user, token):
    """
    Authenticates an API request with a token

    Args:
        user (str): username
        token (str): An authentication token

    Returns:
        boolean: True if the token is issued to the user and false otherwise
    """
    token = token.replace(" ", "+", -1)
    key = "tokens." + token
    match = my_auth.count_documents({"username": user, key: {"$exists": True}}, limit=1)
    return True if match == 1 else False

def get_waveform_from_cache(run_id, event_id, n):
    """
    Gets waveform from the cache, and insert a request for
    the waveform if it does not exist

    Args:
        run_id (str): Run ID of the run
        event_id (str): Event ID of the event
        n (int) : The nth time trying to get waveform

    Returns:
        dict/str: A dict from the MongoDB Object representing the waveform,
        or a string with the error message if the waveform is somehow not rendered
    """
    waveform = None
    post = {"run_id": run_id, "event_id": event_id}
    document = my_waveform.find_one(post)
    if document:
        if document["waveform"]:
            waveform = document["waveform"]
        elif n == 0:
            # We want to reprocess the event for one more time 
            # if it is null in the cache
            my_waveform.delete_one(post)
            cache_waveform_request(run_id, event_id)
        else:
            return document["msg"]
    else:
        cache_waveform_request(run_id, event_id)
    return waveform


def cache_waveform_request(run_id, event_id):
    """
    Inserts a request into the request collection that
    asks for a waveform

    Args:
        run_id (str): Run ID of the run
        event_id (str): Event ID of the event
    """
    document = my_request.find_one({"run_id": run_id, "event_id": event_id})
    # cache to request if not already in it
    if document == None:
        post = {
            "status": "new",
            "run_id": run_id,
            "event_id": event_id,
            "request": "waveform",
        }
        my_request.insert_one(post)  # insert mongo document into 'fetch'


def wait_for_waveform(run_id, event_id):
    """
    Repeatedly waits for a waveform to be returned from the cache       

    Args:
        run_id (str): Run ID of the run
        event_id (str): Event ID of the event

    Returns:
        dict/str: A dict from MongoDB Object representing the waveform, or
        an error message if the waveform is not rendered, or a timeout message
        to indicate the waveform has not yet been found in the cache for 5 minutes
    """
    # only wait for 3 minutes
    endtime = datetime.datetime.now() + datetime.timedelta(0, 180)
    n = 0
    while True:
        waveform = get_waveform_from_cache(run_id, event_id, n)
        if waveform != None:
            print("Retrieved Waveform")
            return waveform
        print("still getting waveform...")
        # Wait for waveform to be loaded
        time.sleep(5)
        if datetime.datetime.now() >= endtime:
            return "Get Waveform Timeout. Please Try Again."
        n = n + 1


def cache_events_request(run_id):
    """
    Inserts a request into the request collection to ask for 
    the events of a particular run ID

    Args:
        run_id (str): Run ID for the events
    """
    ongoing_request = my_request.find_one({"run_id": run_id})
    document = my_events.find_one({"run_id": run_id, "events": {"$exists": True}})
    post = {"status": "new", "run_id": run_id, "request": "events"}
    # cache to request if not already in it
    if document:        
        events = document["events"]
        if ongoing_request == None and events == None:
            # Reprocess events if it is null in the cache
            my_events.delete_one({"run_id": run_id})
            my_request.insert_one(post)
    else:
        my_request.insert_one(post)


def update_db_new_waveform(user, run_id, event_id, waveform):
    """
    Updates the database with the latest waveform a user gets

    Args:
        user (str): username
        run_id (str): Run ID of the run
        event_id (str): Event ID of the event
        waveform (dict): A dictionary to be converted to MongoDB Object
        representing the waveform
    """
    mongo_document = my_app.find_one({"user": user})
    print("updating waveform in the app db from get... ")
    if mongo_document:
        new_record = {"run_id": run_id, "event_id": event_id}
        history = mongo_document["waveform_history"]
        history.insert(0, new_record)
        if (len(history) > 500):
            history.pop(-1)
        my_app.update_one(
            {"user": user},
                {"$set": {"run_id": run_id, "event_id": event_id, "waveform": waveform, "waveform_history": history }}, 
        ),
    print("updating waveform in the app db from get completed!")


def update_db_new_tag(user, run_id, event_id, tag, comments):
    """
    Updates the database with the new tag the user created

    Args:
        user (str): Username
        run_id (str): Run ID of the run
        event_id (str): Event ID of the event
        tag (str): The tag associated with the waveform
        comments (str): The comments on the waveform
    """
    print("updating waveform in the app db from save...")
    my_app.update_one(
        {"user": user}, {"$set": {"run_id": run_id, "event_id": event_id}}
    )
    mongo_document = my_app.find_one(
        {"user": user, "tags_data." + tag: {"$exists": True}}
    )
    if mongo_document:
        my_app.update_one(
            {"user": user, "tags_data." + tag: {"$exists": True}},
            {
                "$set": {
                    "tags_data.$." + tag + ".comments": comments,
                    "tags_data.$." + tag + ".run_id": run_id,
                    "tags_data.$." + tag + ".event_id": event_id,
                }
            },
        )
    else:
        mongo_document = my_app.find_one({"user": user})
        my_app.update_one(
            {"user": user},
            {
                "$push": {
                    "tags_data": {
                        tag: {
                            "run_id": run_id,
                            "event_id": event_id,
                            "comments": comments,
                        }
                    }
                }
            },
        )
        print("updating waveform in the app db from save completed!")