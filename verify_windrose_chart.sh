#!/bin/bash
# Script to open the wind rose accuracy verification file in a browser

# Get the full path to the HTML file
HTML_FILE="$(pwd)/verify_windrose_accuracy.html"

# Check if the file exists
if [ ! -f "$HTML_FILE" ]; then
    echo "Error: File $HTML_FILE not found"
    exit 1
fi

echo "==================================================="
echo "Wind Rose Chart Verification:"
echo "==================================================="
echo "1. Coloring is now based on standard accuracy (correct/attempted)"
echo "2. Color thresholds:"
echo "   - GREEN: >75% accuracy"
echo "   - YELLOW: 50-75% accuracy"
echo "   - RED: <50% accuracy"
echo "3. The tooltip shows both standard accuracy and session-based accuracy"
echo "4. Legend updated to clarify accuracy calculation method"
echo "==================================================="

# Open the file in the default browser
echo "Opening $HTML_FILE in your default browser..."

# Use the appropriate command based on OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open "$HTML_FILE"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    xdg-open "$HTML_FILE"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    # Windows
    start "$HTML_FILE"
else
    echo "Unable to open browser automatically. Please open this file manually:"
    echo "$HTML_FILE"
fi

echo "Verification complete. Check browser for visual confirmation."
echo "==================================================="
