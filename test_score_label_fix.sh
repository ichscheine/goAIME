#!/bin/bash

# This script tests the Score display and axis labeling fix for the radar chart

echo "Testing Score display and axis labeling fix for radar chart..."

# Start the backend server in a separate terminal
echo "Starting the backend server in a new terminal window..."
osascript -e 'tell application "Terminal" to do script "cd '"$PWD"' && ./start_backend.sh"'

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 5

# Start the frontend server in a separate terminal
echo "Starting the frontend server in a new terminal window..."
osascript -e 'tell application "Terminal" to do script "cd '"$PWD"' && ./start_frontend.sh"'

# Wait for frontend to start
echo "Waiting for frontend to start..."
sleep 10

# Provide instructions for testing
echo ""
echo "================================================================="
echo "SCORE DISPLAY AND AXIS LABELING TESTING INSTRUCTIONS"
echo "================================================================="
echo "1. Open a browser and navigate to http://localhost:3000"
echo "2. Login with username 'goAmy' (or any user with progress data)"
echo "3. Navigate to the Progress Dashboard"
echo "4. Check the radar chart and verify the following:"
echo "   a. The Score metric now shows the raw score value (e.g., '17.3') instead of a percentage"
echo "   b. The Score axis is labeled as 'Score (out of 25)'"
echo "   c. The Score axis scale shows actual score values (6, 12, 19, 25) with 'pts' indicators"
echo "   d. The Score axis line is thicker and more prominent than the other axes"
echo "   e. The chart's right side still shows percentage values for reference"
echo "5. The changes should make it clearer that Score is measured on a 25-point scale"
echo "================================================================="
echo ""
echo "Press Ctrl+C in each terminal window to stop the servers when done testing."
