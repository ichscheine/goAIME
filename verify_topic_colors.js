/**
 * Topic Color Verification Script for Wind Rose Chart
 * Run this in the browser console to check specific topics' color assignments
 */

(function() {
  console.log('=== Wind Rose Chart Topic Color Verification ===');
  
  // Find the wind rose chart container
  const chartContainer = document.querySelector('.windrose-chart-container');
  if (!chartContainer) {
    console.error('Chart container not found!');
    return;
  }
  
  // Get all path segments
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
          fill,
          expectedColor: accuracy >= 75 ? "#10b981" : accuracy >= 50 ? "#f59e0b" : "#ef4444"
        });
      }
    }
  });
  
  // Sort by accuracy (descending)
  topicInfo.sort((a, b) => b.accuracy - a.accuracy);
  
  // Check for specific topics
  const equationsTopic = topicInfo.find(t => t.topic === 'Equations');
  const trianglePropertiesTopic = topicInfo.find(t => t.topic === 'Triangle Properties');
  
  console.log('\n=== Topic Color Analysis ===');
  console.log('All topics sorted by accuracy:');
  topicInfo.forEach((info, index) => {
    const colorMatch = info.fill.toLowerCase() === info.expectedColor.toLowerCase();
    console.log(
      `${index + 1}. ${info.topic}: ${info.accuracy.toFixed(1)}% accuracy, ` +
      `Color: ${info.fill} (${colorMatch ? '✓' : '❌'} ${!colorMatch ? `Expected: ${info.expectedColor}` : ''})`
    );
  });
  
  console.log('\n=== Specific Topics Check ===');
  if (equationsTopic) {
    const equationsColorMatch = equationsTopic.fill.toLowerCase() === equationsTopic.expectedColor.toLowerCase();
    console.log(
      `Equations: ${equationsTopic.accuracy.toFixed(1)}% accuracy, ` +
      `Color: ${equationsTopic.fill} (${equationsColorMatch ? '✓' : '❌'} ${!equationsColorMatch ? `Expected: ${equationsTopic.expectedColor}` : ''})`
    );
  } else {
    console.log('Equations topic not found in the chart');
  }
  
  if (trianglePropertiesTopic) {
    const triangleColorMatch = trianglePropertiesTopic.fill.toLowerCase() === trianglePropertiesTopic.expectedColor.toLowerCase();
    console.log(
      `Triangle Properties: ${trianglePropertiesTopic.accuracy.toFixed(1)}% accuracy, ` +
      `Color: ${trianglePropertiesTopic.fill} (${triangleColorMatch ? '✓' : '❌'} ${!triangleColorMatch ? `Expected: ${trianglePropertiesTopic.expectedColor}` : ''})`
    );
  } else {
    console.log('Triangle Properties topic not found in the chart');
  }
  
  return {
    topics: topicInfo,
    equations: equationsTopic,
    triangleProperties: trianglePropertiesTopic
  };
})();
