#!/bin/bash

# This script tests the real cohort metrics API endpoint

echo "Testing cohort metrics API endpoint..."
echo "Fetching metrics for test user 'testuser'..."

# Make API request to the cohort metrics endpoint - save to file
echo "API Response:"
curl -s http://localhost:5000/api/cohort/metrics/testuser > /tmp/api_response.json
cat /tmp/api_response.json

# Extract specific values for analysis
echo ""
echo "==== Running the backend with log redirection ===="
echo "Starting the backend in a new terminal window with log redirection..."
echo "Press Ctrl+C in the new terminal window to stop the backend when done."

# Start the backend server with log redirection in a separate terminal
osascript -e 'tell application "Terminal" to do script "cd '"$PWD"'/backend && python app.py > /tmp/goAIME_backend.log 2>&1"'

echo ""
echo "Waiting 5 seconds for the backend to start..."
sleep 5

echo ""
echo "Making a new request to the API..."
curl -s http://localhost:5000/api/cohort/metrics/testuser > /tmp/api_response.json

echo ""
echo "Checking backend logs for debug output..."
if [ -f "/tmp/goAIME_backend.log" ]; then
    echo "Found log file. Showing debug messages:"
    grep -A 5 "DEBUG: Cohort accuracy" /tmp/goAIME_backend.log || echo "No debug messages found"
else
    echo "Backend log file not found."
fi

echo ""
echo "Testing complete."
