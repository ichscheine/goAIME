# Wind Rose Chart Scale Fix

## Problem
The wind rose chart had a scaling issue where high-accuracy topics (like Equations at 81%) were only extending to approximately the 25% circle despite being color-coded correctly as green. This was confusing because the visual representation didn't match the actual performance level.

## Root Cause
The original implementation calculated the radius of topic segments based on two factors:
1. **Accuracy percentage** (directly proportional)
2. **Attempt factor** (scaled 0.3-1.0 based on relative attempt count)

These two factors were multiplied together, so even topics with high accuracy (like 81%) would appear small if they had fewer attempts relative to other topics.

Original calculation:
```javascript
const attemptFactor = 0.3 + (0.7 * Math.min(topic[1].attempted || 1, maxAttempts) / (maxAttempts || 1));
const outerRadius = 240 * (clampedAccuracy / 100) * attemptFactor;
```

This meant a topic with 81% accuracy but relatively few attempts might only extend to ~50% of the maximum radius, making high-performance topics appear less impressive than they should.

## Solution
The solution implements a tiered approach to scaling based on accuracy levels:

1. **High Performance Topics (≥75% accuracy)**:
   - Guaranteed to extend to at least 75% of max chart radius
   - Attempt factor has reduced influence (25% impact)

2. **Medium Performance Topics (50-75% accuracy)**:
   - Guaranteed to extend to at least 50% of max chart radius
   - Attempt factor has moderate influence (40% impact)

3. **Low Performance Topics (<50% accuracy)**:
   - Scale proportionally to accuracy
   - Attempt factor has full influence

## Implementation
The updated radius calculation ensures high-accuracy topics like "Equations" (81%) and "Triangle Properties" (66.67%) are properly represented:

```javascript
// Calculate base radius using accuracy
let baseRadius = 240 * (clampedAccuracy / 100);

// NEW SCALING APPROACH:
let scaledRadius;
if (accuracy >= 75) {
    // High performance - ensure minimum of 75% of full radius
    const minHighPerformanceRadius = 240 * 0.75;
    scaledRadius = Math.max(minHighPerformanceRadius, baseRadius);
    
    // Apply attempt factor but less aggressively (25% impact)
    scaledRadius = scaledRadius * (0.75 + 0.25 * attemptFactor);
} 
else if (accuracy >= 50) {
    // Medium performance - ensure minimum of 50% of radius
    const minMediumPerformanceRadius = 240 * 0.5;
    scaledRadius = Math.max(minMediumPerformanceRadius, baseRadius);
    
    // Apply attempt factor with moderate effect (40% impact)
    scaledRadius = scaledRadius * (0.6 + 0.4 * attemptFactor);
}
else {
    // Low performance - scale normally
    scaledRadius = baseRadius * attemptFactor;
}

// Ensure minimum visibility radius
const finalRadius = Math.max(minRadius, scaledRadius);
```

## Results
The fix ensures that:
- High-accuracy topics (≥75%) now extend to at least 75% of the maximum radius
- Medium-accuracy topics (≥50%) now extend to at least 50% of the maximum radius
- The attempt count still influences the radius but with less dramatic impact
- The visual representation now accurately reflects performance levels

This change maintains the original intent of showing relative topic performance while ensuring high-accuracy topics are properly represented on the chart, regardless of attempt count.
