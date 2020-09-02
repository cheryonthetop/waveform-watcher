import straxen
st = straxen.contexts.xenon1t_dali()
st.set_context_config({'fuzzy_for': ('pulse_counts', 'lone_hits')})
run = "170204_1410"
peaks = st.get_array(run, "peaks")
print(peaks)
event = st.get_array(run, "event_info")[0]
waveform = st.waveform_display(run, time_within=event)
print(waveform)