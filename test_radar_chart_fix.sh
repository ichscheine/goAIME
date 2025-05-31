#!/bin/bash

# This script tests the fix for the radar chart visualization and layout issues:
# 1. Ensures peer best values appear at their absolute positions
# 2. Fixes the radar chart left border overlapping with left boxes

echo "Testing radar chart visualization and layout fixes..."

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
echo "TESTING INSTRUCTIONS"
echo "================================================================="
echo "1. Open a browser and navigate to http://localhost:3000"
echo "2. Login with username 'goAmy' (or any user with progress data)"
echo "3. Navigate to the Progress Dashboard"
echo "4. Verify the radar chart fixes:"
echo "   a. Check that the radar chart's left border is not overlapping with left boxes"
echo "   b. Verify that peer best values appear at their actual percentages"
echo "   c. Ensure labels and points are properly positioned within the chart"
echo "5. Test responsiveness by resizing the browser window"
echo "6. Verify through the browser console that the correct values are being logged:"
echo "   - Look for 'Peer triangle values (absolute percentages):' log entry"
echo "================================================================="
echo ""
echo "Press Ctrl+C in each terminal window to stop the servers when done testing."
