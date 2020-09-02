This directory is for files run on the dali machine. Specifically, simply run `sbatch cron-waveform.sh` in the directory on dali assuming you have already copied this directory to dali.

**cache_service** fetches request and caches waveform and events dataframe

**holoview_waveform_display** contains the custom functions to create a responsive layout specifically for the website. The original code is from [straxen](https://github.com/XENONnT/straxen/blob/master/straxen/analyses/holoviews_waveform_display.py)

**runnable_dali** is the two files above pieced together that can directly be run on dali.

**waveform_caching_service** is a batch script that runs the runnable_dali python script in singularity

**cron-waveform** is a batch script submitting a cron job which repeatedly executes waveform_caching_service
