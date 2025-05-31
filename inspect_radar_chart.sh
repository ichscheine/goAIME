#!/bin/zsh

# Script to visually inspect radar chart changes
# This script starts the application and provides instructions for visual inspection

echo "🚀 Starting Radar Chart Visual Inspection Tool"
echo "==============================================="

# Set working directory
PROJECT_DIR="/Users/daoming/Documents/Github/goAIME"
cd "$PROJECT_DIR"

# Create inspection results directory
RESULTS_DIR="$PROJECT_DIR/inspection_results"
mkdir -p "$RESULTS_DIR"

# Output file for results
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RESULTS_FILE="$RESULTS_DIR/radar_chart_inspection_$TIMESTAMP.md"

# Create results file header
cat > "$RESULTS_FILE" << EOL
# Radar Chart Visual Inspection Results
**Date:** $(date)

## Changes Implemented

1. **SVG ViewBox Adjustment**
   - Changed from \`-30 0 528 528\` to \`-45 0 528 528\`
   - Shifts entire radar chart to the right

2. **CSS Positioning Enhancements**
   - Increased radar chart section padding-left: 40px
   - Increased radar chart section margin-left: 35px
   - Increased radar chart transform: translateX(35px)
   - Increased SVG element translation: 15px

3. **Grid Layout Optimization**
   - Increased grid gap to 65px
   - Added browser-specific fixes for Firefox and Safari
   - Improved mobile responsiveness

4. **Container Layout**
   - Added minimum height to comparison container: 480px
   - Ensured consistent spacing and positioning

## Visual Inspection Checklist

| Check Item | Status | Notes |
|------------|--------|-------|
| Radar chart does not overlap left boxes | | |
| Chart is correctly centered in its section | | |
| Labels are clearly visible and not cut off | | |
| Mobile view displays correctly | | |
| Tablet view displays correctly | | |
| Desktop view displays correctly | | |
| No visual artifacts or rendering issues | | |
| Browser compatibility (Chrome) | | |
| Browser compatibility (Safari) | | |
| Browser compatibility (Firefox) | | |

## Screenshots
*Please attach screenshots of the radar chart in different views and browsers*

## Additional Notes


## Inspector Information
Name: 
Date: $(date +"%Y-%m-%d")
EOL

echo "📝 Created inspection report template at: $RESULTS_FILE"

# Instructions for the user
echo "\n📋 INSPECTION INSTRUCTIONS:"
echo "1. Start the application using your usual method (./start_frontend.sh and ./start_backend.sh)"
echo "2. Navigate to the Progress Dashboard"
echo "3. Scroll to the 'Comparison with Peers' section"
echo "4. Verify the radar chart positioning and appearance"
echo "5. Test in different browsers and screen sizes"
echo "6. Complete the checklist in the results file: $RESULTS_FILE"
echo "7. Add screenshots to document the current state"

echo "\n💡 TESTING SUGGESTIONS:"
echo "- Resize browser window to test responsiveness"
echo "- Use browser dev tools to simulate different devices"
echo "- Check for any overflow or cut-off elements"
echo "- Verify text readability and label positioning"

echo "\n🔍 After completing inspection, you can update the report with your findings."
echo "Would you like to start the application now? (y/n)"
read -r START_APP

if [[ "$START_APP" == "y" || "$START_APP" == "Y" ]]; then
  echo "Starting the application..."
  
  # Open separate terminal tabs/windows for frontend and backend
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open -a Terminal "$PROJECT_DIR/start_frontend.sh"
    sleep 2
    open -a Terminal "$PROJECT_DIR/start_backend.sh"
  else
    # Linux or other
    echo "Please start the application manually:"
    echo "- Run ./start_frontend.sh in one terminal"
    echo "- Run ./start_backend.sh in another terminal"
  fi
  
  echo "\nApplication startup initiated. Please follow the inspection instructions."
else
  echo "Please start the application manually when ready to perform inspection."
fi

echo "\nWhen finished, update the inspection report at: $RESULTS_FILE"
