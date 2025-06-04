/**
 * Verification script for the wind rose chart topic selection tiebreaker logic
 * Run this in the browser console when viewing the progress dashboard
 */

(function() {
  console.log('=== Wind Rose Chart Topic Selection Verification ===');
  
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
        
        topicInfo.push({
          topic,
          accuracy,
          correct,
          attempted
        });
      }
    }
  });
  
  // Check for topics with the same number of attempts
  const attemptCounts = {};
  topicInfo.forEach(info => {
    if (!attemptCounts[info.attempted]) {
      attemptCounts[info.attempted] = [];
    }
    attemptCounts[info.attempted].push(info);
  });
  
  // Look for topics with tied attempt counts
  console.log('\n=== Topics with Tied Attempt Counts ===');
  let hasTies = false;
  
  Object.entries(attemptCounts)
    .filter(([_, topics]) => topics.length > 1)
    .forEach(([attempts, topics]) => {
      hasTies = true;
      console.log(`\n${topics.length} topics with ${attempts} attempts:`);
      
      // Sort by accuracy (descending) to check tiebreaker
      const sortedByAccuracy = [...topics].sort((a, b) => b.accuracy - a.accuracy);
      
      sortedByAccuracy.forEach((topic, index) => {
        console.log(`${index + 1}. ${topic.topic}: ${topic.accuracy.toFixed(1)}% accuracy (${topic.correct}/${topic.attempted})`);
      });
      
      // Check if the topics are correctly ordered by accuracy
      const isOrderedByAccuracy = topics.every((topic, index, arr) => {
        if (index === 0) return true;
        return topic.accuracy <= arr[index - 1].accuracy;
      });
      
      console.log(`Topics with ${attempts} attempts ordered by accuracy? ${isOrderedByAccuracy ? '✓' : '❌'}`);
    });
  
  if (!hasTies) {
    console.log('No topics with tied attempt counts found in the chart.');
    console.log('To verify the tiebreaker logic, you need multiple topics with the same number of attempts.');
  }
  
  // Check if the topics array is available in the windrose chart implementation
  console.log('\n=== Checking Original Topic Data ===');
  console.log('Look for any console logs about "Topics sorted with accuracy as tiebreaker"');
  
  return {
    topicsInChart: topicInfo,
    tiedAttemptCounts: Object.entries(attemptCounts)
      .filter(([_, topics]) => topics.length > 1)
      .map(([attempts, topics]) => ({
        attempts: parseInt(attempts),
        topics: topics.map(t => ({
          topic: t.topic,
          accuracy: t.accuracy
        }))
      }))
  };
})();
