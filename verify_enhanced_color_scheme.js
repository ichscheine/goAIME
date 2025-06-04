// Verification script for enhanced wind rose color scheme (5 levels)
// This script tests the new color assignment logic with different accuracy values

console.log("===== Wind Rose Enhanced Color Scheme Verification =====");

// Sample accuracy values to test all color ranges
const testAccuracies = [
  { topic: "Calculus", accuracy: 95 },       // Exceptional
  { topic: "Equations", accuracy: 81 },      // High
  { topic: "Probability", accuracy: 67 },    // Above Average
  { topic: "Triangle Properties", accuracy: 55 },  // Medium
  { topic: "Combinatorics", accuracy: 32 }   // Low
];

console.log("\nTesting 5-level color scheme:");
console.log("Topic | Accuracy | Expected Color | Color Name");
console.log("-----------------------------------------------");

// Function to determine color based on our new 5-level scheme
function getColorForAccuracy(accuracy) {
  if (accuracy >= 90) return { color: "#059669", name: "Exceptional (Dark Green)" };
  if (accuracy >= 75) return { color: "#10b981", name: "High (Green)" };
  if (accuracy >= 60) return { color: "#a3e635", name: "Above Average (Light Green)" };
  if (accuracy >= 40) return { color: "#f59e0b", name: "Medium (Orange)" };
  return { color: "#ef4444", name: "Low (Red)" };
}

// Test each accuracy value
for (const test of testAccuracies) {
  const result = getColorForAccuracy(test.accuracy);
  console.log(`${test.topic.padEnd(20)} | ${test.accuracy.toFixed(0).padEnd(8)} | ${result.color.padEnd(14)} | ${result.name}`);
}

console.log("\n===== Color Distribution Summary =====");
console.log("The new 5-level color scheme provides more visual granularity:");
console.log("- Exceptional (90-100%): Dark Green - Shows truly exceptional mastery");
console.log("- High (75-89%): Green - Indicates strong understanding");
console.log("- Above Average (60-74%): Light Green - Shows good competence");
console.log("- Medium (40-59%): Orange - Indicates areas needing improvement");
console.log("- Low (0-39%): Red - Highlights topics requiring significant attention");
console.log("\nThis enhanced visualization helps students better differentiate between performance levels and prioritize their study efforts appropriately.");
