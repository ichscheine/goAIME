/**
 * Verification script for the updated wind rose chart
 * This script checks if Equations and Triangle Properties are included in the chart
 * Run this in the browser console after loading the progress dashboard
 */

(function() {
  console.log('=== Updated Wind Rose Chart Verification ===');
  
  // Expected values for specific topics
  const expectedTopics = {
    'Equations': {
      accuracy: 81.57,
      expectedColor: '#10b981', // Green
      attempts: 4
    },
    'Triangle Properties': {
      accuracy: 66.67,
      expectedColor: '#f59e0b', // Orange
      attempts: 12
    }
  };
  
  // Find the wind rose chart container
  const chartContainer = document.querySelector('.windrose-chart-container');
  if (!chartContainer) {
    console.error('Chart container not found!');
    return;
  }
  
  // Get all SVG paths (segments) in the chart
  const segments = chartContainer.querySelectorAll('path');
  console.log(`Found ${segments.length} segments in the chart`);
  
  // Extract topic information from segments
  const topicInfo = [];
  
  segments.forEach(segment => {
    const title = segment.querySelector('title');
    if (title) {
      const titleText = title.textContent;
      const match = titleText.match(/^([^:]+):\s+([\d.]+)%\s+accuracy\s+\((\d+)\/(\d+)/);
      
      if (match) {
        const topic = match[1];
        const accuracy = parseFloat(match[2]);
        const correct = parseInt(match[3]);
        const attempted = parseInt(match[4]);
        const fill = segment.getAttribute('fill');
        
        topicInfo.push({
          topic,
          accuracy,
          correct,
          attempted,
          fill
        });
      }
    }
  });
  
  // Check for our specific topics
  console.log('\n=== Specific Topics Check ===');
  
  for (const [topic, expected] of Object.entries(expectedTopics)) {
    const found = topicInfo.find(t => t.topic === topic);
    
    if (found) {
      const accuracyMatch = Math.abs(found.accuracy - expected.accuracy) < 0.1;
      const colorMatch = found.fill.toLowerCase() === expected.expectedColor.toLowerCase();
      
      console.log(`Topic: ${topic}`);
      console.log(`- Found in chart: YES`);
      console.log(`- Accuracy: ${found.accuracy.toFixed(2)}% (Expected: ${expected.accuracy}%) - ${accuracyMatch ? '✓' : '❌'}`);
      console.log(`- Color: ${found.fill} (Expected: ${expected.expectedColor}) - ${colorMatch ? '✓' : '❌'}`);
      console.log(`- Attempts: ${found.attempted}/${found.correct}`);
      
      if (!colorMatch) {
        console.log(`⚠️ Color mismatch for ${topic}: Found ${found.fill}, Expected ${expected.expectedColor}`);
        console.log(`Accuracy value check: ${found.accuracy} >= 75? ${found.accuracy >= 75}, ${found.accuracy} >= 50? ${found.accuracy >= 50}`);
      }
    } else {
      console.log(`❌ Topic "${topic}" NOT found in the chart`);
    }
  }
  
  // Overall verification
  const allTopics = topicInfo.map(t => t.topic);
  console.log('\n=== All Topics in Chart ===');
  console.log(allTopics.join(', '));
  
  const verificationResults = {
    totalTopics: topicInfo.length,
    targetTopicsFound: Object.keys(expectedTopics).filter(topic => topicInfo.some(t => t.topic === topic)),
    targetTopicsMissing: Object.keys(expectedTopics).filter(topic => !topicInfo.some(t => t.topic === topic)),
    allTopicsInChart: topicInfo
  };
  
  console.log('\n=== Verification Summary ===');
  console.log(`Total topics in chart: ${verificationResults.totalTopics}`);
  console.log(`Target topics found: ${verificationResults.targetTopicsFound.join(', ') || 'None'}`);
  console.log(`Target topics missing: ${verificationResults.targetTopicsMissing.join(', ') || 'None'}`);
  
  return verificationResults;
})();
