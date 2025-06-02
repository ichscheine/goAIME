#!/bin/bash
# filepath: /Users/daoming/Documents/Github/goAIME/create_cloud_test_user.sh

# Set the current directory to the project root
cd "$(dirname "$0")"

echo "Starting test user creation process with cloud MongoDB..."

# Ensure we're using the conda environment
source "$(conda info --base)/etc/profile.d/conda.sh"
conda activate goAIME

# Run the script
python create_good_performer.py

# Check exit status
if [ $? -eq 0 ]; then
    echo "Test user creation completed successfully."
else
    echo "Error creating test user. Check the error messages above."
fi
