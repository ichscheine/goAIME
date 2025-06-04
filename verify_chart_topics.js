/**
 * Verification script for checking if specific topics appear in the wind rose chart
 * Run this in your browser console when viewing the progress dashboard
 */

(function() {
  console.log('=== Wind Rose Chart Topic Verification ===');
  
  // Topics we want to verify
  const targetTopics = ['Equations', 'Triangle Properties'];
  
  // Find the wind rose chart container
  const chartContainer = document.querySelector('.windrose-chart-container');
  if (!chartContainer) {
    console.error('Chart container not found!');
    return;
  }
  
  // Get all path segments in the chart
  const segments = chartContainer.querySelectorAll('path');
  console.log(`Found ${segments.length} segments in the chart`);
  
  // Extract topic information from segments
  const topicInfo = [];
  segments.forEach(segment => {
    // Try to get title element for the topic info
    const title = segment.querySelector('title');
    if (title) {
      const titleText = title.textContent;
      // Parse the title text to extract topic name and accuracy
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
  
  console.log('\n=== Topics Found in Chart ===');
  console.log(`Found ${topicInfo.length} topics in the chart`);
  topicInfo.forEach((info, index) => {
    const colorMatch = info.fill.toLowerCase() === info.expectedColor.toLowerCase();
    console.log(
      `${index + 1}. ${info.topic}: ${info.accuracy.toFixed(1)}% accuracy, ` +
      `Color: ${info.fill} (${colorMatch ? '✓' : '❌'} ${!colorMatch ? `Expected: ${info.expectedColor}` : ''})`
    );
  });
  
  // Check if our target topics are in the chart
  console.log('\n=== Target Topics Check ===');
  targetTopics.forEach(targetTopic => {
    const found = topicInfo.find(t => t.topic === targetTopic);
    if (found) {
      const colorMatch = found.fill.toLowerCase() === found.expectedColor.toLowerCase();
      console.log(
        `✅ ${targetTopic} FOUND: ${found.accuracy.toFixed(1)}% accuracy, ` +
        `Color: ${found.fill} (${colorMatch ? '✓' : '❌'} ${!colorMatch ? `Expected: ${found.expectedColor}` : ''})`
      );
    } else {
      console.log(`❌ ${targetTopic} NOT FOUND in the chart`);
    }
  });
  
  // Check what topics are currently displayed by attempts
  console.log('\n=== Topic Selection Check ===');
  console.log('Checking if wind rose is selecting topics correctly...');
  
  // Get topic performance data from React component state
  // Try to access it through progressData if available in window scope
  if (window.progressData && window.progressData.topicPerformance) {
    const allTopics = Object.entries(window.progressData.topicPerformance);
    const sortedByAttempts = [...allTopics].sort((a, b) => b[1].attempted - a[1].attempted);
    
    console.log('Top topics by attempts that SHOULD be in the chart:');
    sortedByAttempts.slice(0, 16).forEach((topic, index) => {
      console.log(`${index + 1}. ${topic[0]}: ${topic[1].attempted} attempts, ${topic[1].accuracy?.toFixed(1)}% accuracy`);
    });
    
    // Check where our target topics rank in the attempts list
    targetTopics.forEach(targetTopic => {
      const topicIndex = sortedByAttempts.findIndex(t => t[0] === targetTopic);
      if (topicIndex >= 0) {
        console.log(`${targetTopic} ranks #${topicIndex + 1} by attempts (${sortedByAttempts[topicIndex][1].attempted} attempts)`);
        console.log(`Should it be in top 16? ${topicIndex < 16 ? 'YES' : 'NO'}`);
      } else {
        console.log(`${targetTopic} not found in topic performance data`);
      }
    });
  } else {
    console.log('Unable to access topic performance data directly. Check browser console for more logs.');
  }
  
  // Recommendation section
  console.log('\n=== Fix Recommendation ===');
  console.log('To ensure Equations and Triangle Properties appear in the wind rose chart:');
  console.log('1. Modify the topic selection logic to include these specific topics');
  console.log('2. Add a special case in the code to ensure these topics are included regardless of attempt count');
  
  return {
    topicsInChart: topicInfo,
    targetTopicsStatus: targetTopics.map(targetTopic => ({
      topic: targetTopic,
      found: topicInfo.some(t => t.topic === targetTopic)
    }))
  };
})();
