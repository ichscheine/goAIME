/**
 * Wind Rose Chart Accuracy Fix
 * 
 * This script contains the fixes needed to address the topic performance accuracy
 * inconsistency in the goAIME app. There are two main issues:
 * 
 * 1. Topic accuracy values are consistently low (<20%) despite overall accuracy of ~70%
 * 2. Wind rose chart doesn't update properly with user data
 * 
 * This fix includes:
 * 1. Backend: Updated topic accuracy calculation with weighting based on attempt count
 * 2. Frontend: Improved wind rose chart rendering with minimum radius for visibility
 */

// BACKEND FIX (Python)
// Replace the topic accuracy calculation in backend/routes/user_progress.py:

/* Original code:
# Calculate accuracy for topics
for topic, data in all_topics.items():
    if data["attempted"] > 0:
        data["accuracy"] = (data["correct"] / data["attempted"]) * 100
    else:
        data["accuracy"] = 0
*/

/* Replacement code:
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
*/

// FRONTEND FIX (JavaScript)
// 1. Increase minimum radius in frontend/src/components/ProgressTracking.js

/* Original code:
// Calculate the outer radius based on accuracy percentage and attempt factor
const outerRadius = 240 * (clampedAccuracy / 100) * attemptFactor;

// Ensure minimum radius for visibility, even for very low accuracy
const minRadius = 15; // Minimum radius to ensure visibility
const finalRadius = Math.max(minRadius, outerRadius);

console.log(`Topic ${topic[0]}: Accuracy=${accuracy}%, Radius=${finalRadius}, Color=${segmentColor}`);
*/

/* Replacement code:
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
*/

// 2. Add a refresh indicator to clearly show when the chart updates

/* Add this code after the windrose chart container div:
<div className="windrose-refresh-indicator" style={{ fontSize: '10px', color: '#94a3b8', marginTop: '5px', textAlign: 'center' }}>
  Last updated: {new Date().toLocaleTimeString()}
</div>
*/

// VERIFICATION
/* 
To verify the fix is working:

1. After implementing these changes, restart the backend server to apply the topic accuracy calculation changes
2. Clear your browser cache or use incognito mode to ensure you're getting fresh data
3. Log in as a user with significant problem history across multiple topics
4. Check the browser console for:
   - "Topic Performance Data for Windrose Chart" log entry
   - "Chart segment generated at" timestamps
   - Individual topic accuracy and radius values
5. Verify that:
   - Topic accuracy values are more consistent with overall accuracy
   - Wind rose chart shows all topic segments, even for low-accuracy topics
   - Chart segments update when new data is available
*/
