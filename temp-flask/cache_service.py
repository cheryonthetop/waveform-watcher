import pickle
import threading
from threading import Thread
import os
from bson.binary import Binary
import straxen
import strax
import pymongo
import time
from context import xenon1t_dali

# Get the number of processors/cores available in the system
cpu_count = os.cpu_count()
print("Number of processors/cores available in the system: ", cpu_count)

APP_DB_URI = os.environ.get("APP_DB_URI", None)
my_db = pymongo.MongoClient(APP_DB_URI)["waveform"]
my_request = my_db["request"]
my_event = my_db["event"]
st = xenon1t_dali()

def load_data(run_id, event_id):
    df = st.get_array(run_id, "event_info")
    event = df[int(event_id)]
    # Serialize data
    event_pkl_bin = Binary(pickle.dumps(event, protocol=2))
    return event_pkl_bin

def cache_data(run_id, event_id, event, msg):
    post = {"event_id" : event_id, "run_id" : run_id, "event": event, "msg": msg}
    document = my_event.find_one(post)
    if (document == None):
        my_event.insert_one(post)

def fetch_request():
    while True:
        document = my_request.find_one_and_update({"status": "new"}, 
                                                  {"$set" : {"status": "use"}})
        while (document):
            event_id = document["event_id"]
            run_id = document["run_id"]
            try:
                event = load_data(run_id, event_id)
                cache_data(run_id, event_id, event, "")
            except Exception as e:
                cache_data(run_id, event_id, None, e.message)
            my_request.find_one_and_update({"status": "use", "event_id": event_id, "run_id": run_id}, 
                                           {"$set" : {"status": "old"}})
            print("Just cached the run ", run_id, "and event ", event_id)
            document = my_request.find_one_and_update({"status": "new"}, 
                                                      {"$set" : {"status": "use"}})
        # Sleep the app if no new requests
        time.sleep(10)

if __name__ == "__main__":
    for i in range(0, cpu_count):
        Thread(target=fetch_request).start()