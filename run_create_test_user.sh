#!/bin/bash
# filepath: /Users/daoming/Documents/Github/goAIME/run_create_test_user.sh

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

# Run the Python script
echo "Running create_test_user_db.py..."
python create_test_user_db.py
