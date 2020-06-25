from holoviews_waveform_display import waveform_display
import strax
from context import xenon1t_dali
import numpy as np
run_id = "170204_1710"
context = xenon1t_dali(build_lowlevel=True)
event = np.load("event.npy")
print(event)
waveform_display(context = context, run_id = str(run_id), time_within=event)