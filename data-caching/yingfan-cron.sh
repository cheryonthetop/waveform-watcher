#!/bin/bash
#SBATCH --job-name=straxlab
#SBATCH --output=/project2/lgrandi/xenonnt/development/.tmp_for_jupyter_job_launcher/tmp5_LHwG
#SBATCH --error=/project2/lgrandi/xenonnt/development/.tmp_for_jupyter_job_launcher/tmp5_LHwG
#SBATCH --account=pi-lgrandi
#SBATCH --ntasks=1
#SBATCH --cpus-per-task=1
#SBATCH --mem-per-cpu=4480
#SBATCH --time=16:00:00
#SBATCH --qos xenon1t
#SBATCH --partition xenon1t
#SBATCH --reservation=xenon_notebook

/bin/python /usr/yingfan/waveform_service_dali.py