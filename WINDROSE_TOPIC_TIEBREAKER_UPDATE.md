# Wind Rose Chart Topic Selection Update

## Enhancement

Updated the topic selection logic for the wind rose chart to prioritize topics with higher accuracy when there are ties in the number of attempts.

## Rationale

Previously, when multiple topics had the same number of attempts, the selection was arbitrary based on the order of topics in the object. With this enhancement, topics with higher accuracy will be prioritized when there's a tie in the number of attempts, providing a more meaningful visualization.

## Implementation Details

The sorting logic for topic selection has been updated to use a compound sort:
1. Primary sort by attempt count (descending) - unchanged
2. Secondary sort by accuracy (descending) - new tiebreaker

```javascript
// Sort topics by attempt count, with ties broken by accuracy
const remainingTopics = Object.entries(progressData.topicPerformance)
  .filter(([topic, _]) => !importantTopics.includes(topic))
  .sort((a, b) => {
    // First compare by attempt count (descending)
    const attemptDiff = b[1].attempted - a[1].attempted;
    // If attempts are equal, sort by accuracy (descending)
    return attemptDiff !== 0 ? attemptDiff : b[1].accuracy - a[1].accuracy;
  });
```

## Benefits

1. More consistent and predictable topic selection
2. Higher-performing topics get priority in case of ties
3. Better representation of user's strongest topics

## Verification

The updated logic can be verified by examining the console logs, which now include:
- "Topics sorted with accuracy as tiebreaker for equal attempts"

Additionally, when there are topics with the same number of attempts, the ones with higher accuracy should appear in the wind rose chart.

## Compatibility

This change maintains all previous functionality:
- Still prioritizes explicitly listed important topics (Equations, Triangle Properties)
- Still limits the display to 16 total topics
- Still primarily sorts by attempt count (descending)

The only difference is the resolution of ties, which now favors higher accuracy topics.
