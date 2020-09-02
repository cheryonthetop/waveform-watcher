import straxen
st = straxen.contexts.xenonnt_online()
st.set_context_config({'check_available': ('event_info','peak_basics')})
new = st.select_runs(available='peak_basics')['name'].values
import os
key = os.environ.get("APP_DB_URI")
import pymongo
runs = pymongo.MongoClient(key)['waveform']['run']
existing = runs.find_one({})['runs']
updated = [*existing, *new]
res = runs.update_one({}, {'$set': {'runs': updated}})
print(res)