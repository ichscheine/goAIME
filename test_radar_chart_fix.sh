#!/bin/bash

# This script tests the fix for the radar chart visualization to ensure
# peer best values appear at their absolute positions

echo "Testing radar chart visualization fix..."

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
echo "4. Check the radar chart - peer best values should appear at their actual percentages"
echo "   - E.g., 24% accuracy should appear at 24% of the chart radius"
echo "5. Verify through the browser console that the correct values are being logged:"
echo "   - Look for 'Peer triangle values (absolute percentages):' log entry"
echo "================================================================="
echo ""
echo "Press Ctrl+C in each terminal window to stop the servers when done testing."
