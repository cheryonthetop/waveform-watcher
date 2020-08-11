"""Dynamic holoviews-based waveform display
Note imports are inside function, to keep 'import straxen'
free of holoviews.
"""

import numpy as np
import pandas as pd
import straxen

def seconds_from(t, t_reference):
    return (t - t_reference) / int(1e9)


# Custom wheel zoom tool that only zooms in one dimension
def x_zoom_wheel():
    import bokeh.models
    return bokeh.models.WheelZoomTool(dimensions='width')


@straxen.mini_analysis(requires=['records'], hv_bokeh=True)
def hvdisp_plot_pmt_pattern(*, config, records, to_pe, array='bottom'):
    """Plot a PMT array, with colors showing the intensity
    of light observed in the time range
    :param array: 'top' or 'bottom', array to show
    """
    import holoviews as hv

    pmts = straxen.pmt_positions(xenon1t=config['n_tpc_pmts'] < 300)
    areas = np.bincount(records['channel'],
                        weights=records['area'] * to_pe[records['channel']],
                        minlength=len(pmts))

    # Which PMTs should we include?
    m = pmts['array'] == array
    pmts = pmts[m].copy()
    pmts['area'] = areas[m]

    f = 1.08
    pmts = hv.Dataset(
        pmts,
        kdims=[hv.Dimension('x',
                            unit='cm',
                            range=(-straxen.tpc_r * f, straxen.tpc_r * f)),
               hv.Dimension('y',
                            unit='cm',
                            range=(-straxen.tpc_r * f, straxen.tpc_r * f)),
               hv.Dimension('i', range=(0, config['n_tpc_pmts']), label='PMT number'),
               hv.Dimension('area', label='Area', unit='PE')])
    pmts = pmts.to(
        hv.Points,
        vdims=['area', 'i'],
        group='PMTPattern',
        label=array.capitalize()).opts(
        plot=dict(color_index=2,
                  tools=['hover'],
                  show_grid=False),
        style=dict(size=17,
                   cmap='plasma'))

    return pmts


def _records_to_points(*, records, to_pe, t_reference, config):
    """Return (holoviews.Points, time_stream) corresponding to records
    """
    import holoviews as hv

    areas_r = records['area'] * to_pe[records['channel']]

    # Create dataframe with record metadata
    df = pd.DataFrame(dict(
        area=areas_r,
        time=seconds_from(records['time']
                          + records['dt'] * records['length'] // 2,
                          t_reference),
        channel=records['channel']))

    rec_points = hv.Points(
        df,
        kdims=[hv.Dimension('time', label='Time', unit='sec'),
               hv.Dimension('channel',
                            label='PMT number',
                            range=(0, config['n_tpc_pmts']))],
        vdims=[hv.Dimension('area', label='Area', unit='pe')])

    time_stream = hv.streams.RangeX(source=rec_points)
    return rec_points, time_stream


@straxen.mini_analysis(requires=['records'], hv_bokeh=True)
def hvdisp_plot_records_2d(records, to_pe, config,
                           t_reference, width=500, time_stream=None):
    """Plot records in a dynamic 2D histogram of (time, pmt)
    :param width: Plot width in pixels
    :param time_stream: holoviews rangex stream to use. If provided,
    we assume records is already converted to points (which hopefully
    is what the stream is derived from)
    """
    import holoviews as hv
    import holoviews.operation.datashader

    if time_stream is None:
        # Records are still a dataframe, convert it to points
        records, time_stream = _records_to_points(
            records=records, to_pe=to_pe, t_reference=t_reference,
            config=config)
        
    
    # TODO: weigh by area?
    return hv.operation.datashader.dynspread(
            hv.operation.datashader.datashade(
                records,
                y_range=(0, config['n_tpc_pmts']),
                streams=[time_stream])).opts(
        plot=dict(
                  tools=[x_zoom_wheel(), 'xpan'],
                  default_tools=['save', 'pan', 'box_zoom', 'save', 'reset'],
                  show_grid=False)).opts(title="Time vs. Channel")


@straxen.mini_analysis(
    requires=['peaks', 'peak_basics'],
    hv_bokeh=True)
def hvdisp_plot_peak_waveforms(
        t_reference,
        time_range,
        peaks,
        width=500,
        show_largest=None,
        time_dim=None):
    """Plot the sum waveforms of peaks
    :param width: Plot width in pixels
    :param show_largest: Maximum number of peaks to show
    :param time_dim: Holoviews time dimension; will create new one
    if not provided.
    """
    import holoviews as hv

    if show_largest is not None and len(peaks) > show_largest:
        show_i = np.argsort(peaks['area'])[-show_largest::]
        peaks = peaks[show_i]

    curves = []
    for p in peaks:
        # label = {1: 's1', 2: 's2'}.get(
        #     p['type'], 'unknown')
        color = {1: 'b', 2: 'g'}.get(
            p['type'], 'k')

        # It's better to plot amplitude /time than per bin, since
        # sampling times are now variable
        y = p['data'][:p['length']] / p['dt']
        t_edges = np.arange(p['length'] + 1, dtype=np.int64)
        t_edges = t_edges * p['dt'] + p['time']
        t_edges = seconds_from(t_edges, t_reference)

        # Make a 'step' plot. Unlike matplotlib's steps-mid,
        # this also analyses the final edges correctly
        t_ = np.zeros(2 * len(y))
        y_ = np.zeros(2 * len(y))
        t_[0::2] = t_edges[:-1]
        t_[1::2] = t_edges[1:]
        y_[0::2] = y
        y_[1::2] = y

        if time_dim is None:
            time_dim = hv.Dimension('time', label='Time', unit='sec')

        curves.append(
            hv.Curve(dict(time=t_, amplitude=y_),
                     kdims=time_dim,
                     vdims=hv.Dimension('amplitude', label='Amplitude',
                                        unit='PE/ns'),
                     group='PeakSumWaveform').opts(style=dict(color=color)))

    return hv.Overlay(items=curves)


def _range_plot(f, full_time_range, t_reference, **kwargs):
    # The **bla is needed to disable some holoviews check
    # on the arguments...
    def wrapped(x_range, **kwargzz):
        if len(kwargzz):
            raise RuntimeError(f"Passed superfluous kwargs {kwargzz}")
        if x_range is None:
            x_range = seconds_from(np.asarray(full_time_range),
                                   t_reference)

        # Deal with strange time ranges -- not sure how these arise?
        x_range = np.nan_to_num(x_range)
        if x_range[1] == x_range[0]:
            x_range[1] += 1

        return f(time_range=(t_reference + int(x_range[0] * 1e9),
                             t_reference + int(x_range[1] * 1e9)),
                 t_reference=t_reference,
                 **kwargs)
    return wrapped


@straxen.mini_analysis(
    requires=['records', 'peaks', 'peak_basics'],
    hv_bokeh=True)
def waveform_display(
        context, run_id, to_pe, time_range, t_reference, records, peaks,
        config,
        width=500, show_largest=None):
    """Plot a waveform overview display"
    :param width: Plot width in pixels
    """
    import holoviews as hv

    records_points, time_stream = _records_to_points(records=records,
                                                     to_pe=to_pe,
                                                     t_reference=t_reference,
                                                     config=config)

    time_v_channel = context.hvdisp_plot_records_2d(
        run_id=run_id, to_pe=to_pe,
        records=records_points,
        
        time_stream=time_stream,
        time_range=time_range, t_reference=t_reference,
        # We don't need to cut these further, records we get are already cut
        # to the plot's maximum range by the mini_analysis logic
        # and datashader does the online cutting / rebinning / zooming.
        # This is fortunate, since we omitted 'endtime' from records_points!
        time_selection='skip')

    array_plot = {
        array: hv.DynamicMap(
            _range_plot(
                context.hvdisp_plot_pmt_pattern,
                run_id=run_id, to_pe=to_pe,
                records=records,
                full_time_range=time_range,
                t_reference=t_reference,
                time_selection='touching',
                array=array),
            streams=[time_stream])
        for array in ('top', 'bottom')}

    peak_wvs = hv.DynamicMap(
        _range_plot(
            context.hvdisp_plot_peak_waveforms,
            run_id=run_id,

            full_time_range=time_range,
            t_reference=t_reference,
            time_selection='touching',
            time_dim=records_points.kdims[0],
            peaks=peaks,
            show_largest=show_largest),
        streams=[time_stream])

    layout = time_v_channel.opts(responsive=True) + peak_wvs.opts(responsive=True) + array_plot['top'].opts(responsive=True) + array_plot['bottom'].opts(responsive=True)
    return layout.cols(2)

"""
Fetches run and waveform data and caches them into the DB
according to the user requests
"""

import pickle
import threading
from threading import Thread
import os
from bson.binary import Binary
import straxen
import holoviews as hv
import pymongo
import time
import bokeh
import pandas as pd
import traceback

# Bokeh backend setup
hv.extension("bokeh")
renderer = hv.renderer("bokeh")  # Bokeh Server
lock = threading.Lock()  # A Lock to address race condition

# Get the number of processors/cores available in the system
cpu_count = os.cpu_count()
print("Number of processors/cores available in the system: ", cpu_count)

APP_DB_URI = os.environ.get("APP_DB_URI", None)
if APP_DB_URI == None:
    print("MongoDB Connection String Not Set")
my_db = pymongo.MongoClient(APP_DB_URI)["waveform"]
my_request = my_db["request"]
my_waveform = my_db["waveform"]
my_events = my_db["events"]
dims = [
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
straxen.contexts.x1t_context_config['fuzzy_for'] = ('pulse_counts', 'lone_hits')
st = straxen.contexts.xenon1t_dali()


def load_waveform(run_id, event_id):
    """
    Renders a waveform

    Args:
        run_id (str): Run ID of the run
        event_id (str): Event ID of the event

    Returns:
        JSON-like str: The waveform of the event
    """
    df = st.get_array(run_id, "event_info")
    event = df[int(event_id)]
    waveform = waveform_display(context=st, run_id=run_id, time_within=event)
    lock.acquire()
    try:
        print("Waveform is: ", waveform)
        waveform = renderer.server_doc(waveform).roots[-1]
    finally:
        lock.release()
    waveform = bokeh.embed.json_item(waveform)
    return waveform


def load_events(run_id):
    """
    Loads the events for a run

    Args:
        run_id (str): Run ID of the run

    Returns:
        Binary: The binary data of the pickled dataframe
    """
    events = st.get_df(run_id, "event_info")
    new_events = pd.DataFrame()
    for dim in dims:
        new_events[dim] = events[dim]
    return Binary(pickle.dumps(new_events, protocol=4))


def cache_events(run_id, events, msg):
    """
    Caches the events into MongoDB

    Args:
        run_id (str): Run ID of the run
        events (Binary): Binary data of a pickled DataFrame
        msg (str): Error message, empty string if no error
    """
    post = {"run_id": run_id, "events": events, "msg": msg}
    document = my_events.find_one(post)
    if document == None:
        my_events.insert_one(post)


def cache_waveform(run_id, event_id, waveform, msg):
    """
    Caches the waveform into MongoDB

    Args:
        run_id (str): Run ID of the run
        event_id (str): Event ID of the event
        waveform (JSON-like str): The waveform
        msg (str): Error message, empty string if no error
    """
    post = {"event_id": event_id, "run_id": run_id, "waveform": waveform, "msg": msg}
    document = my_waveform.find_one(post)
    if document == None:
        my_waveform.insert_one(post)


def process_waveform(run_id, event_id):
    """
    Fetches/loads and caches waveform

    Args:
        run_id (str): Run ID of the run
        event_id (str): Event ID of the event
    """
    print("starts processing waveform for run ", run_id, " and ", event_id)
    try:
        waveform = load_waveform(run_id, event_id)
        cache_waveform(run_id, event_id, waveform, "")
    except Exception as e:
        print("An exception occured ")
        traceback.print_tb(e.__traceback__)
        if hasattr(e, "message"):
            cache_waveform(run_id, event_id, None, e.message)
        else:
            cache_waveform(run_id, event_id, None, "Data Not Available")
    finally:
        document = my_request.delete_one(
            {"status": "use", "run_id": run_id, "event_id": event_id}
        )
        print("Just cached the waveform for run ", run_id, "and event ", event_id)


def process_events(run_id):
    """
    Fetches/loads the events from a run

    Args:
        run_id (str): Run ID of the run
    """
    print("starts processing events for run ", run_id)
    try:
        events = load_events(run_id)
        cache_events(run_id, events, "")
    except Exception as e:
        print("An exception occured ", e)
        traceback.print_tb(e.__traceback__)
        if hasattr(e, "message"):
            cache_events(run_id, None, e.message)
        else:
            cache_events(run_id, None, "Data Not Available")
    finally:
        document = my_request.delete_one({"status": "use", "run_id": run_id})
        print("Just cached the events for run ", run_id)


def fetch_request():
    """
    Fetches and process requests
    """
    while True:
        document = my_request.find_one_and_update(
            {"status": "new"}, {"$set": {"status": "use"}}
        )
        while document:
            request = document["request"]
            if request == "waveform":
                run_id = document["run_id"]
                event_id = document["event_id"]
                process_waveform(run_id, event_id)
            else:
                run_id = document["run_id"]
                process_events(run_id)
            document = my_request.find_one_and_update(
                {"status": "new"}, {"$set": {"status": "use"}}
            )
        # Sleep the app if no new requests
        time.sleep(10)


if __name__ == "__main__":
    print("service starting")
    threads = []
    for i in range(0, min(8, cpu_count)):
        t = Thread(target=fetch_request, daemon=True)
        threads.append(t)
        t.start()
    # Main thread sleeps for 1 hour and terminates
    # Daemonic threads are terminated automatically
    time.sleep(60 * 60)
