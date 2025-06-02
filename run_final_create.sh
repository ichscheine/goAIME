#!/bin/bash
# filepath: /Users/daoming/Documents/Github/goAIME/run_final_create.sh

# Set the current directory to the project root
cd "$(dirname "$0")"

# Create a log file
LOG_FILE="test_user_creation_$(date +%Y%m%d_%H%M%S).log"

# Echo to both terminal and log file
echo "Starting test user creation script at $(date)" | tee "$LOG_FILE"

# Run the Python script and redirect all output to the log file
python final_create_test_user.py >> "$LOG_FILE" 2>&1

# Check the exit status
if [ $? -eq 0 ]; then
    echo "Script executed successfully." | tee -a "$LOG_FILE"
else
    echo "Script execution failed with exit code $?." | tee -a "$LOG_FILE"
fi

# Create a simple verification file that doesn't depend on Python
echo "Checking MongoDB collections (may fail if 'mongo' command isn't available)..." | tee -a "$LOG_FILE"
echo "show collections" | mongo goaime --quiet >> "$LOG_FILE" 2>&1

echo "Log file created: $LOG_FILE"
