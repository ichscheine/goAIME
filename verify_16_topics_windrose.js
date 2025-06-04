/**
 * Quick verification script for the updated wind rose chart
 * Run this in the browser console when viewing the progress page
 */

(function() {
  console.log('=== Wind Rose Chart - 16 Topics Verification ===');
  
  // Find the wind rose chart container
  const chartContainer = document.querySelector('.windrose-chart-container');
  if (!chartContainer) {
    console.error('Chart container not found!');
    return;
  }
  
  // Count the segments in the chart
  const segments = chartContainer.querySelectorAll('path');
  console.log(`Found ${segments.length} segments in the chart`);
  
  // Check if we have around 16 segments (some topics might be filtered)
  if (segments.length < 8) {
    console.warn(`Expected around 16 segments, but found only ${segments.length}`);
  } else if (segments.length > 8 && segments.length <= 16) {
    console.log('✓ Chart is showing more than 8 topics as expected');
  } else if (segments.length > 16) {
    console.warn(`More segments than expected: ${segments.length}`);
  }
  
  // Count the topic labels
  const labels = chartContainer.querySelectorAll('text:not([x="250"][y="250"]):not([y="20"])');
  console.log(`Found ${labels.length} topic labels`);
  
  // Extract topic names from tooltips
  const topics = [];
  segments.forEach(segment => {
    const title = segment.querySelector('title');
    if (title) {
      const text = title.textContent;
      const match = text.match(/^([^:]+):/);
      if (match) {
        topics.push(match[1]);
      }
    }
  });
  
  console.log('Topics shown in the chart:');
  topics.forEach((topic, index) => {
    console.log(`${index + 1}. ${topic}`);
  });
  
  // Look for the "Top 16" text in the center
  const centerText = chartContainer.querySelector('text[x="250"][y="250"]');
  if (centerText && centerText.textContent === 'Top 16') {
    console.log('✓ Center text updated to "Top 16"');
  } else {
    console.warn('Center text not updated properly');
  }
  
  return {
    segmentCount: segments.length,
    labelCount: labels.length,
    topics: topics,
    centerTextUpdated: centerText && centerText.textContent === 'Top 16'
  };
})();
