# """
# The Bokeh app serving the interactive plots of waveform events
# """

# import os
# from bokeh.layouts import column, gridplot, row
# from bokeh.plotting import figure, curdoc
# from bokeh.models import (
#     ColumnDataSource,
#     CustomJS,
#     OpenURL,
#     TapTool,
#     Button,
#     TextInput,
#     MultiSelect,
#     Div,
# )
# import holoviews as hv
# import pymongo
# import datetime
# import pickle
# import pandas as pd
# import time
# import threading
# from tornado import gen
# from functools import partial

# hv.extension("bokeh")
# # Current document
# doc = curdoc()
# run_id = None

# # Fixed Parameter in Plots for Event Selections
# DIMS = [
#     ["cs1", "cs2"],
#     ["z", "r"],
#     ["e_light", "e_charge"],
#     ["e_light", "e_ces"],
#     ["drift_time", "n_peaks"],
# ]
# COLORS = hv.Cycle("Category10").values
# TOOLS = [
#     "box_select",
#     "lasso_select",
#     "box_zoom",
#     "pan",
#     "wheel_zoom",
#     "hover",
#     "tap",
#     "save",
#     "reset",
# ]

# # The URL of the app (front-end)
# if os.environ.get("ENV") == "production":
#     APP_URL = os.environ.get("APP_URL", None)
# else:
#     APP_URL = "http://localhost:3000"
# if APP_URL == None:
#     print("Env Variable APP_URL Is Not Set")

# # Connect to MongoDB
# APP_DB_URI = os.environ.get("APP_DB_URI", None)
# if APP_DB_URI == None:
#     print("MongoDB Connection String Not Set")

# my_db = pymongo.MongoClient(APP_DB_URI)["waveform"]
# my_request = my_db["request"]
# my_events = my_db["events"]
# my_waveform = my_db["waveform"]

# ##### DB routine helpers
# def cache_waveform_request(run_id, event_id):
#     """
#     Inserts a request into the request collection that
#     asks for a waveform

#     Args:
#         run_id (str): Run ID of the run
#         event_id (str): Event ID of the event
#     """
#     print("cacheing waveform for run ", run_id, "and event ", event_id)
#     request = my_request.find_one({"run_id": run_id, "event_id": event_id})
#     waveform = my_waveform.find_one({"run_id": run_id, "event_id": event_id})
#     # cache to request if not already in it
#     if request == None and waveform == None:
#         post = {
#             "status": "new",
#             "run_id": run_id,
#             "event_id": event_id,
#             "request": "waveform",
#         }
#         my_request.insert_one(post)  # insert mongo document into 'fetch'


# def get_events_from_cache(run_id):
#     """
#     Gets events from the cache

#     Args:
#         run_id (str): Run ID of the run

#     Returns:
#         DataFrame: All events from the run with DIMS as the fields
#     """
#     events = None
#     document = my_events.find_one({"run_id": run_id})
#     if document:
#         if document["events"]:
#             events = pd.DataFrame(pickle.loads(document["events"]))
#         else:
#             return document["msg"]
#     return events


# def wait_for_events(run_id):
#     """
#     Repeatedly waits for events to be returned from the cache       

#     Args:
#         run_id (str): Run ID of the run

#     Returns:
#         DataFrame/str: A dataframe with all events from the run, or
#         an error message if the events are not retrieved, or a timeout message
#         to indicate the waveform has not yet been found in the cache for 5 minutes
#     """
#     # wait for 5 minutes max
#     endtime = datetime.datetime.now() + datetime.timedelta(0, 60 * 5)
#     while True:
#         events = get_events_from_cache(run_id)
#         if isinstance(events, pd.DataFrame):
#             print("retrieved events")
#             return events
#         print("Still Getting Events...")
#         # Wait for waveform to be loaded
#         time.sleep(10)
#         if datetime.datetime.now() >= endtime:
#             return "Get Events Timeout. Please Try Again."


# def render_events(run_id, events):
#     """
#     Renders the plots of events supporting interactive features
#     with Python and Javascript callbacks attached to the data source
#     and widget components

#     Args:
#         run_id (str): Run ID of the run
#         events (str): Event ID of the event
#     """
#     source = ColumnDataSource(events)

#     def callback_select(attr, old, new):
#         """
#         Callback invoked when a user selects data points from
#         the plots. They are synced to the source and trigger
#         updates to the options in the multi_select widget.

#         Args:
#             attr (str): Attributes that could be changed. In our case,
#             the attribute is indices. They change when a user selects
#             a datapoint that comes from the ColumnDataSource
#             old (type of the attribute): Old value of the changed attributes.
#             In our case, it is a list
#             new (type of the attribute): New value of the changed attributes. 
#             In our case, it is a list
#         """
#         print("selected data")
#         inds = new
#         print(inds)
#         if len(inds) != 0:
#             doc.add_next_tick_callback(enable_btn_cache_all)
#         for i in range(0, len(inds)):
#             event = str(source.data["event_number"][inds[i]])
#             doc.add_next_tick_callback(partial(update_options, event=event))

#     source.selected.on_change("indices", callback_select)

#     # Other components (or models or widgets in Bokeh terms)
#     text_input = TextInput(value=run_id, title="Events for Run: ")
#     multi_select = MultiSelect(title="Selected Events:", value=[], options=[])
#     multi_select.width = 600
#     multi_select.height = 100

#     @gen.coroutine
#     def update_options(event):
#         """
#         Updates the options in the multi_select widget

#         Args:
#             event (str): Event ID of the event
#         """
#         if event not in multi_select.options:
#             multi_select.options.append(event)

#     def callback_value_selected(attr, old, new):
#         """
#         Callback invoked when an option in multi_select is selected (and
#         therefore becomes a value). This enables the buttons that cache
#         and view selected options (our events)

#         Args:
#             attr (str): Attributes that could be changed. In our case,
#             the attribute is value. They change when a user selects
#             an option in the multi_select widget
#             old (type of the attribute): Old value of the changed attributes.
#             In our case, it is a list
#             new (type of the attribute): New value of the changed attributes. 
#             In our case, it is a list
#         """
#         value = new
#         if len(value) != 0:
#             doc.add_next_tick_callback(enable_btn_cache_selected)
#             doc.add_next_tick_callback(enable_btn_waveform)
#         else:
#             doc.add_next_tick_callback(disable_btn_cache_selected)
#             doc.add_next_tick_callback(disable_btn_waveform)

#     multi_select.on_change("value", callback_value_selected)

#     @gen.coroutine
#     def enable_btn_cache_selected():
#         """
#         Enables btn_cache_selected
#         """
#         btn_cache_selected.disabled = False

#     @gen.coroutine
#     def disable_btn_cache_selected():
#         """
#         Disables btn_cache_selected
#         """
#         btn_cache_selected.disabled = True

#     # create a callback that will cache waveform
#     def callback_btn_cache_selected():
#         """
#         Callback invoked when a user clicks the button that
#         caches selected events.
#         """
#         events = multi_select.value
#         events = [int(event) for event in events]
#         for event in events:
#             cache_waveform_request(run_id, event)

#     # add a btn_cache_selected widget and configure with the call back
#     btn_cache_selected = Button(label="Cache Waveform for Chosen Events")
#     btn_cache_selected.on_click(callback_btn_cache_selected)
#     btn_cache_selected.disabled = len(multi_select.value) == 0
#     btn_cache_selected.align = "center"
#     btn_cache_selected.height = 30
#     btn_cache_selected.margin = (10, 0, 0, 0)

#     @gen.coroutine
#     def enable_btn_cache_all():
#         """
#         Enables btn_cache_all
#         """
#         btn_cache_all.disabled = False

#     # create a callback that will cache all waveform
#     def callback_btn_cache_all():
#         """
#         Callback invoked when a user clicks the button
#         to cache all events.
#         """
#         events = multi_select.options
#         events = [int(event) for event in events]
#         for event in events:
#             cache_waveform_request(run_id, event)

#     # add a btn_cache_all widget and configure with the call back
#     btn_cache_all = Button(label="Cache Waveform for All Events")
#     btn_cache_all.on_click(callback_btn_cache_all)
#     btn_cache_all.disabled = len(multi_select.value) == 0
#     btn_cache_all.align = "center"
#     btn_cache_all.height = 30
#     btn_cache_all.margin = (10, 0, 0, 0)

#     @gen.coroutine
#     def enable_btn_waveform():
#         """
#         Enables btn_waveform
#         """
#         btn_waveform.disabled = False

#     @gen.coroutine
#     def disable_btn_waveform():
#         """
#         Disables btn_waveform
#         """
#         btn_waveform.disabled = True

#     code = """
#     var events = ms.value;
#     console.log(events);
#     for (event of events) {
#         console.log(event);
#         var url = `${app}/waveform/${run}/${event}`;
#         console.log(url);
#         window.open(url)
#     }
#     """
#     # create a Javascript callback that will open an URL to view waveform
#     callback_btn_waveform = CustomJS(
#         args=dict(ms=multi_select, run=run_id, app=APP_URL), code=code
#     )

#     # add a btn_cache_all widget and configure the call back
#     btn_waveform = Button(label="View Waveform for Chosen Events")
#     btn_waveform.js_on_click(callback_btn_waveform)
#     btn_waveform.disabled = len(multi_select.value) == 0
#     btn_waveform.align = "center"
#     btn_waveform.height = 30
#     btn_waveform.margin = (10, 0, 0, 0)

#     # Create the plots with a TapTool URL callback
#     plots = []
#     # use the "color" column of the Csource to complete the URL
#     # e.g. if the glyph at index 10 is selected, then @color
#     # will be replaced with source.data['color'][10]
#     url = "{APP_URL}/waveform/{run_id}/@event_number/".format(
#         APP_URL=APP_URL, run_id=run_id
#     )
#     for color, dim in zip(COLORS, DIMS):
#         p = figure(tools=TOOLS, x_axis_label=dim[0], y_axis_label=dim[1])
#         p.circle(dim[0], dim[1], source=source, alpha=0.6, color=color)
#         taptool = p.select(type=TapTool)
#         taptool.callback = OpenURL(url=url)
#         plots.append(p)
#     # make a grid
#     grid = gridplot([plots[:3], plots[3:]], plot_width=300, plot_height=300)

#     @gen.coroutine
#     def remove_layout():
#         """
#         # Remove roots before inserting
#         """
#         if len(doc.roots) != 0:
#             doc.remove_root(doc.roots[0])
#         print("Removed layout")

#     @gen.coroutine
#     def insert_layout():
#         """
#         Genearte layout and add to the document
#         """
#         doc.add_root(
#             column(
#                 text_input,
#                 row(
#                     multi_select,
#                     column(btn_cache_selected, btn_cache_all, btn_waveform),
#                 ),
#                 grid,
#             )
#         )
#         print("Inserted layout")

#     # doc.add_next_tick_callback(remove_layout)
#     doc.add_next_tick_callback(insert_layout)


# ###### Appends model to document

# # request.arguments is a dict that maps argument names to lists of strings,
# # e.g, the query string ?N=10 will result in {'N': [b'10']}
# args = doc.session_context.request.arguments

# try:
#     run_id = str(args.get("run")[0].decode("utf-8")).split("/")[0]
#     print("Received run " + run_id)
#     div = Div(
#         text="Connected to Bokeh Server, please wait for the plots to be rendered"
#     )
#     div.align = "center"
#     div.default_size = 500
#     wait_msg = row(div)
#     wait_msg.height = 1000
#     wait_msg.align = "center"
#     wait_msg.sizing_mode = "stretch_both"
#     wait_msg.margin = (200, 0, 0, 300)
#     doc.add_root(wait_msg)
# except:
#     print("no run id")


# def blocking_task():
#     """
#     Performs the blocking task of rendering the plots. 
#     This is carried out in a separate thread because 
#     the main thread has to be "free" to respond to the 
#     pull_session call from the Flask app with a script tag 
#     to establish a websocket connection to the frontend,
#     which is the whole point of this server. If we don't
#     perform this task in a separate thread, pull_session
#     won't be receiving the response due to timeout
#     """
#     print("waiting")
#     events = wait_for_events(run_id)
#     print("done waiting")
#     # if isinstance(events, str):
#     #     # An error string returned
#     #     div = Div(text=events)
#     #     div.align = "center"
#     #     div.sizing_mode = "stretch_both"
#     #     while len(doc.roots) != 0:
#     #         doc.remove_root(doc.roots[0])
#     #     doc.add_root(column(div))
#     # else:
#     render_events(run_id, events)


# t = threading.Thread(target=blocking_task)
# t.start()

"""
The Bokeh app serving the interactive plots of waveform events
"""

import os
from bokeh.layouts import column, gridplot, row
from bokeh.plotting import figure, curdoc
from bokeh.models import (
    ColumnDataSource,
    CustomJS,
    OpenURL,
    TapTool,
    Button,
    TextInput,
    MultiSelect,
    Div,
)
import holoviews as hv
import pymongo
import datetime
import pickle
import pandas as pd
import time
import threading
from tornado import gen
from functools import partial

hv.extension("bokeh")
# Current document
doc = curdoc()
run_id = None

# Fixed Parameter in Plots for Event Selections
DIMS = [
    ["cs1", "cs2"],
    ["z", "r"],
    ["e_light", "e_charge"],
    ["e_light", "e_ces"],
    ["drift_time", "n_peaks"],
]
COLORS = hv.Cycle("Category10").values
TOOLS = [
    "box_select",
    "lasso_select",
    "box_zoom",
    "pan",
    "wheel_zoom",
    "hover",
    "tap",
    "save",
    "reset",
]

# The URL of the app (front-end)
if os.environ.get("ENV") == "production":
    APP_URL = os.environ.get("APP_URL", None)
else:
    APP_URL = "http://localhost:3000"
if APP_URL == None:
    print("Env Variable APP_URL Is Not Set")

# Connect to MongoDB
APP_DB_URI = os.environ.get("APP_DB_URI", None)
if APP_DB_URI == None:
    print("MongoDB Connection String Not Set")

my_db = pymongo.MongoClient(APP_DB_URI)["waveform"]
my_request = my_db["request"]
my_events = my_db["events"]
my_waveform = my_db["waveform"]

##### DB routine helpers
def cache_waveform_request(run_id, event_id):
    """
    Inserts a request into the request collection that
    asks for a waveform

    Args:
        run_id (str): Run ID of the run
        event_id (str): Event ID of the event
    """
    print("cacheing waveform for run ", run_id, "and event ", event_id)
    request = my_request.find_one({"run_id": run_id, "event_id": event_id})
    waveform = my_waveform.find_one({"run_id": run_id, "event_id": event_id})
    # cache to request if not already in it
    if request == None and waveform == None:
        post = {
            "status": "new",
            "run_id": run_id,
            "event_id": event_id,
            "request": "waveform",
        }
        my_request.insert_one(post)  # insert mongo document into 'fetch'


def get_events_from_cache(run_id):
    """
    Gets events from the cache

    Args:
        run_id (str): Run ID of the run

    Returns:
        DataFrame: All events from the run with DIMS as the fields
    """
    events = None
    document = my_events.find_one({"run_id": run_id})
    if document:
        if document["events"]:
            events = pd.DataFrame(pickle.loads(document["events"]))
        else:
            return document["msg"]
    return events


def wait_for_events(run_id):
    """
    Repeatedly waits for events to be returned from the cache       

    Args:
        run_id (str): Run ID of the run

    Returns:
        DataFrame/str: A dataframe with all events from the run, or
        an error message if the events are not retrieved, or a timeout message
        to indicate the waveform has not yet been found in the cache for 5 minutes
    """
    # wait for 5 minutes max
    endtime = datetime.datetime.now() + datetime.timedelta(0, 60 * 5)
    while True:
        events = get_events_from_cache(run_id)
        if isinstance(events, pd.DataFrame):
            print("retrieved events")
            return events
        print("Still Getting Events...")
        # Wait for waveform to be loaded
        time.sleep(10)
        if datetime.datetime.now() >= endtime:
            return "Get Events Timeout. Please Try Again."


events = wait_for_events(run_id)
source = ColumnDataSource(events)
###### Appends model to document

# request.arguments is a dict that maps argument names to lists of strings,
# e.g, the query string ?N=10 will result in {'N': [b'10']}
args = curdoc().session_context.request.arguments

try:
    run_id = str(args.get("run")[0].decode("utf-8")).split("/")[0]
    print("Received run " + run_id)
except:
    print("no run id")


def callback_select(attr, old, new):
    """
    Callback invoked when a user selects data points from
    the plots. They are synced to the source and trigger
    updates to the options in the multi_select widget.

    Args:
        attr (str): Attributes that could be changed. In our case,
        the attribute is indices. They change when a user selects
        a datapoint that comes from the ColumnDataSource
        old (type of the attribute): Old value of the changed attributes.
        In our case, it is a list
        new (type of the attribute): New value of the changed attributes. 
        In our case, it is a list
    """
    print("selected data")
    inds = new
    print(inds)
    if len(inds) != 0:
        btn_cache_all.disabled = False
    for i in range(0, len(inds)):
        event = str(source.data["event_number"][inds[i]])
        update_options(event)


source.selected.on_change("indices", callback_select)

# Other components (or models or widgets in Bokeh terms)
text_input = TextInput(value=run_id, title="Events for Run: ")
multi_select = MultiSelect(title="Selected Events:", value=[], options=[])
multi_select.width = 600
multi_select.height = 100


def update_options(event):
    """
    Updates the options in the multi_select widget

    Args:
        event (str): Event ID of the event
    """
    if event not in multi_select.options:
        multi_select.options.append(event)


def callback_value_selected(attr, old, new):
    """
    Callback invoked when an option in multi_select is selected (and
    therefore becomes a value). This enables the buttons that cache
    and view selected options (our events)

    Args:
        attr (str): Attributes that could be changed. In our case,
        the attribute is value. They change when a user selects
        an option in the multi_select widget
        old (type of the attribute): Old value of the changed attributes.
        In our case, it is a list
        new (type of the attribute): New value of the changed attributes. 
        In our case, it is a list
    """
    value = new
    if len(value) != 0:
        btn_cache_selected.disabled = False
        btn_waveform.disabled = False
    else:
        btn_cache_selected.disabled = True
        btn_waveform.disabled = True


multi_select.on_change("value", callback_value_selected)

# create a callback that will cache waveform
def callback_btn_cache_selected():
    """
    Callback invoked when a user clicks the button that
    caches selected events.
    """
    events = multi_select.value
    events = [int(event) for event in events]
    for event in events:
        cache_waveform_request(run_id, event)


# add a btn_cache_selected widget and configure with the call back
btn_cache_selected = Button(label="Cache Waveform for Chosen Events")
btn_cache_selected.on_click(callback_btn_cache_selected)
btn_cache_selected.disabled = len(multi_select.value) == 0
btn_cache_selected.align = "center"
btn_cache_selected.height = 30
btn_cache_selected.margin = (10, 0, 0, 0)

# create a callback that will cache all waveform
def callback_btn_cache_all():
    """
    Callback invoked when a user clicks the button
    to cache all events.
    """
    events = multi_select.options
    events = [int(event) for event in events]
    for event in events:
        cache_waveform_request(run_id, event)


# add a btn_cache_all widget and configure with the call back
btn_cache_all = Button(label="Cache Waveform for All Events")
btn_cache_all.on_click(callback_btn_cache_all)
btn_cache_all.disabled = len(multi_select.value) == 0
btn_cache_all.align = "center"
btn_cache_all.height = 30
btn_cache_all.margin = (10, 0, 0, 0)

code = """
var events = ms.value;
console.log(events);
for (event of events) {
    console.log(event);
    var url = `${app}/waveform/${run}/${event}`;
    console.log(url);
    window.open(url)
}
"""
# create a Javascript callback that will open an URL to view waveform
callback_btn_waveform = CustomJS(
    args=dict(ms=multi_select, run=run_id, app=APP_URL), code=code
)

# add a btn_cache_all widget and configure the call back
btn_waveform = Button(label="View Waveform for Chosen Events")
btn_waveform.js_on_click(callback_btn_waveform)
btn_waveform.disabled = True
btn_waveform.align = "center"
btn_waveform.height = 30
btn_waveform.margin = (10, 0, 0, 0)

# Create the plots with a TapTool URL callback
plots = []
# use the "color" column of the Csource to complete the URL
# e.g. if the glyph at index 10 is selected, then @color
# will be replaced with source.data['color'][10]
url = "{APP_URL}/waveform/{run_id}/@event_number/".format(
    APP_URL=APP_URL, run_id=run_id
)
for color, dim in zip(COLORS, DIMS):
    p = figure(tools=TOOLS, x_axis_label=dim[0], y_axis_label=dim[1])
    p.circle(dim[0], dim[1], source=source, alpha=0.6, color=color)
    taptool = p.select(type=TapTool)
    taptool.callback = OpenURL(url=url)
    plots.append(p)
# make a grid
grid = gridplot([plots[:3], plots[3:]], plot_width=300, plot_height=300)

curdoc().add_root(
    column(
        text_input,
        row(multi_select, column(btn_cache_selected, btn_cache_all, btn_waveform),),
        grid,
    )
)
print("Inserted layout")
