import pymongo
import straxen
import time
import os
import datetime

# Connect to MongoDB
APP_DB_URI = os.environ.get("APP_DB_URI", None)
if (APP_DB_URI == None):
    print("MongoDB Connection String Not Set")
my_db = pymongo.MongoClient(APP_DB_URI)["waveform"]
my_run = my_db["run"]

def upload_run():
    # Upload run once a day
    while True:
        print("starts updating runs at ", datetime.datetime.now())
        st = straxen.contexts.xenon1t_dali()
        runs = st.select_runs()['name']
        runs = [run for run in runs]
        post = {'runs': runs}
        document = my_run.find_one(post)
        if (document == None):
            my_run.delete_many({})
            my_run.insert_one(post)
            print("inserted run at ", datetime.datetime.now())
        time.sleep(60 * 60 * 24)
        
if __name__ == "__main__":
    upload_run()
