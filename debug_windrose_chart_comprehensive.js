/**
 * Wind Rose Chart Debug Script
 * 
 * This script helps diagnose issues with the wind rose chart not updating
 * in the goAIME application. Run this in your browser console when viewing
 * the progress tracking page.
 */

(function() {
  console.log('==== Wind Rose Chart Debug Script ====');
  
  // Step 1: Check if we can access progressData
  function checkProgressData() {
    console.log('1. Checking progressData...');
    
    // Try different methods to access progressData
    let foundData = false;
    
    // Method 1: Direct access via React DevTools
    try {
      const reactInstance = window.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers.get(1);
      if (reactInstance) {
        const fiber = reactInstance.getCurrentFiber();
        if (fiber && fiber.memoizedProps && fiber.memoizedProps.progressData) {
          const progressData = fiber.memoizedProps.progressData;
          console.log('Found progressData via React DevTools:', progressData);
          foundData = true;
          return progressData;
        }
      }
    } catch (e) {
      console.warn('Could not access progressData via React DevTools:', e);
    }
    
    // Method 2: Try to find progressData in rendered components
    try {
      const progressTrackingComponent = Array.from(document.querySelectorAll('*'))
        .find(el => el._reactProps && el._reactProps.progressData);
      
      if (progressTrackingComponent) {
        const progressData = progressTrackingComponent._reactProps.progressData;
        console.log('Found progressData via DOM element:', progressData);
        foundData = true;
        return progressData;
      }
    } catch (e) {
      console.warn('Could not access progressData via DOM:', e);
    }
    
    if (!foundData) {
      console.error('Could not find progressData. Make sure you are on the Progress Tracking page.');
      return null;
    }
  }
  
  // Step 2: Check the topic performance data specifically
  function checkTopicPerformance(progressData) {
    if (!progressData) return;
    
    console.log('2. Checking topic performance data...');
    
    const topicPerformance = progressData.topicPerformance;
    if (!topicPerformance || Object.keys(topicPerformance).length === 0) {
      console.error('topicPerformance is empty or undefined:', topicPerformance);
      return;
    }
    
    console.log(`Found ${Object.keys(topicPerformance).length} topics in topicPerformance:`, topicPerformance);
    
    // Get the top 8 topics by attempt count
    const topTopics = Object.entries(topicPerformance)
      .sort((a, b) => b[1].attempted - a[1].attempted)
      .slice(0, 8);
    
    console.log('Top 8 topics that should be displayed:', topTopics);
    
    return topTopics;
  }
  
  // Step 3: Check if the wind rose chart is rendered in the DOM
  function checkWindRoseChart() {
    console.log('3. Checking wind rose chart in DOM...');
    
    const windRoseContainer = document.querySelector('.windrose-chart-container');
    if (!windRoseContainer) {
      console.error('Wind rose chart container not found in DOM');
      return null;
    }
    
    console.log('Found wind rose chart container:', windRoseContainer);
    
    // Check for path elements that represent the segments
    const segments = windRoseContainer.querySelectorAll('path');
    console.log(`Found ${segments.length} segment paths in the wind rose chart`);
    
    if (segments.length === 0) {
      console.error('No segments found in the wind rose chart');
    }
    
    // Check for topic labels
    const topicLabels = windRoseContainer.querySelectorAll('text');
    console.log(`Found ${topicLabels.length} text elements in the wind rose chart`);
    
    return { container: windRoseContainer, segments, topicLabels };
  }
  
  // Step 4: Force a re-render of the chart
  function forceRerender() {
    console.log('4. Attempting to force a re-render...');
    
    // Find the component's state updater
    try {
      const reactInstance = window.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers.get(1);
      if (reactInstance) {
        const fiber = reactInstance.getCurrentFiber();
        if (fiber && fiber.memoizedState) {
          console.log('Found component state, triggering update...');
          // This is a hack to trigger a re-render
          const event = new Event('resize');
          window.dispatchEvent(event);
          console.log('Dispatched resize event to force re-render');
        }
      }
    } catch (e) {
      console.warn('Could not force re-render:', e);
    }
  }
  
  // Step 5: Show a diagnostic summary
  function showDiagnosticSummary(progressData, topTopics, chartElements) {
    console.log('==== Diagnostic Summary ====');
    
    const hasProgressData = !!progressData;
    const hasTopicData = !!(topTopics && topTopics.length > 0);
    const hasChartContainer = !!(chartElements && chartElements.container);
    const hasSegments = !!(chartElements && chartElements.segments && chartElements.segments.length > 0);
    
    console.log(`Progress Data: ${hasProgressData ? '✅' : '❌'}`);
    console.log(`Topic Performance Data: ${hasTopicData ? '✅' : '❌'}`);
    console.log(`Wind Rose Chart Container: ${hasChartContainer ? '✅' : '❌'}`);
    console.log(`Wind Rose Chart Segments: ${hasSegments ? '✅' : '❌'}`);
    
    if (hasProgressData && hasTopicData && hasChartContainer && !hasSegments) {
      console.log('\n🔍 DIAGNOSIS: The chart container exists but no segments are rendered.');
      console.log('This suggests a problem in the rendering logic for the segments.');
      console.log('\nPossible issues:');
      console.log('1. The map function that creates segments is not returning anything');
      console.log('2. The segments are being filtered out due to conditions (e.g., radius too small)');
      console.log('3. There might be an error in the SVG path generation');
    }
    
    if (hasProgressData && !hasTopicData) {
      console.log('\n🔍 DIAGNOSIS: The progressData exists but topicPerformance is empty or invalid.');
      console.log('This suggests a problem with the API response or data processing.');
    }
    
    if (!hasChartContainer) {
      console.log('\n🔍 DIAGNOSIS: The wind rose chart container is missing from the DOM.');
      console.log('This suggests a conditional rendering issue or the component is not mounted.');
    }
  }
  
  // Run the debug sequence
  const progressData = checkProgressData();
  const topTopics = checkTopicPerformance(progressData);
  const chartElements = checkWindRoseChart();
  
  // Show diagnostic summary
  showDiagnosticSummary(progressData, topTopics, chartElements);
  
  // Provide the debug data for further inspection
  return {
    progressData,
    topTopics,
    chartElements,
    forceRerender
  };
})();
