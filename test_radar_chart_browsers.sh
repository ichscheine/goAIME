#!/bin/bash

echo "Testing radar chart cross-browser compatibility..."

# Check for browser installations
echo "Checking installed browsers..."

BROWSERS=()
BROWSER_COMMANDS=()

if [ -d "/Applications/Google Chrome.app" ]; then
  BROWSERS+=("Chrome")
  BROWSER_COMMANDS+=("open -a \"Google Chrome\" http://localhost:3000/progress/goamy")
fi

if [ -d "/Applications/Safari.app" ]; then
  BROWSERS+=("Safari")
  BROWSER_COMMANDS+=("open -a Safari http://localhost:3000/progress/goamy")
fi

if [ -d "/Applications/Firefox.app" ]; then
  BROWSERS+=("Firefox")
  BROWSER_COMMANDS+=("open -a Firefox http://localhost:3000/progress/goamy")
fi

echo "Found ${#BROWSERS[@]} browsers: ${BROWSERS[*]}"

# Ensure the frontend is running
cd /Users/daoming/Documents/Github/goAIME/frontend
if ! curl -s http://localhost:3000 > /dev/null; then
  echo "Frontend doesn't seem to be running. Starting it..."
  npm start &
  sleep 10
fi

# Open in each browser sequentially
for i in "${!BROWSERS[@]}"; do
  echo "Opening in ${BROWSERS[$i]}..."
  eval "${BROWSER_COMMANDS[$i]}"
  sleep 3
done

echo ""
echo "Please verify the radar chart display in each browser:"
echo "1. Check that the radar chart is not overlapping with the left boxes"
echo "2. Verify that all radar chart elements are visible"
echo "3. Confirm that percentiles and metrics are properly aligned"
echo ""
