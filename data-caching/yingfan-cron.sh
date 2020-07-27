#!/bin/bash
#SBATCH --job-name=waveform_watching_service
#SBATCH --output=cron.log
#SBATCH --account=yingfan
#SBATCH --open-mode=append
#SBATCH --qos=cron
#SBATCH --partition=cron

# Specify a valid Cron string for the schedule. This specifies that
# the Cron job run once per day at 7:00a.
SCHEDULE='00 7 * * *'

/bin/python /usr/yingfan/waveform_service_dali.py

sbatch --quiet --begin=$(next-cron-time "$SCHEDULE") cron.sbatch