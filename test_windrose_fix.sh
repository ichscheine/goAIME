#!/bin/bash
# Script to test the wind rose chart fix
# This script runs the backend and frontend, then tests the wind rose chart with a specific user

echo "===== Testing Wind Rose Chart Fix ====="

# 1. Run the verification script to check the user's topic performance data
echo -e "\n\033[1;34mChecking topic performance data for test_user_good_performer...\033[0m"
python3 verify_windrose_update.py test_user_good_performer

# 2. Start the backend server (if not already running)
echo -e "\n\033[1;34mStarting the backend server (if not already running)...\033[0m"
pgrep -f "python3 app.py" > /dev/null
if [ $? -ne 0 ]; then
  echo "Backend not running, starting it in a new terminal..."
  osascript -e 'tell application "Terminal" to do script "cd /Users/daoming/Documents/Github/goAIME/backend && python3 app.py"'
  sleep 5
else
  echo "Backend already running"
fi

# 3. Start the frontend server (if not already running)
echo -e "\n\033[1;34mStarting the frontend (if not already running)...\033[0m"
pgrep -f "npm start" > /dev/null
if [ $? -ne 0 ]; then
  echo "Frontend not running, starting it in a new terminal..."
  osascript -e 'tell application "Terminal" to do script "cd /Users/daoming/Documents/Github/goAIME/frontend && npm start"'
  sleep 10
else
  echo "Frontend already running"
fi

# 4. Provide instructions to test the fix
echo -e "\n\033[1;32mTest the wind rose chart fix with these steps:\033[0m"
echo "1. Open a browser and navigate to http://localhost:3000/login"
echo "2. Log in with username: test_user_good_performer and password: password"
echo "3. Navigate to the Progress Tracking page"
echo "4. Open browser developer tools (F12) and go to the Console tab"
echo "5. Run the following code in the console to test the wind rose chart:"
echo -e "\033[0;36m"
cat fix_windrose_chart_update.js
echo -e "\033[0m"
echo "6. Check if all topics are now displayed in the wind rose chart"
echo "7. If issues persist, check the console logs for errors"

echo -e "\n\033[1;33mRemember to restart the frontend after making code changes!\033[0m"
echo "You can do this by pressing Ctrl+C in the frontend terminal and running 'npm start' again."
