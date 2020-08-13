#!/bin/bash
#SBATCH --job-name=waveform_caching_service
#SBATCH --ntasks=1
#SBATCH --cpus-per-task=1
#SBATCH --mem-per-cpu=2GB
#SBATCH --time=12:00:00
#SBATCH --account=pi-lgrandi
#SBATCH --partition=xenon1t
#SBATCH --qos=xenon1t
#SBATCH --output=/home/yingfan/waveform_caching_service/data_caching.log
#SBATCH --error=/home/yingfan/waveform_caching_service/data_caching.log
source /home/yingfan/waveform_caching_service/env.sh
module load singularity 
singularity exec --bind /project2 --bind /dali /project2/lgrandi/xenonnt/singularity-images/xenonnt-development.simg /home/yingfan/waveform_caching_service/runnable_dali.py