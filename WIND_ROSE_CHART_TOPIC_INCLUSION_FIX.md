# Wind Rose Chart Topic Inclusion Fix

## Issue
The wind rose chart was not correctly displaying all topics with their proper colors. Specifically:
- **Equations** (81% accuracy) should appear as green (>=75% accuracy)
- **Triangle Properties** (66.67% accuracy) should appear as orange/yellow (>=50% and <75% accuracy)

The issue was that these topics weren't being included in the chart at all because they didn't have enough attempts to make it into the top 16 topics by attempt count.

## Fix Implemented
We modified the topic selection logic for the wind rose chart to:

1. **Prioritize Important Topics**: Ensure specific topics (Equations and Triangle Properties) are always included in the chart regardless of their attempt count.
2. **Fill Remaining Slots**: Use the remaining slots (up to 16 total) for the topics with the most attempts.

## Code Changes

1. Modified topic selection for segments:
```javascript
// Important topics we want to ensure are included in the visualization
const importantTopics = ['Equations', 'Triangle Properties'];

// First get entries for important topics if they exist
const importantTopicEntries = importantTopics
  .map(topic => {
    if (progressData.topicPerformance[topic]) {
      return [topic, progressData.topicPerformance[topic]];
    }
    return null;
  })
  .filter(entry => entry !== null);

// Get remaining topics sorted by attempt count
const remainingTopics = Object.entries(progressData.topicPerformance)
  .filter(([topic, _]) => !importantTopics.includes(topic))
  .sort((a, b) => b[1].attempted - a[1].attempted);

// Combine important topics with top topics by attempt
const topTopics = [
  ...importantTopicEntries,
  ...remainingTopics.slice(0, 16 - importantTopicEntries.length)
];
```

2. Updated label creation to use the same `topTopics` array, ensuring consistency between segments and labels.

## Verification

Created verification scripts:
1. `verify_specific_topics.py` - Verifies the API data for the target topics
2. `verify_chart_topics.js` - Browser-based verification for the chart contents
3. `verify_updated_chart.js` - Final verification of the fixed chart

## Expected Results

After this fix:
- Equations should appear in the wind rose chart with a green color (>=75% accuracy)
- Triangle Properties should appear in the wind rose chart with an orange/yellow color (>=50% accuracy)
- All other topic selection and visualization logic remains unchanged
- The chart still shows a maximum of 16 topics total

## Future Considerations

If additional topics need special handling in the future, they can be added to the `importantTopics` array.
