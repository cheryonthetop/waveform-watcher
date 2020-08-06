#!/bin/bash
#SBATCH --job-name=yingfan_cron
#SBATCH --output=/home/yingfan/waveform_caching_service/cron.log
#SBATCH --account=cron-account
#SBATCH --open-mode=append
#SBATCH --qos=cron
#SBATCH --partition=cron

# Specify a valid Cron string for the schedule. This specifies that
# the Cron job run once per day at 7:00a.
SCHEDULE='00 7 * * *'

sbatch --quiet --begin=$(next-cron-time "$SCHEDULE") waveform-caching-service.sh