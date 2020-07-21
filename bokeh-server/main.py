
import os
from bokeh.layouts import column, gridplot, row
from bokeh.plotting import figure, curdoc
from bokeh.models import ColumnDataSource, CustomJS, OpenURL, TapTool, Button, TextInput, MultiSelect, Div
import holoviews as hv
import pymongo

hv.extension("bokeh")

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

# The URL of the app (front-end)
if os.environ.get("ENV") == "production":
    APP_URL = os.environ.get("APP_URL", None)  
else: 
    APP_URL = "http://localhost:3000"
if (APP_URL == None):
    print("Env Variable APP_URL Is Not Set")

# Connect to MongoDB
APP_DB_URI = os.environ.get("APP_DB_URI", None)
if (APP_DB_URI == None):
    print("MongoDB Connection String Not Set")    
    
my_db = pymongo.MongoClient(APP_DB_URI)["waveform"]
my_request = my_db["request"]
my_events = my_db["events"]

##### DB routine helpers
def cache_waveform_request(run_id, event_id):
    print("cacheing waveform for run ", run_id, "and event ", event_id)
    document = my_request.find_one({"run_id" : run_id, "event_id" : event_id})
    # cache to request if not already in it
    if (document == None):
        post = {"status" : "new", "run_id" : run_id, "event_id" : event_id, "request": "waveform"}
        my_request.insert_one(post) # insert mongo document into 'fetch'

def get_events(run_id):
    events = None
    document = my_events.find_one({"run_id" : run_id})
    if (document):
        if (document["events"]):
            events = pd.DataFrame(pickle.loads(document["events"]))
        else:
            return document["msg"]
    return events

def wait_for_events(run_id):
    # wait for 5 minutes max
    endtime = datetime.datetime.now() + datetime.timedelta(0, 60 * 5)
    while True:
        events = get_events(run_id)
        if (isinstance(events, pd.DataFrame)):
            print("retrieved events")
            return events
        print("Still Getting Events...")
        # Wait for waveform to be loaded
        time.sleep(10)
        if (datetime.datetime.now() >= endtime):
            return "Get Events Timeout. Please Try Again."

def render_events(run_id, events):
    source = ColumnDataSource(events)

    # Other components (or models or widgets in Bokeh terms)
    text_input = TextInput(value=run_id, title="Events for Run: ")
    multi_select = MultiSelect(title="Selected Events:", value=[], options=[])
    multi_select.width=600

    def callback_select(attr, old, new):
        print("selected data")
        inds = new
        print(inds)
        for i in range(0, len(inds)):
            event = str(source.data['event_number'][inds[i]])
            if event not in multi_select.options:
                multi_select.options.append(str(event))
            
    source.selected.on_change('indices', callback_select)

    def callback_value_selected(attr, old, new):
        print("new value callback")
        value = new
        if len(value) != 0:
            button.disabled = False

    multi_select.on_change("value", callback_value_selected)
    plots = []
    # use the "color" column of the Csource to complete the URL
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
            
    # create a callback that will cache waveform
    def callback_button():
        events = multi_select.value
        events = [int(event) for event in events]
        for event in events:
            cache_waveform_request(run_id, event)    

    # add a button widget and configure with the call back
    button = Button(label="Cache Waveform for Selected Events")
    button.on_click(callback_button)
    button.disabled = len(multi_select.value) == 0
    button.align="center"
    button.height=40
    button.margin=(10,0,0,0)

    # put the button and plot in a layout and add to the document
    curdoc().add_root(column(text_input, row(multi_select, button), grid))

###### Appends model to document

# request.arguments is a dict that maps argument names to lists of strings,
# e.g, the query string ?N=10 will result in {'N': [b'10']}
args = curdoc().session_context.request.arguments

run_id = str(args.get('run')[0])
print("Received run" + run_id)

events = wait_for_events(run_id)
if (isinstance(events, str)):
    # An error string returned
    div = Div(text=events)
    div.align="center"
    div.sizing_mode="stretch_both"
    curdoc().add_root(column(div))
else:
    render_events(run_id, events)