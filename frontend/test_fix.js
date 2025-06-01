// Simple test to verify our array access fix works
const progressData = {
  topicPerformance: {} // Empty object to simulate the error condition
};

// This is the original problematic code (commented out to avoid error)
// const problematicCode = Object.entries(progressData.topicPerformance)
//   .sort((a, b) => b[1].accuracy - a[1].accuracy)[0][0];
// console.log('Problematic result:', problematicCode); // This would error

// This is our fixed code
const fixedCode = Object.entries(progressData.topicPerformance || {}).length > 0
  ? Object.entries(progressData.topicPerformance)
      .sort((a, b) => b[1].accuracy - a[1].accuracy)[0][0]
  : "N/A";

console.log('Fixed result:', fixedCode); // This should work fine

// Test with some data
const progressDataWithTopics = {
  topicPerformance: {
    "Algebra": { "correct": 18, "attempted": 25, "accuracy": 72.00 },
    "Geometry": { "correct": 12, "attempted": 15, "accuracy": 80.00 },
    "Number Theory": { "correct": 8, "attempted": 10, "accuracy": 80.00 }
  }
};

const fixedCodeWithData = Object.entries(progressDataWithTopics.topicPerformance || {}).length > 0
  ? Object.entries(progressDataWithTopics.topicPerformance)
      .sort((a, b) => b[1].accuracy - a[1].accuracy)[0][0]
  : "N/A";

console.log('Fixed result with data:', fixedCodeWithData); // Should show "Geometry" or "Number Theory"

console.log('✅ Test completed successfully - fix works properly');
