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
from functools import partial
from helpers import (
    get_events_from_cache,
    wait_for_events,
    get_run,
    enable_btn,
    disable_btn,
    clear_options,
    update_options,
    update_source,
)

hv.extension("bokeh")
# Fixed Parameter in Plots
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

###### Building the document

doc = curdoc()
session_id = doc.session_context.id
print(session_id)
run_id = get_run(session_id)

# The columns for the data source
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

# Data source of all the events. Populate with a dummy source
# before the real data is retrieved
default = pd.DataFrame()
for col in columns:
    default[col] = [0]
source = ColumnDataSource(data=default)


def retrieve_events():
    """
    Retrieves the events from the database and updates the source
    """
    events = wait_for_events(run_id)
    doc.add_next_tick_callback(partial(update_source, source=source, events=events))


thread = threading.Thread(target=retrieve_events)
thread.start()


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
    threading.Thread(target=update_selected, args=[new]).start()


def update_selected(new):
    """
    Updates the options in the multi select box with the user-selected
    data

    Args:
        new (list): The list selected values
    """
    inds = new
    if len(inds) != 0:
        doc.add_next_tick_callback(partial(enable_btn, btn=btn_clear))
    for i in range(0, len(inds)):
        event = str(source.data["event_number"][inds[i]])
        doc.add_next_tick_callback(
            partial(update_options, multi_select=multi_select, event=event)
        )


source.selected.on_change("indices", callback_select)


def callback_value_selected(attr, old, new):
    """
    Callback invoked when an option in multi_select is selected (and
    therefore becomes a value). This enables the buttons that view and delete
    selected options (our events)

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
        doc.add_next_tick_callback(partial(enable_btn, btn=btn_waveform))
    else:
        doc.add_next_tick_callback(partial(disable_btn, btn=btn_waveform))


# A multi select box to choose events from
multi_select = MultiSelect(title="Selected Events:", value=[], options=[])
multi_select.width = 700
multi_select.height = 100
multi_select.on_change("value", callback_value_selected)

# Text box to indicate run
text_input = TextInput(value=run_id, title="Events for Run: ")

# add a btn to view waveform
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
btn_waveform = Button(label="View Waveform for Chosen Events")
btn_waveform.js_on_click(callback_btn_waveform)
btn_waveform.disabled = True
btn_waveform.align = "center"
btn_waveform.height = 30
btn_waveform.margin = (20, 0, 0, 0)

# add a btn to clear all options in multi select
def callback_btn_clear():
    """
    Clears all optiosn in the multi select and disables buttons
    """
    doc.add_next_tick_callback(partial(disable_btn, btn=btn_clear))
    doc.add_next_tick_callback(partial(disable_btn, btn=btn_waveform))
    doc.add_next_tick_callback(partial(clear_options, multi_select=multi_select))


btn_clear = Button(label="Clear Options")
btn_clear.disabled = True
btn_clear.align = "center"
btn_clear.height = 30
btn_clear.margin = (10, 0, 0, 0)
btn_clear.on_click(callback_btn_clear)


# Create the plots with a TapTool URL callback
plots = []
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
grid = gridplot([plots[:3], plots[3:]], plot_width=400, plot_height=300)

doc.add_root(
    column(text_input, row(multi_select, column(btn_waveform, btn_clear)), grid,)
)
print("Inserted layout")
