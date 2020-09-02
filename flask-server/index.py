"""
Flask App serving API requests for waveform watcher.
This is the backend for the main functionalities of the app.
"""

import os
import sys
import threading
import time
from flask import jsonify, request, make_response
from flask_cors import CORS
from bokeh.embed import server_session
from bokeh.util.token import generate_session_id
import pandas as pd
from bson.json_util import dumps
import pymongo
import json

ROOT_PATH = os.path.dirname(os.path.realpath(__file__))
os.environ.update({"ROOT PATH": ROOT_PATH})
sys.path.append(os.path.join(ROOT_PATH, "modules"))

import logger
from app import app
from app import (
    authenticate,
    get_runs,
    get_waveform_from_cache,
    cache_waveform_request,
    wait_for_waveform,
    cache_events_request,
    update_db_new_waveform,
    update_db_new_tag,
)

CORS(app, supports_credentials=True)

LOG = logger.get_root_logger(
    os.environ.get("ROOT_LOGGER", "root"),
    filename=os.path.join(ROOT_PATH, "output.log"),
)

PORT = os.environ.get("PORT")
if not PORT:
    PORT = 4000

BOKEH_SERVER_URL = os.environ.get("BOKEH_SERVER_URL", None)
if BOKEH_SERVER_URL == None:
    BOKEH_SERVER_URL = "http://localhost:5006/bokeh-server"

# Connect to MongoDB
APP_DB_URI = os.environ.get("APP_DB_URI", None)
if APP_DB_URI == None:
    print("MongoDB Connection String Not Set")
my_db = pymongo.MongoClient(APP_DB_URI)["waveform"]
my_app = my_db["app"]
my_sessions = my_db["sessions"]
my_run = my_db["run"]
my_software = my_db["software"]

available_runs = my_run.find_one({})["runs"]
print("Available runs are: ", available_runs[:5])


@app.errorhandler(404)
def not_found(error):
    """
    Error Handler

    Args:
        error (str): Error message

    Returns:
        Response: An HTTP response with status 404
    """
    LOG.error(error)
    return make_response(jsonify({"error": "Not found"}), 404)


###### API Routes
@app.route("/api/data")
def send_data():
    """
    Sends user data

    Returns:
        Response: JSON String containing all the user data
    """
    token = request.args.get("token")
    user = request.args.get("user")
    if not authenticate(user, token):
        return make_response(jsonify({"error": "Unauthorized API request"}), 403)
    print(user)
    document = my_app.find_one({"user": user})
    # print(document)
    if document == None:
        print("does not have record for the user: ", user)
        post = {
            "user": user,
            "run_id": "",
            "event_id": "",
            "waveform": None,
            "tags_data": [],
            "waveform_history": [],
        }
        my_app.insert_one(post)
        document = my_app.find_one({"user": user})
    document["available_runs"] = available_runs
    software_version = my_software.find_one({})
    document["strax"] = software_version["strax"]
    document["straxen"] = software_version["straxen"]
    json_str = dumps(document)
    return make_response(json_str, 200)


@app.route("/api/ge", methods=["POST"])
def get_event_plot():
    """
    Connects the frontend to the Bokeh Server by pulling and
    returning a sesssion which generates Bokeh plots displaying
    all the events for a given run

    Returns:
        str: A script tag that embeds content from a specific 
        existing session on a Bokeh server.
    """
    if request.is_json:
        token = request.args.get("token")
        req = request.get_json()
        run_id = None
        user = None
        try:
            run_id = req["run_id"]
            user = req["user"]
        except:
            return make_response(jsonify({"error": "Bad Request"}), 400)
        if not authenticate(user, token):
            return make_response(jsonify({"error": "Unauthorized API request"}), 403)
        print("RUN ID IS: ", run_id)
        threading.Thread(target=cache_events_request, args=[run_id]).start()
        session_id = generate_session_id()
        my_sessions.insert_one({session_id: run_id})
        script = server_session(url=BOKEH_SERVER_URL, session_id=session_id)
        # use the script in the rendered page
        return script
    else:
        return make_response(jsonify({"error": "Bad Request"}), 400)


@app.route("/api/gw", methods=["POST"])
def get_waveform():
    """
    Retrieves a waveform from the cache

    Returns:
        str: A JSON formatted string representing the waveform
    """
    if request.is_json:
        token = request.args.get("token")
        req = request.get_json()
        run_id = None
        user = None
        event_id = None
        try:
            run_id = req["run_id"]
            user = req["user"]
            event_id = req["event_id"]
        except:
            return make_response(jsonify({"error": "Bad Request"}), 400)
        if not authenticate(user, token):
            return make_response(jsonify({"error": "Unauthorized API request"}), 403)
        waveform = wait_for_waveform(run_id, event_id)
        if isinstance(waveform, str):
            return make_response(jsonify({"err_msg": waveform}), 202)
        print("Retrieved waveform from cache")
        # Update database in another thread
        threading.Thread(
            target=update_db_new_waveform, args=(user, run_id, event_id, waveform)
        ).start()
        print("returning waveform...")
        return json.dumps(waveform)
    else:
        return make_response(jsonify({"error": "Bad Request"}), 400)


@app.route("/api/sw", methods=["POST"])
def save_waveform():
    """
    Saves the tag and comments associated with a particular waveform

    Returns:
        Response: A symbolic 200 response signifying success
    """
    if request.is_json:
        token = request.args.get("token")
        req = None
        user = None
        tag = None
        comments = None
        event_id = None
        run_id = None
        try:
            req = request.get_json()
            user = req["user"]
            tag = req["tag"]
            event_id = req["event_id"]
            run_id = req["run_id"]
        except:
            return make_response(jsonify({"error": "Bad Request"}), 400)
        if not authenticate(user, token):
            return make_response(jsonify({"error": "Unauthorized API request"}), 403)
        try:
            comments = req["comments"]  # Optional
        except KeyError:
            comments = ""
        # Update database in another thread
        threading.Thread(
            target=update_db_new_tag, args=(user, run_id, event_id, tag, comments)
        ).start()
        return make_response(jsonify({"success": True}), 200)
    else:
        return make_response(jsonify({"error": "Bad Request"}), 400)


@app.route("/api/dw", methods=["POST"])
def delete_waveform():
    """
    Deletes a waveform associated with a tag

    Returns:
        Response: A symbolic 200 response signifying success
    """
    if request.is_json:
        req = request.get_json()
        print(req)
        user = None
        tag = None
        try:
            user = req["user"]
            tag = req["tag"]
        except:
            return make_response(jsonify({"error": "Bad Request"}), 400)
        token = request.args.get("token")
        if not authenticate(user, token):
            return make_response(jsonify({"error": "Unauthorized API request"}), 403)
        # Update database
        mongo_document = my_app.find_one(
            {"user": user, "tags_data." + tag: {"$exists": True}}
        )
        if mongo_document:
            print("#DELETING mongo document found: ")
            my_app.update_one(
                {"user": user, "tags_data." + tag: {"$exists": True}},
                {"$pull": {"tags_data": {tag: {"$exists": True}},}},
            )
        return make_response(jsonify({"success": True}), 200)
    else:
        return make_response(jsonify({"error": "Bad Request"}), 400)


if __name__ == "__main__":
    # LOG.info('running environment: %s', os.environ.get('ENV'))
    app.config["DEBUG"] = os.environ.get("ENV") == "development"  # debug mode
    app.run(host="0.0.0.0", port=int(PORT), threaded=True)  # Run the app
