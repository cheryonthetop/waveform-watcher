import os
import sys
import threading
import time
from flask import jsonify, request, make_response
from flask_cors import CORS
from bokeh.client import pull_session
from bokeh.embed import server_session
from bokeh.util.token import generate_session_id
import numpy as np
import pandas as pd
from bson.json_util import dumps, loads
import pickle
import pymongo
import json
import threading
import datetime

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

BOKEH_SERVER_URL = os.environ.get("BOKEH_SERVER_URL", None)
if BOKEH_SERVER_URL == None:
    BOKEH_SERVER_URL = "http://localhost:5006/bokeh-server"
    
# Connect to MongoDB
APP_DB_URI = os.environ.get("APP_DB_URI", None)
if (APP_DB_URI == None):
    print("MongoDB Connection String Not Set")    
    
my_db = pymongo.MongoClient(APP_DB_URI)["waveform"]
my_auth = my_db["auths"]
my_app = my_db["app"]
my_request = my_db["request"]
my_waveform = my_db["waveform"]
my_run = my_db["run"]
my_events = my_db["events"]

available_runs = my_run.find_one({})["runs"]
print("Available runs are: ", available_runs[:5])
def authenticate(token):
    token = token.replace(" ", "+", -1)
    key = "tokens."+token
    match =  my_auth.count_documents({ key: {"$exists": True}}, limit=1)
    return True if match == 1 else False

@app.errorhandler(404)
def not_found(error):
    """error handler"""
    LOG.error(error)
    return make_response(jsonify({'error': 'Not found'}), 404)

###### API Routes
@app.route('/api/data')
def send_data():
    token = request.args.get('token')
    if not authenticate(token):
        return make_response(jsonify({"error": "Unauthorized API request"}), 403)
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
    token = request.args.get('token')
    if not authenticate(token):
        return make_response(jsonify({"error": "Unauthorized API request"}), 403)
    if request.is_json:
        req = request.get_json()
        run_id = req["run_id"]
        print("RUN ID IS: " , run_id)
        cache_events_request(run_id)
        my_session_id=generate_session_id()
        print(BOKEH_SERVER_URL)
        # pull a new session from a running Bokeh server
        with pull_session(url=BOKEH_SERVER_URL, session_id=my_session_id,
                          arguments={"run": run_id}) as session:
            script = server_session(url=BOKEH_SERVER_URL
                                    , session_id=session.id)
            # use the script in the rendered page
            return script

    else:
        return make_response(jsonify({"success": False}), 400)
        
@app.route('/api/gw',  methods = ['POST'])
def get_waveform():
    token = request.args.get('token')
    if not authenticate(token):
        return make_response(jsonify({"error": "Unauthorized API request"}), 403)
    if request.is_json:
        req = request.get_json()
        print(req)
        run_id = req["run_id"]
        user = req["user"]   
        event_id = req["event_id"]
        waveform = wait_for_waveform(run_id, event_id)
        if (isinstance(waveform, str)):
            return make_response(jsonify({"err_msg" : waveform}), 202)
        print("Retrieved waveform from cache")
        # Update database in another thread
        threading.Thread(target=update_db_from_get, args=(user, run_id, event_id, waveform)).start()
        print("returning waveform...")
        return json.dumps(waveform)
    else:
        return make_response(jsonify({"success": False}), 400)
        
@app.route('/api/sw',  methods = ['POST'])
def save_waveform():
    token = request.args.get('token')
    if not authenticate(token):
        return make_response(jsonify({"error": "Unauthorized API request"}), 403)
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
    token = request.args.get('token')
    if not authenticate(token):
        return make_response(jsonify({"error": "Unauthorized API request"}), 403)
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
    endtime = datetime.datetime.now() + datetime.timedelta(0, 180)
    while True:
        waveform = get_waveform(run_id, event_id)
        if (waveform != None):
            print("Retrieved Waveform")
            return waveform
        print("still getting waveform...")
        # Wait for waveform to be loaded
        time.sleep(5)
        if (datetime.datetime.now() >= endtime):
            return "Get Waveform Timeout. Please Try Again."
    
def cache_events_request(run_id):
    ongoing_request = my_request.find_one({"run_id" : run_id})
    events = my_events.find_one({"run_id" : run_id, "events": {"$exists": True}})
    # cache to request if not already in it
    if (ongoing_request == None and events == None):
        post = {"status" : "new", "run_id" : run_id, "request": "events"}
        my_request.insert_one(post) # insert mongo document into 'fetch'

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