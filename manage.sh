#!/bin/bash

# Management script for goAIME maintenance operations
# This script is a wrapper around the backend/manage.py command line tool

# Set the current directory to the project root
cd "$(dirname "$0")"

# Check if the goAIME conda environment exists and activate it
if conda info --envs | grep -q "goAIME"; then
    echo "Activating goAIME conda environment..."
    source "$(conda info --base)/etc/profile.d/conda.sh"
    conda activate goAIME
else
    echo "Warning: goAIME conda environment not found. Using base environment."
fi

# Run the management command
echo "Running management command: $@"
python backend/manage.py "$@"
