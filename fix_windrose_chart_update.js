// Debug script to fix the wind rose chart update issue
// This script can be pasted into the browser console when viewing the ProgressTracking page

// Function to diagnose wind rose chart issues
function diagnoseWindRoseChart() {
  console.log('=== Wind Rose Chart Diagnosis ===');
  
  // Check if progressData is loaded and has topic performance data
  const progressData = window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers?.get(1)?.getCurrentFiber()?.memoizedProps?.progressData;
  
  if (!progressData) {
    console.error('Could not access progressData - make sure you are on the ProgressTracking page');
    return;
  }
  
  // Log the topic performance data
  console.log('topicPerformance data:', progressData.topicPerformance);
  
  // Check if the data is empty
  if (!progressData.topicPerformance || Object.keys(progressData.topicPerformance).length === 0) {
    console.error('Topic performance data is empty');
    return;
  }
  
  // Log the actual data that should be displayed in the chart
  const topTopics = Object.entries(progressData.topicPerformance)
    .sort((a, b) => b[1].attempted - a[1].attempted)
    .slice(0, 8);
  
  console.log('Top topics that should be displayed:', topTopics);
  
  // Check if the wind rose chart elements exist in the DOM
  const windRoseContainer = document.querySelector('.windrose-chart-container');
  if (!windRoseContainer) {
    console.error('Wind rose chart container not found in DOM');
    return;
  }
  
  const segments = windRoseContainer.querySelectorAll('path');
  console.log(`Found ${segments.length} segments in the wind rose chart`);
  
  console.log('=== End of Diagnosis ===');
  
  return {
    progressData,
    topTopics,
    windRoseContainer,
    segments
  };
}

// Run the diagnosis
const result = diagnoseWindRoseChart();

// Display a summary
if (result && result.topTopics) {
  console.log('\n=== Summary ===');
  console.log(`Topics with performance data: ${Object.keys(result.progressData.topicPerformance).length}`);
  console.log(`Segments displayed in chart: ${result.segments.length}`);
  
  if (result.segments.length < result.topTopics.length) {
    console.log('ISSUE DETECTED: Not all topic segments are being displayed');
    console.log('This may be due to the chart not updating properly');
    console.log('Try reloading the page or checking for conditional rendering issues');
  }
}
