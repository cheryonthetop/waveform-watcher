import os
import sys
import requests    
from flask import jsonify, request, make_response, send_from_directory
from flask_cors import CORS
import numpy as np
import pandas as pd
import holoviews as hv
from holoviews import dim, opts
import bokeh
from bokeh.document import Document
from bson.json_util import dumps, loads
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

# # Read live data
# Load data
st = xenon1t_dali(build_lowlevel=False)
runs = st.select_runs()
available_runs = runs['name']
# renderer = hv.renderer('bokeh')
# print("renderer created: ", renderer)
# event_selection = WaveformWatcher().event_selection()
# print(event_selection)

# Connect to MongoDB
APP_DB_URI = os.environ.get("APP_DB_URI", None)
my_db = pymongo.MongoClient(APP_DB_URI)["waveform"]
my_auth = my_db["auth"]
my_app = my_db["app"]

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
                "event": "",
                "bokeh_model": None,
                "tags_data": []}
        my_app.insert_one(post)
        document = my_app.find_one({'user': user})
    document["available_runs"] = available_runs
    if document["event"]:
        document["event"] = "dummy"
    json_str = dumps(document)
    return make_response(json_str, 200)

@app.route('/api/ge', methods = ['POST'])
def get_event_plot():
    if request.is_json:
        req = request.get_json()
        run_id = req["run_id"]
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
        bokeh_model = hv.renderer('bokeh').server_doc(event_selection).roots[-1]
        bokeh_model_json = bokeh.embed.json_item(bokeh_model)        
        return json.dumps(bokeh_model_json)


def get_data(run_id, events):
    
    #TODO: Check types and handle appropriately.  
    # Can specify either int for event ID or time range.  
    # Or list of these.  If not list, then convert to list
    data_found = True # implement by checking collection 'waveform_data', false if not in cache
    if not data_found:
        raise FileNotFoundError


    df = st.get_array(run_id, "event_info")
    event = df[events[0]]# insert event into mongo in other python script
    return event

def cache_data(run_id, events):
    # This would add a new document into a new collection 'fetch' in mongo
    # with the format: 
    # {"status" : "new", "run_id" : run_id, "events" : events}
    # after checking that the data already isn't in the cache somehow by calling
    # get_data()
    
    #check if events is list, maybe start with single events
    try:
        get_data(run_id, events)
    except FileNotFoundError:
        pass # insert mongo document into 'fetch'

@app.route('/api/gw',  methods = ['POST'])
def get_waveform():
    if request.is_json:
        req = request.get_json()
        print(req)
        run_id = req["run_id"]
        user = req["user"]   
        event = req["event"]
        df = st.get_array(run_id, "event_info")
        event = df[4]
        print(event)
        plot = waveform_display(context = st, run_id = str(run_id), time_within=event)
        
        # A container for Bokeh Models to be reflected to the client side BokehJS library.
        bokeh_document = hv.renderer('bokeh').server_doc(plot)
        print("converted to doc: ", bokeh_document)

        bokeh_model = bokeh_document.roots[-1]
        bokeh_model_json = bokeh.embed.json_item(bokeh_model)        
        # Update database
        mongo_document = my_app.find_one({"user": user})
        if (mongo_document):
            my_app.update_one({"user": user}, 
            {"$set": { 
                "run_id": run_id, 
                "event" : event.tostring(),
                "bokeh_model": bokeh_model_json,
                }
            }
            )
        return json.dumps(bokeh_model_json)

    else:
        return make_response(jsonify({"success": False}), 400)

@app.route('/api/sw',  methods = ['POST'])
def save_waveform():
    if request.is_json:
        req = request.get_json()
        print(req["user"], req["tag"], req["comments"], req["run_id"])
        user = req["user"]  
        tag = req["tag"]
        comments = req["comments"]
        event = req["event"]
        run_id = req["run_id"]
        bokeh_model = req["bokeh_model"]
        # Update database
        my_app.update_one({"user": user}, 
            {"$set": { 
                "run_id": run_id, 
                "event" : event,
                "bokeh_model": bokeh_model,
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
                        "tags_data.$."+tag+".event": event,
                        "tags_data.$."+tag+".bokeh_model": bokeh_model
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
                                "event": event,
                                "comments": comments,
                                "bokeh_model": bokeh_model,
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
    app.run(host = '0.0.0.0', port = int(PORT)) # Run the app