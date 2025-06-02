# Score Display and Axis Labeling Fix for Radar Chart

## Issue Description
The radar chart in the Progress Tracking component was displaying the Score metric in percentage format (e.g., "69.3%") when it should be showing the actual score value out of 25 (e.g., "17.3/25").

## Fix Implementation
The following changes were made to correct the issue:

1. Updated the Score metric display value:
   - Changed from percentage format `${((progressData.cohortComparison.userScore / 25) * 100).toFixed(1)}%` 
   - To actual score format `${Number(progressData.cohortComparison.userScore).toFixed(1)}`

2. Added actual score values to the radar chart scale:
   - Added score values (6, 12, 19, 25) along the Score axis
   - Added "pts" indicators below each score value for clarity
   - Maintained percentage scales on the right side for consistency

3. Enhanced the Score axis visibility:
   - Increased the opacity and stroke width of the Score axis line
   - Made the Score axis more prominent than the other axes

4. Updated the Score axis label:
   - Changed from "Score" to "Score (out of 25)" for clarity
   - This makes it clear that the score is on a 25-point scale

## Expected Results
After the fix:
1. The Score metric on the radar chart should display as "17.3" instead of "69.3%"
2. The Score axis should be labeled as "Score (out of 25)"
3. The scale markers on the Score axis should show actual score values (6, 12, 19, 25) with "pts" indicators
4. The Score axis line should be more prominent than the other axes
5. All of these changes make it immediately clear that Score is measured on a 25-point scale

These changes provide a clearer representation of the user's actual score performance without changing how the data is calculated or positioned on the chart.

Date: June 2, 2025
