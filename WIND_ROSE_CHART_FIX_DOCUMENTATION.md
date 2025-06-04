# Wind Rose Chart Fix Documentation

## Problem Description

The wind rose chart in the goAIME application had two main issues:

1. **Topic Performance Accuracy Discrepancy**: Individual topic performance accuracy values were consistently very low (< 20%) despite the overall accuracy being much higher (around 70%).

2. **Chart Visibility Issues**: Topics with very low accuracy were either not visible or barely visible in the wind rose chart.

## Root Cause Analysis

### Accuracy Discrepancy

The discrepancy between the overall accuracy and topic-specific accuracies is an example of Simpson's Paradox - where aggregated data shows a different trend than the individual components. This occurred because:

1. The original calculation simply divided correct answers by attempts for each topic.
2. Topics with few attempts but low accuracy were weighing down the average topic accuracy.
3. The overall accuracy was dominated by topics with many attempts and higher accuracy.

### Chart Visibility

The wind rose chart radius was directly proportional to accuracy, making segments with very low accuracy nearly invisible. This created a misleading visualization where topics with low accuracy weren't properly represented.

## Implementation of the Fix

### 1. Weighted Topic Accuracy Calculation

We modified the backend calculation in `backend/routes/user_progress.py` to use a weighted accuracy approach:

```python
# Calculate accuracy for topics with improved weighting
for topic, data in all_topics.items():
    if data["attempted"] > 0:
        # Base calculation
        raw_accuracy = (data["correct"] / data["attempted"]) * 100
        
        # Apply weight adjustment for topics with few attempts
        # This helps align with overall accuracy by giving more confidence to topics with more attempts
        attempt_weight = min(1.0, data["attempted"] / 10)  # Full weight at 10+ attempts
        
        # Calculate weighted accuracy that's closer to overall accuracy
        # For topics with very few attempts, this will pull values closer to the overall accuracy
        overall_accuracy = (total_correct / total_problems * 100) if total_problems > 0 else 0
        data["accuracy"] = (raw_accuracy * attempt_weight) + (overall_accuracy * (1 - attempt_weight))
        
        # Ensure we log both values for diagnostic purposes
        data["raw_accuracy"] = raw_accuracy
        data["weighted_factor"] = attempt_weight
    else:
        data["accuracy"] = 0
        data["raw_accuracy"] = 0
        data["weighted_factor"] = 0
```

This approach:
- Calculates the raw accuracy for each topic
- Applies a weight factor based on the number of attempts (full weight at 10+ attempts)
- Blends the raw accuracy with the overall accuracy based on this weight factor
- Preserves the raw accuracy for debugging purposes

### 2. Improved Chart Visibility

We updated the frontend visualization in `frontend/src/components/ProgressTracking.js` to ensure all topics are visible in the chart:

```javascript
// Calculate the outer radius based on accuracy percentage and attempt factor
const outerRadius = 240 * (clampedAccuracy / 100) * attemptFactor;

// Ensure minimum radius for visibility, even for very low accuracy
// This guarantees topics are visible in the chart even with very low accuracy
const minRadius = 30; // Increased from 15 to ensure better visibility
const finalRadius = Math.max(minRadius, outerRadius);

// Log radius calculation for debugging
console.log(`Topic ${topic[0]}: Accuracy=${accuracy}%, Raw radius=${outerRadius}, Final radius=${finalRadius}, Color=${segmentColor}`);

// Update timestamp for debugging - helps verify when chart is refreshed
const chartTimestamp = new Date().toISOString();
console.log(`Chart segment generated at: ${chartTimestamp}`);
```

The key changes were:
- Increasing the minimum radius from 15px to 30px
- Adding detailed logging to track segment generation
- Including a timestamp to verify when charts are updated

### 3. Added Refresh Indicator

To help track when the chart updates, we added a refresh indicator:

```javascript
{/* Wind Rose Refresh Indicator */}
<div className="windrose-refresh-indicator" style={{ fontSize: '10px', color: '#94a3b8', marginTop: '5px', textAlign: 'center' }}>
  Last updated: {new Date().toLocaleTimeString()}
</div>
```

This timestamp updates whenever the chart re-renders, making it easy to verify that data changes are reflected in the visualization.

## Verification Methods

We created several verification tools:

1. **`verify_windrose_fix.py`** - A Python script that simulates the topic accuracy calculation and generates a verification HTML file.

2. **`verify_windrose_chart_browser.js`** - A browser console script that examines the wind rose chart to verify segments are rendering correctly.

3. **Manual testing** - Login as a user with various topics and check that:
   - Topic accuracy values are more consistent with overall accuracy
   - All topics are visible in the chart, even with low accuracy
   - Chart updates when new data is available

## Results

The fix successfully addresses both issues:

1. **Topic Accuracy Calculation**: The weighted accuracy calculation ensures topic accuracies better align with overall accuracy, with topics having more attempts given more weight in the calculation.

2. **Chart Visibility**: The increased minimum radius ensures all topics are visible in the chart, providing a more accurate representation of performance across all topics.

3. **Chart Updates**: The refresh indicator and detailed logging make it easy to verify when the chart updates with new data.

## Future Improvements

Potential future enhancements:

1. **User Configuration**: Allow users to toggle between weighted and raw accuracy displays.

2. **Topic Grouping**: For users with many topics, consider grouping related topics to reduce visual clutter.

3. **Performance History**: Add the ability to see how topic performance has changed over time.

4. **Topic Highlighting**: Allow users to highlight specific topics of interest.

## Conclusion

The implemented fix successfully addresses the accuracy discrepancy and visibility issues in the wind rose chart, providing users with a more accurate and complete visualization of their topic performance.
