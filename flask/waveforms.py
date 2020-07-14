import panel as pn
import holoviews as hv
import param
import numpy as np
import pandas as pd
import datetime as dt
import strax
import straxen
from holoviews import dim, opts


pn.extension()
hv.extension("bokeh")

# Read live data
st = straxen.contexts.xenon1t_dali()
# runs = st.select_runs()
# run_ids = list(runs["name"])
# run_ids[:10]
run_id = "170204_1710"
events = st.get_df(run_id, 'event_info')
dset = hv.Dataset(events)

peaks = st.get_array(run_id, 'peaks')

class WaveformWatcher(param.Parameterized):
    # Fields
    DIMS = [
    ["cs1", "cs2"],
    ["z","r" ],
    ["e_light", 'e_charge'],
    ["e_light", 'e_ces'],
    ["drift_time", "n_peaks"],
    ]

    dates = param.DateRange(default=(dt.datetime(2016, 11, 10),dt.datetime.utcnow()), bounds=(dt.datetime(2016, 11, 10), dt.datetime.utcnow()))
    runs = param.List(default=[])
    sources = param.List(default=[])
    linked_selection = param.Parameter()
    selection_spaces = param.List(default=DIMS)
    events = param.DataFrame(default=pd.DataFrame())

    def __init__(self, **params):
        super().__init__(**params)
        self.linked_selection = hv.selection.link_selections.instance()

    
    @param.depends("selection_spaces", watch=True)
    def event_selection(self):
        """
        Plot events according to users' selection spaces of interests

        Returns:
            hv.Layout -- viewable plots to be displayed on web
        """
        # dset = hv.Dataset(self.events)
        # If use selects nothing, display cs1/cs2 plot by default
        if not self.selection_spaces:
            return hv.Points(dset, ["cs1", "cs2"]).opts(color="blue")

        # Use different color for each plot
        colors = hv.Cycle('Category10').values
        plots = [
            hv.Points(dset, dims).opts(color=c)
            for c, dims in zip(colors, self.selection_spaces)
        ]
        
        # Construct Layout to be viewed
        layout = hv.Layout(plots).cols(3)

        # Enables linked brushing
        layout = self.linked_selection(layout)

        return layout

    @param.depends("linked_selection.selection_expr")
    def selection(self): 
        """
        Preview selected events with properties


        Returns:
            hv.Table -- Viewable data table containing info about the event
        """
        # dset = hv.Dataset(self.events)

        # Event dataset table
        table = hv.Table(dset).opts(width=1550)

        
        # User selected datapoints in the plots
        if self.linked_selection and self.linked_selection.selection_expr:
            # what is APPLY and SELECTION_EXPR???
            selected = table[self.linked_selection.selection_expr.apply(table)]
            self.events = selected.data
            return selected

        # Everything is selected (User did not select any datapoint specifically)
        self.events = table.data
        return table

    def panel(self):
        date_picker =self.param.dates
        runs_picker = pn.widgets.MultiChoice(value=["181028_0045"], name="Runs",
            options=["181028_0045"], solid=False, width=1000)
        # runs_picker = pn.widgets.MultiChoice(value=["181028_0045"], name="Runs",
        #     options=list(runs), solid=False, width=1000)
        runs_picker.link(self, value="runs")
        source_picker = pn.widgets.CheckButtonGroup(value=["None"], name="Source",
            options=["None", "AmBe", "NG", "Rn220"])
        source_picker.link(self, value="source")

        selection_spaces = pn.widgets.CheckButtonGroup(value=self.DIMS, name="Selection spaces",
            options={f"{x} vs {y}": [x,y] for x,y in self.DIMS}, width=1000)
        selection_spaces.link(self, value="selection_spaces")
        
        return pn.Column(
            pn.layout.Divider(),
            pn.pane.Markdown("## First allow the user to load events by date range/run_id/source"),
            date_picker,
            runs_picker,
            pn.pane.Markdown("  Source"),
            source_picker,
            pn.layout.Divider(),
            pn.pane.Markdown("## Allow user to choose the selection spaces of interest e.g. cut spaces, energy etc."),
            selection_spaces,
            pn.pane.Markdown("## Plot events in selection spaces of interest for user to apply selections."),
            pn.panel(self.event_selection),
            pn.layout.Divider(),
            pn.pane.Markdown("## Preview selected events with properties"),
            self.selection,
            width=1600,
            css_classes=['watcher'])

# view = WaveformWatcher().panel()
# view.servable()