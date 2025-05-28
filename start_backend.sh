#!/bin/bash

# Start script for goAIME backend
# This script ensures the proper environment is used and addresses common issues

# Set the current directory to the project root
cd "$(dirname "$0")"

# Print environment variables for debugging
echo "Checking environment variables..."
if [ -f .env ]; then
    echo "Found .env file in $(pwd)"
    # Export MongoDB URI from .env file
    export MONGODB_URI=$(grep MONGODB_URI .env | cut -d'=' -f2-)
    export MONGODB_DB=$(grep MONGODB_DB .env | cut -d'=' -f2-)
    echo "MongoDB database: $MONGODB_DB"
    echo "MongoDB URI configured (not showing for security)"
else
    echo "WARNING: No .env file found in $(pwd)"
fi

# Check if the goAIME conda environment exists
if conda info --envs | grep -q "goAIME"; then
    echo "Activating goAIME conda environment..."
    source "$(conda info --base)/etc/profile.d/conda.sh"
    conda activate goAIME
else
    echo "Warning: goAIME conda environment not found. Using base environment."
fi

# Force port 5002 to avoid conflicts
PORT=5001

echo "Starting backend server on port $PORT..."

# Override the port in the app.py file
export PORT=$PORT

# Run the Flask application with the correct python command
cd backend
python app.py

# If the server fails to start, provide debugging information
if [ $? -ne 0 ]; then
    echo "Server failed to start. Checking for issues..."
    echo "1. Port $PORT may be in use. Try a different port."
    echo "2. Database connection may be failing. Check your .env file."
    echo "3. Try running 'python -m pip install -r requirements.txt' to ensure all dependencies are installed."
fi
