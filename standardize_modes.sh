#!/bin/bash
# Standardize session modes in the database

# Activate the conda environment
source ~/miniconda3/etc/profile.d/conda.sh
conda activate goAIME

# Run the standardization script
python fix_db_contest_mode.py

# Log the output
echo "Script completed at $(date)" >> mode_update.log
