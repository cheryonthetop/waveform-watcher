import os
import sys
import threading
import requests    
import time
from flask import jsonify, request, make_response, send_from_directory
from flask_cors import CORS
import numpy as np
import pandas as pd
import holoviews as hv
from holoviews import dim, opts
import bokeh
from bokeh.document import Document
from bson.json_util import dumps, loads
import pickle
import pymongo
import strax
import straxen
import json
from holoviews_waveform_display import waveform_display
from context import xenon1t_dali
# from waveforms import WaveformWatcher

ROOT_PATH = os.path.dirname(os.path.realpath(__file__))
os.environ.update({'ROOT PATH' : ROOT_PATH})
sys.path.append(os.path.join(ROOT_PATH, 'modules'))

import logger 
from app import app
CORS(app, supports_credentials=True) # Supports authenticated request

#Create a logger object for info and debug
LOG = logger.get_root_logger(os.environ.get(
    'ROOT_LOGGER', 'root'), filename = os.path.join(ROOT_PATH, 'output.log'))

# PORT = 4000 
PORT = os.environ.get('PORT')
if (not PORT):
    PORT = 4000
hv.extension("bokeh")

# Load data
st = xenon1t_dali(build_lowlevel=False)
runs = st.select_runs()
available_runs = runs['name']
renderer = hv.renderer('bokeh')
# A lock for renderer to avoid race condition
lock = threading.Lock()

# Connect to MongoDB
APP_DB_URI = os.environ.get("APP_DB_URI", None)
my_db = pymongo.MongoClient(APP_DB_URI)["waveform"]
my_auth = my_db["auth"]
my_app = my_db["app"]
my_request = my_db["request"]
my_event = my_db["event"]

def authenticate():
    def wrapped():
        return
    return

@app.errorhandler(404)
def not_found(error):
    """error handler"""
    LOG.error(error)
    return make_response(jsonify({'error': 'Not found'}), 404)

@app.route('/api/data')
def send_data():
    print(request.cookies)
    user = request.args.get('user')
    print(user)
    document = my_app.find_one({'user': user})
    # print(document)
    if (document == None):
        print("does not have record for the user: ", user)
        post = {'user': user,                 
                "run_id": "",
                "event_id": "",
                "waveform": None,
                "tags_data": []}
        my_app.insert_one(post)
        document = my_app.find_one({'user': user})
    document["available_runs"] = available_runs
    json_str = dumps(document)
    return make_response(json_str, 200)

@app.route('/api/ge', methods = ['POST'])
def get_event_plot():
    if request.is_json:
        req = request.get_json()
        run_id = req["run_id"]
        print("RUN ID IS: " , run_id)
        events = st.get_df(run_id, 'event_info')
        dset = hv.Dataset(events)
        # Fields
        DIMS = [
        ["cs1", "cs2"],
        ["z","r" ],
        ["e_light", 'e_charge'],
        ["e_light", 'e_ces'],
        ["drift_time", "n_peaks"],
        ]
        # Use different color for each plot
        colors = hv.Cycle('Category10').values
        plots = [
            hv.Points(dset, dims).opts(color=c)
            for c, dims in zip(colors, DIMS)
        ]
        
        # Construct Layout to be viewed
        event_selection = hv.Layout(plots).cols(3)

        # Send to client
        lock.acquire()
        events = None
        try:
            events = renderer.server_doc(event_selection).roots[-1]
        finally:
            lock.release()
        events_json = bokeh.embed.json_item(events)        
        return json.dumps(events_json)


def get_data(run_id, event_id):
    #TODO: Check types and handle appropriately.  
    # Can specify either int for event ID or time range.  
    # Or list of these.  If not list, then convert to list
    event = None
    document = my_event.find_one({"run_id" : run_id, "event_id" : event_id})
    if (document):
        event = pickle.loads(document["event"])
    else:
        cache_data(run_id, event_id)
    return event

def cache_data(run_id, event_id):
    document = my_request.find_one({"run_id" : run_id, "event_id" : event_id})
    # cache to request if not already in it
    if (document == None):
        post = {"status" : "new", "run_id" : run_id, "event_id" : event_id}
        my_request.insert_one(post) # insert mongo document into 'fetch'

def get_event(run_id, event_id):
    while True:
        event = get_data(run_id, event_id)
        if (event != None):
            return event
        print("still getting event...")
        # Wait for event to be loaded
        time.sleep(5)

@app.route('/api/gw',  methods = ['POST'])
def get_waveform():
    if request.is_json:
        req = request.get_json()
        print(req)
        run_id = req["run_id"]
        user = req["user"]   
        event_id = req["event_id"]
        # df = st.get_array(run_id, "event_info")
        # event = df[event_id]
        event = get_event(run_id, event_id)
        print(event)
        plot = waveform_display(context = st, run_id = str(run_id), time_within=event)
        waveform = None
        lock.acquire()
        try:
            waveform =  renderer.server_doc(plot).roots[-1]
            print(waveform)
        finally:
            lock.release()
        waveform =  renderer.server_doc(plot).roots[-1]

        waveform_json = bokeh.embed.json_item(waveform)  
        print("json item is ", waveform)      
        # Update database
        mongo_document = my_app.find_one({"user": user})
        print("found doc ", mongo_document)
        if (mongo_document):
            my_app.update_one({"user": user}, 
            {"$set": { 
                "run_id": run_id, 
                "event_id" : event_id,
                "waveform": waveform_json,
                }
            }
            )
        print("returning waveform...")
        return json.dumps(waveform_json)

    else:
        return make_response(jsonify({"success": False}), 400)

@app.route('/api/sw',  methods = ['POST'])
def save_waveform():
    if request.is_json:
        req = request.get_json()
        print(req["user"], req["tag"], req["run_id"])
        user = req["user"]
        tag = req["tag"]
        comments = None
        try:
            comments = req["comments"]
        except KeyError:
            comments = ""
        event_id = req["event_id"]
        run_id = req["run_id"]
        waveform = req["waveform"]
        # Update database
        my_app.update_one({"user": user}, 
            {"$set": { 
                "run_id": run_id, 
                "event_id" : event_id,
                "waveform": waveform,
                }
            }
        )
        mongo_document = my_app.find_one({"user": user, "tags_data."+tag: {"$exists": True}})
        if (mongo_document):
            print("mongo document found: ")

            my_app.update_one({"user": user, "tags_data."+tag: {"$exists": True}}, 
                {"$set": { 
                        "tags_data.$."+tag+".comments": comments,
                        "tags_data.$."+tag+".run_id": run_id,
                        "tags_data.$."+tag+".event_id": event_id,
                        "tags_data.$."+tag+".waveform": waveform
                    }
                }
            )
        else:
            mongo_document = my_app.find_one({"user": user})
            my_app.update_one({"user": user},
                {
                    "$push": {
                        "tags_data": {
                            tag: {
                                "run_id": run_id,
                                "event_id": event_id,
                                "comments": comments,
                                "waveform": waveform,
                            }
                        }
                    }
                }
            )
        return make_response(jsonify({"success": True}), 200)
    else:
        return make_response(jsonify({"success": False}), 400)

@app.route('/api/dw',  methods = ['POST'])
def delete_waveform():
    if request.is_json:
        req = request.get_json()
        print(req)
        user = req["user"]  
        tag = req["tag"]
        # Update database
        mongo_document = my_app.find_one({"user": user, "tags_data."+tag: {"$exists": True}})
        if (mongo_document):
            print("#DELETING mongo document found: ")
            my_app.update_one({"user": user, "tags_data."+tag: {"$exists": True}}, 
                {"$pull": { 
                        "tags_data": {tag: {"$exists": True}},
                    }
                }
            ) 
        return make_response(jsonify({"success": True}), 200)
    else:
        return make_response(jsonify({"success": False}), 400)



if __name__ == "__main__":
    # LOG.info('running environment: %s', os.environ.get('ENV'))
    app.config['DEBUG'] = os.environ.get('ENV') == 'development' #debug mode
    app.run(host = '0.0.0.0', port = int(PORT), threaded=True) # Run the app