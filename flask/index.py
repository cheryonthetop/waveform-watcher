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
from bokeh.models import ColumnDataSource, CustomJS, OpenURL, TapTool
from bokeh.plotting import figure, show
from bokeh.layouts import gridplot
from bson.json_util import dumps, loads
import pickle
import pymongo
import gridfs
import json
import threading
import datetime
from holoviews_waveform_display import waveform_display
from context import xenon1t_dali

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
# Fixed Parameter in Plots for Event Selections
DIMS = [
    ["cs1", "cs2"],
    ["z","r" ],
    ["e_light", 'e_charge'],
    ["e_light", 'e_ces'],
    ["drift_time", "n_peaks"],
]
COLORS = hv.Cycle('Category10').values
TOOLS=['box_select', 'lasso_select', 'box_zoom', 'pan', 
       'wheel_zoom', 'hover', 'tap', 'save', 'reset']

# Connect to MongoDB
APP_DB_URI = os.environ.get("APP_DB_URI", None)
if (APP_DB_URI == None):
    print("MongoDB Connection String Not Set")

# The URL of the app (front-end)
if os.environ.get("ENV") == "production":
    APP_URL = os.environ.get("APP_URL", None)  
else: 
    APP_URL = "http://localhost:3000"
if (APP_URL == None):
    print("Env Variable APP_URL Is Not Set")
    
    
my_db = pymongo.MongoClient(APP_DB_URI)["waveform"]
my_auth = my_db["auth"]
my_app = my_db["app"]
my_request = my_db["request"]
my_waveform = my_db["waveform"]
my_run = my_db["run"]
fs = gridfs.GridFS(my_db, collection="events")

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
        events = wait_for_events(run_id)
        if (isinstance(events, str)):
            return make_response(jsonify({"err_msg" : events}), 200)
        source = ColumnDataSource(events)
        plots = []
        # use the "color" column of the CDS to complete the URL
        # e.g. if the glyph at index 10 is selected, then @color
        # will be replaced with source.data['color'][10]
        url = "{APP_URL}/waveform/{run_id}/@event_number/".format(APP_URL=APP_URL, run_id=run_id)
        for color,dim in zip(COLORS, DIMS):
            p = figure(tools=TOOLS, x_axis_label=dim[0], y_axis_label=dim[1])
            p.circle(dim[0], dim[1], source=source, alpha=0.6, color=color)
            taptool = p.select(type=TapTool)
            taptool.callback = OpenURL(url=url)
            plots.append(p)
        # make a grid
        grid = gridplot([plots[:3], plots[3:]], plot_width=300, plot_height=300)
        # Send to client
        grid = bokeh.embed.json_item(grid)  
        return json.dumps(grid)
    else:
        return make_response(jsonify({"success": False}), 400)
        
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
            return make_response(jsonify({"err_msg" : waveform}), 200)
        print("Retrieved waveform from cache")
        # Update database in another thread
        threading.Thread(target=update_db_from_get, args=(user, run_id, event_id, waveform)).start()
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
        # Update database in another thread
        threading.Thread(target=update_db_from_save, args=(user, run_id, event_id, waveform, tag, comments)).start()
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
        post = {"status" : "new", "run_id" : run_id, "event_id" : event_id, "request": "waveform"}
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
            print("Get Waveform Timeout")
            return "Get Waveform Timeout. Please Try Again."
    
def get_events(run_id):
    events = None
    if (fs.exists(run_id)):
        file = fs.get(run_id)
        print("reading json")
        data = json.load(file)
        events = pd.DataFrame.from_dict(data)
        # events = pd.read_json(file, orient="records", lines=True, chunksize=5)
        print("reading json complete")
        print(events)
        if (events == None):
            return "Events Not Available"
    else:
        cache_events_request(run_id)
    return events

def cache_events_request(run_id):
    document = my_request.find_one({"run_id" : run_id})
    # cache to request if not already in it
    if (document == None):
        post = {"status" : "new", "run_id" : run_id, "request": "events"}
        my_request.insert_one(post) # insert mongo document into 'fetch'

def wait_for_events(run_id):
    # only wait for 1 minute
    endtime = datetime.datetime.now() + datetime.timedelta(0, 120)
    while True:
        events = get_events(run_id)
        if (events != None):
            return events
        print("Still Getting Events...")
        # Wait for waveform to be loaded
        time.sleep(5)
        if (datetime.datetime.now() >= endtime):
            print("Get Events Timeout")
            return "Get Events Timeout. Please Try Again."

def update_db_from_get(user, run_id, event_id, waveform):
    mongo_document = my_app.find_one({"user": user})
    print("updating waveform in the app db from get... ")
    if (mongo_document):
        my_app.update_one({"user": user}, 
            {"$set": { 
                "run_id": run_id, 
                "event_id" : event_id,
                "waveform": waveform,
                }
            }
        )
    print("updating waveform in the app db from get completed!")
    
def update_db_from_save(user, run_id, event_id, waveform, tag, comments):
    print("updating waveform in the app db from save...")
    my_app.update_one({"user": user}, 
    {"$set": { 
        "run_id": run_id, 
        "event_id" : event_id,
        "waveform": waveform,
        }
    })
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
        print("updating waveform in the app db from save completed!")


if __name__ == "__main__":
    # LOG.info('running environment: %s', os.environ.get('ENV'))
    app.config['DEBUG'] = os.environ.get('ENV') == 'development' #debug mode
    app.run(host = '0.0.0.0', port = int(PORT), threaded=True) # Run the app