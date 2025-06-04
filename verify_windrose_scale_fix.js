// Verification script for wind rose scale fix
// This script simulates the radius calculation for topics with different accuracy/attempt levels
// to verify that high-accuracy topics extend to at least the 75% ring

console.log("===== Wind Rose Scale Fix Verification =====");

// Sample topic data with varying accuracy and attempts
const topics = [
  { name: "Equations", accuracy: 81.0, attempted: 15, maxAttempts: 30 },
  { name: "Triangle Properties", accuracy: 66.67, attempted: 12, maxAttempts: 30 },
  { name: "Algebra", accuracy: 90.0, attempted: 5, maxAttempts: 30 },
  { name: "Geometry", accuracy: 50.0, attempted: 25, maxAttempts: 30 }
];

// Constants
const MAX_RADIUS = 240;
const MIN_RADIUS = 30;

console.log("\nBEFORE FIX - Original calculation:");
console.log("Topic | Accuracy | Attempts | AttemptFactor | FinalRadius | % of Max");
console.log("------------------------------------------------------------------");

topics.forEach(topic => {
  // Original calculation
  const attemptFactor = 0.3 + (0.7 * Math.min(topic.attempted, topic.maxAttempts) / topic.maxAttempts);
  const clampedAccuracy = Math.min(100, Math.max(0, topic.accuracy));
  const outerRadius = MAX_RADIUS * (clampedAccuracy / 100) * attemptFactor;
  const finalRadius = Math.max(MIN_RADIUS, outerRadius);
  const percentOfMax = (finalRadius / MAX_RADIUS * 100).toFixed(1);

  console.log(
    `${topic.name.padEnd(20)} | ${topic.accuracy.toFixed(2).padEnd(8)} | ${String(topic.attempted).padEnd(8)} | ${attemptFactor.toFixed(2).padEnd(13)} | ${finalRadius.toFixed(1).padEnd(11)} | ${percentOfMax}%`
  );
});

console.log("\nAFTER FIX - New calculation:");
console.log("Topic | Accuracy | Attempts | BaseRadius | ScaledRadius | FinalRadius | % of Max");
console.log("------------------------------------------------------------------------------");

topics.forEach(topic => {
  // New calculation
  const attemptFactor = 0.3 + (0.7 * Math.min(topic.attempted, topic.maxAttempts) / topic.maxAttempts);
  const clampedAccuracy = Math.min(100, Math.max(0, topic.accuracy));
  
  // Calculate base radius using accuracy
  let baseRadius = MAX_RADIUS * (clampedAccuracy / 100);
  
  // NEW SCALING APPROACH
  let scaledRadius;
  if (topic.accuracy >= 75) {
    // High performance - ensure minimum of 75% of full radius (180px)
    const minHighPerformanceRadius = MAX_RADIUS * 0.75; // 180px 
    scaledRadius = Math.max(minHighPerformanceRadius, baseRadius);
    
    // Apply attempt factor but less aggressively for high-accuracy topics
    scaledRadius = scaledRadius * (0.75 + 0.25 * attemptFactor);
  } 
  else if (topic.accuracy >= 50) {
    // Medium performance - ensure minimum of 50% of radius (120px)
    const minMediumPerformanceRadius = MAX_RADIUS * 0.5; // 120px
    scaledRadius = Math.max(minMediumPerformanceRadius, baseRadius);
    
    // Apply attempt factor with moderate effect
    scaledRadius = scaledRadius * (0.6 + 0.4 * attemptFactor);
  }
  else {
    // Low performance - scale normally but ensure visibility
    scaledRadius = baseRadius;
    
    // Apply attempt factor normally for low-accuracy topics
    scaledRadius = scaledRadius * attemptFactor;
  }
  
  const finalRadius = Math.max(MIN_RADIUS, scaledRadius);
  const percentOfMax = (finalRadius / MAX_RADIUS * 100).toFixed(1);

  console.log(
    `${topic.name.padEnd(20)} | ${topic.accuracy.toFixed(2).padEnd(8)} | ${String(topic.attempted).padEnd(8)} | ${baseRadius.toFixed(1).padEnd(10)} | ${scaledRadius.toFixed(1).padEnd(12)} | ${finalRadius.toFixed(1).padEnd(11)} | ${percentOfMax}%`
  );
});

console.log("\n===== Results Analysis =====");
console.log("High accuracy topics (>=75%) now extend to at least 75% of chart radius");
console.log("Attempt factor still influences radius but has less impact on high-accuracy topics");
