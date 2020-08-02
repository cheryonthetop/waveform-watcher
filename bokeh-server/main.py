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
import pandas as pd
import threading
from tornado import gen
from functools import partial
from helpers import cache_waveform_request, get_events_from_cache, wait_for_events, get_run

hv.extension("bokeh")
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

###### Appends model to document
doc = curdoc()
session_id = doc.session_context.id
print(session_id)
run_id = get_run(session_id)

columns = [
    "cs1",
    "cs2",
    "z",
    "r",
    "e_light",
    "e_charge",
    "e_light",
    "e_ces",
    "drift_time",
    "n_peaks",
    "event_number",
]
default = pd.DataFrame()
for col in columns:
    default[col] = [0]
source = ColumnDataSource(data=default)
    
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
    # threading.Thread(partial(update_selceted, new=new)).start()
    # def update_selected(new):
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

doc.add_root(
    column(
        text_input,
        row(multi_select, column(btn_cache_selected, btn_cache_all, btn_waveform),),
        grid,
    )
)
print("Inserted layout")

@gen.coroutine
def update(events):
    source.update(data=events)
    # source = events

def blocking_task():
    events = wait_for_events(run_id)
    # new_events = {}
    # for dim in dims:
    #     new_events[dim] = [1, 2, 3, 4, 5]
    # but update the document from callback
    doc.add_next_tick_callback(partial(update, events=events))

thread = threading.Thread(target=blocking_task)
thread.start()