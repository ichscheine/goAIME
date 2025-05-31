#!/bin/bash

# Check browser compatibility of the radar chart fixes
echo "Testing radar chart fixes in multiple browsers..."

# Define paths and browsers to test
PROJECT_DIR="/Users/daoming/Documents/Github/goAIME"
FRONTEND_DIR="$PROJECT_DIR/frontend"
BROWSERS=("chrome" "safari" "firefox")

# Create a report directory
REPORT_DIR="$PROJECT_DIR/browser_test_reports"
mkdir -p "$REPORT_DIR"

# Function to check if a browser is installed
check_browser() {
  local browser=$1
  if [ "$browser" = "chrome" ]; then
    if [ -d "/Applications/Google Chrome.app" ]; then
      return 0
    fi
  elif [ "$browser" = "safari" ]; then
    if [ -d "/Applications/Safari.app" ]; then
      return 0
    fi
  elif [ "$browser" = "firefox" ]; then
    if [ -d "/Applications/Firefox.app" ]; then
      return 0
    fi
  fi
  return 1
}

# Generate a report file
REPORT_FILE="$REPORT_DIR/radar_chart_compatibility_$(date +%Y%m%d_%H%M%S).md"
echo "# Radar Chart Browser Compatibility Report" > "$REPORT_FILE"
echo "Generated: $(date)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "## CSS Properties Used" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "### Key CSS Properties" >> "$REPORT_FILE"
echo "```css" >> "$REPORT_FILE"
echo "viewBox: -45 0 528 528" >> "$REPORT_FILE"
echo "transform: translateX(35px)" >> "$REPORT_FILE"
echo "margin-left: 30px" >> "$REPORT_FILE"
echo "padding-left: 40px" >> "$REPORT_FILE"
echo "grid-template-columns: 210px 1fr" >> "$REPORT_FILE"
echo "gap: 65px" >> "$REPORT_FILE"
echo "```" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Check browser support
echo "## Browser Support Status" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

for browser in "${BROWSERS[@]}"; do
  echo "### $browser" >> "$REPORT_FILE"
  
  if check_browser "$browser"; then
    echo "- [x] $browser is installed and can be tested" >> "$REPORT_FILE"
    
    # Add more detailed compatibility information for each browser
    if [ "$browser" = "chrome" ]; then
      echo "- Chrome has excellent support for CSS Grid, SVG viewBox, and CSS transforms" >> "$REPORT_FILE"
      echo "- Expected to display the radar chart correctly with no overlap" >> "$REPORT_FILE"
    elif [ "$browser" = "safari" ]; then
      echo "- Safari has good support for CSS Grid, SVG viewBox, and CSS transforms" >> "$REPORT_FILE"
      echo "- May need vendor prefixes for some transforms" >> "$REPORT_FILE"
      echo "- Check specifically for SVG rendering issues" >> "$REPORT_FILE"
    elif [ "$browser" = "firefox" ]; then
      echo "- Firefox has strong support for CSS Grid, SVG viewBox, and CSS transforms" >> "$REPORT_FILE"
      echo "- May handle grid-gap differently from other browsers" >> "$REPORT_FILE"
    fi
  else
    echo "- [ ] $browser is not installed" >> "$REPORT_FILE"
  fi
  
  echo "" >> "$REPORT_FILE"
done

echo "## Testing Instructions" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "1. Run the application in each browser" >> "$REPORT_FILE"
echo "2. Navigate to the Progress Dashboard" >> "$REPORT_FILE"
echo "3. Scroll to the 'Comparison with Peers' section" >> "$REPORT_FILE"
echo "4. Verify that the radar chart does not overlap with the left boxes" >> "$REPORT_FILE"
echo "5. Resize the browser window to test responsiveness" >> "$REPORT_FILE"
echo "6. Take screenshots for documentation" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "## Results Table" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "| Browser | Overlap Fixed | Responsive | Notes |" >> "$REPORT_FILE"
echo "|---------|---------------|------------|-------|" >> "$REPORT_FILE"
echo "| Chrome  |               |            |       |" >> "$REPORT_FILE"
echo "| Safari  |               |            |       |" >> "$REPORT_FILE"
echo "| Firefox |               |            |       |" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Instructions for manually filling out the report
echo "## Manual Testing Process" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "Please fill out the Results Table after testing in each browser. Mark cells with:" >> "$REPORT_FILE"
echo "- ✅ for successful fixes" >> "$REPORT_FILE"
echo "- ❌ for issues that remain" >> "$REPORT_FILE"
echo "- ⚠️ for partial fixes or concerns" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "Add detailed notes about any remaining issues or browser-specific behaviors." >> "$REPORT_FILE"

echo "Compatibility test report generated at: $REPORT_FILE"
echo "Please manually test in each browser and complete the report."
