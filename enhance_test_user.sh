#!/bin/bash
# filepath: /Users/daoming/Documents/Github/goAIME/enhance_test_user.sh

# Set the current directory to the project root
cd "$(dirname "$0")"

# Log file
LOG_FILE="enhance_test_user_$(date +%Y%m%d_%H%M%S).log"
echo "Starting script execution at $(date)" > "$LOG_FILE"

# Check if the goAIME conda environment exists and activate it
if conda info --envs | grep -q "goAIME"; then
    echo "Activating goAIME conda environment..." | tee -a "$LOG_FILE"
    source "$(conda info --base)/etc/profile.d/conda.sh"
    conda activate goAIME
else
    echo "Warning: goAIME conda environment not found. Using base environment." | tee -a "$LOG_FILE"
fi

# Run the Python script and capture output to log file
echo "Running create_test_user_enhanced.py..." | tee -a "$LOG_FILE"
python create_test_user_enhanced.py 2>&1 | tee -a "$LOG_FILE"

# Check the exit status
if [ $? -eq 0 ]; then
    echo "Script executed successfully." | tee -a "$LOG_FILE"
else
    echo "Script execution failed." | tee -a "$LOG_FILE"
fi

echo "Log file created: $LOG_FILE"
