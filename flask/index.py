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
import json
import threading
import datetime
from holoviews_waveform_display import waveform_display

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
renderer = hv.renderer('bokeh') # Bokeh Server

# Connect to MongoDB
APP_DB_URI = os.environ.get("APP_DB_URI", None)
if (APP_DB_URI == None):
    print("MongoDB Connection String Not Set")
my_db = pymongo.MongoClient(APP_DB_URI)["waveform"]
my_auth = my_db["auth"]
my_app = my_db["app"]
my_request = my_db["request"]
my_waveform = my_db["waveform"]
my_run = my_db["run"]

available_runs = my_run.find_one({})["runs"]
print("Available runs are: ", available_runs[:5])

def authenticate():
    def wrapped():
        return
    return

@app.errorhandler(404)
def not_found(error):
    """error handler"""
    LOG.error(error)
    return make_response(jsonify({'error': 'Not found'}), 404)

###### API Routes

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
        # events = st.get_df(run_id, 'event_info')
        events = None
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
        events = renderer.server_doc(event_selection).roots[-1]

        events_json = bokeh.embed.json_item(events)        
        return json.dumps(events_json)
        
@app.route('/api/gw',  methods = ['POST'])
def get_waveform():
    if request.is_json:
        req = request.get_json()
        print(req)
        run_id = req["run_id"]
        user = req["user"]   
        event_id = req["event_id"]
        waveform = wait_for_waveform(run_id, event_id)
        if (isinstance(waveform, str)):
            return make_response(jsonify({"err_msg" : waveform}), 500)
        print("Retrieved waveform from cache")
        # Update database in another thread
        threading.Thread(target=update_waveform_db, args=(user, run_id, event_id, waveform)).start()
        print("returning waveform...")
        return json.dumps(waveform)

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


###### Helper Routine

def get_waveform(run_id, event_id):
    #TODO: Check types and handle appropriately.  
    # Can specify either int for event ID or time range.  
    # Or list of these.  If not list, then convert to list
    waveform = None
    document = my_waveform.find_one({"run_id" : run_id, "event_id" : event_id})
    if (document):
        if (document["waveform"]):
            waveform = document["waveform"]
        else:
            return document["msg"]
    else:
        cache_waveform_request(run_id, event_id)
    return waveform

def cache_waveform_request(run_id, event_id):
    document = my_request.find_one({"run_id" : run_id, "event_id" : event_id})
    # cache to request if not already in it
    if (document == None):
        post = {"status" : "new", "run_id" : run_id, "event_id" : event_id}
        my_request.insert_one(post) # insert mongo document into 'fetch'

def wait_for_waveform(run_id, event_id):
    # only wait for 1 minute
    endtime = datetime.datetime.now() + datetime.timedelta(0, 60)
    while True:
        waveform = get_waveform(run_id, event_id)
        if (waveform != None):
            return waveform
        print("still getting waveform...")
        # Wait for waveform to be loaded
        time.sleep(5)
        if (datetime.datetime.now() >= endtime):
            return "Get Waveform Timeout. Please Try Again."

def update_waveform_db(user, run_id, event_id, waveform):
    mongo_document = my_app.find_one({"user": user})
    print("updating waveform in the app db... ")
    if (mongo_document):
        my_app.update_one({"user": user}, 
            {"$set": { 
                "run_id": run_id, 
                "event_id" : event_id,
                "waveform": waveform,
                }
            }
        )
    print("updating waveform in the app db completed!")

if __name__ == "__main__":
    # LOG.info('running environment: %s', os.environ.get('ENV'))
    app.config['DEBUG'] = os.environ.get('ENV') == 'development' #debug mode
    app.run(host = '0.0.0.0', port = int(PORT), threaded=True) # Run the app