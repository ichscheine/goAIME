#!/bin/bash

# Script to clean up and verify radar chart CSS fixes

echo "===================================================="
echo "CSS Files Cleanup and Verification"
echo "===================================================="

# Check if we're in the goAIME directory
if [[ ! -d "./frontend/src/components" ]]; then
  echo "Error: Please run this script from the goAIME project root directory"
  exit 1
fi

# Move to the components directory
cd ./frontend/src/components

# Create backup directory if it doesn't exist
if [[ ! -d "./unused_css_backups" ]]; then
  mkdir -p ./unused_css_backups
  echo "Created backup directory: ./unused_css_backups"
fi

# List of files to backup
FILES_TO_BACKUP=(
  "optimized-comparison.css"
  "compact-comparison.css"
  "radar-chart-fix.css"
  "comparison-styles.css"
  "RadarChartEnhancements.css"
)

# Backup files
echo "Creating backups of unused CSS files..."
for file in "${FILES_TO_BACKUP[@]}"; do
  if [[ -f "$file" ]]; then
    cp "$file" "./unused_css_backups/${file}.bak"
    echo " - Backed up: $file"
  else
    echo " - File not found: $file"
  fi
done

# Check that the consolidated CSS file exists
if [[ ! -f "consolidated-comparison.css" ]]; then
  echo "Error: consolidated-comparison.css not found!"
  echo "Please ensure this file exists before continuing."
  exit 1
fi

# Verify the import in ProgressTracking.js
echo "Verifying CSS imports in ProgressTracking.js..."
IMPORT_CHECK=$(grep -c "import './consolidated-comparison.css'" ProgressTracking.js)

if [[ $IMPORT_CHECK -eq 0 ]]; then
  echo "Error: consolidated-comparison.css is not imported in ProgressTracking.js"
  echo "Please update the imports manually."
  exit 1
else
  echo " - CSS import verified in ProgressTracking.js"
fi

# Verify the viewBox setting
echo "Verifying radar chart viewBox setting..."
VIEWBOX_CHECK=$(grep -c "viewBox=\"-30 0 528 528\"" ProgressTracking.js)

if [[ $VIEWBOX_CHECK -eq 0 ]]; then
  echo "Warning: Expected viewBox setting not found in ProgressTracking.js"
  echo "Make sure the radar chart is properly positioned."
else
  echo " - Radar chart viewBox setting verified"
fi

# Summary
echo ""
echo "===================================================="
echo "Summary of Changes:"
echo "===================================================="
echo "1. Created consolidated-comparison.css with all radar chart styles"
echo "2. Updated ProgressTracking.js to import only the consolidated CSS"
echo "3. Adjusted viewBox setting to move radar chart right by 30px"
echo "4. Backed up unused CSS files to ./unused_css_backups/"
echo ""
echo "The radar chart should now be positioned properly without"
echo "overlapping with the left boxes."
echo ""
echo "To test these changes, run the frontend server and verify"
echo "the appearance of the comparison section in the Progress Dashboard."
echo "===================================================="

# Exit successful
exit 0
