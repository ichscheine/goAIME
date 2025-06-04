/**
 * Wind Rose Chart Fix Verification (Browser Console)
 * 
 * Run this script in the browser console while viewing the progress page
 * to verify that the wind rose chart displays correctly and updates properly.
 */

(function() {
  console.log('==== Wind Rose Chart Fix Verification ====');
  
  // 1. Check if wind rose chart container exists
  const windRoseContainer = document.querySelector('.windrose-chart-container');
  if (!windRoseContainer) {
    console.error('Wind rose chart container not found!');
    return { success: false, error: 'Container not found' };
  }
  
  console.log('✓ Wind rose chart container found');
  
  // 2. Check if progressData is available in React component
  let progressData;
  try {
    // This requires React DevTools to be installed
    // Get a reference to the ProgressTracking component instance
    const reactInstance = __REACT_DEVTOOLS_GLOBAL_HOOK__.renderers.get(1).findFiberByHostInstance(windRoseContainer);
    
    // Traverse up to find the component with progressData state
    let currentFiber = reactInstance;
    while (currentFiber && (!currentFiber.memoizedState || !currentFiber.memoizedState.memoizedState || !currentFiber.memoizedState.memoizedState.topicPerformance)) {
      currentFiber = currentFiber.return;
    }
    
    if (currentFiber && currentFiber.memoizedState) {
      progressData = currentFiber.memoizedState.memoizedState;
      console.log('✓ progressData found in React component state:', progressData);
    } else {
      console.warn('Could not find progressData in React component state');
    }
  } catch (error) {
    console.warn('Could not access React component state:', error);
  }
  
  // 3. Check wind rose chart segments
  const segments = windRoseContainer.querySelectorAll('path');
  console.log(`Found ${segments.length} segments in wind rose chart`);
  
  if (segments.length === 0) {
    console.error('No segments found in wind rose chart!');
    return { success: false, error: 'No segments' };
  }
  
  // 4. Check segment attributes and tooltips
  const segmentDetails = Array.from(segments).map(segment => {
    const path = segment.getAttribute('d');
    const fill = segment.getAttribute('fill');
    const title = segment.querySelector('title')?.textContent;
    
    // Extract topic name and accuracy from title
    let topic = 'Unknown';
    let accuracy = 0;
    if (title) {
      const match = title.match(/(.*?): ([\d.]+)% accuracy/);
      if (match) {
        topic = match[1];
        accuracy = parseFloat(match[2]);
      }
    }
    
    return { topic, accuracy, path, fill };
  });
  
  console.log('Segment details:', segmentDetails);
  
  // 5. Check for very low accuracy topics (should still be visible)
  const lowAccuracySegments = segmentDetails.filter(segment => segment.accuracy < 20);
  console.log(`Found ${lowAccuracySegments.length} low accuracy segments (<20%):`, lowAccuracySegments);
  
  // 6. Check refresh indicator
  const refreshIndicator = document.querySelector('.windrose-refresh-indicator');
  if (!refreshIndicator) {
    console.warn('Refresh indicator not found! This helps verify chart updates.');
  } else {
    console.log('✓ Refresh indicator found:', refreshIndicator.textContent);
  }
  
  // 7. Verify the weighted calculation in topic performance data
  if (progressData && progressData.topicPerformance) {
    const topics = Object.entries(progressData.topicPerformance);
    
    // Check for raw_accuracy field (added in our fix)
    const hasRawAccuracy = topics.some(([_, data]) => 'raw_accuracy' in data);
    console.log(`Raw accuracy field ${hasRawAccuracy ? 'is' : 'is NOT'} present in topic data`);
    
    // Compare topic average with overall accuracy
    const overallAccuracy = progressData.overallPerformance.accuracyPercentage;
    const topicAverage = topics.reduce((sum, [_, data]) => sum + data.accuracy, 0) / topics.length;
    
    console.log(`Overall accuracy: ${overallAccuracy.toFixed(2)}%`);
    console.log(`Average topic accuracy: ${topicAverage.toFixed(2)}%`);
    console.log(`Discrepancy: ${Math.abs(overallAccuracy - topicAverage).toFixed(2)}%`);
    
    if (Math.abs(overallAccuracy - topicAverage) > 20) {
      console.warn('Large discrepancy between overall and topic average accuracy!');
    } else {
      console.log('✓ Reasonable alignment between overall and topic average accuracy');
    }
  }
  
  // 8. Test updating by forcing refresh
  console.log('To test updating, you can refresh the page or add a new session');
  
  return { 
    success: true, 
    segments: segmentDetails,
    segmentCount: segments.length,
    lowAccuracyCount: lowAccuracySegments.length,
    hasRefreshIndicator: !!refreshIndicator
  };
})();
