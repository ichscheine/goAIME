// Log the peer best values from the radar chart

// Helper function to check the data in the cohortComparison object
function logCohortValues() {
  // Get data from UI (only works if on the progress page)
  try {
    // Try to access the chart data from React's state
    const appRoot = document.querySelector('#root');
    if (!appRoot || !appRoot._reactRootContainer) {
      console.log('React root not found or not initialized yet');
      return;
    }
    
    // Find cohort comparison data in the component state
    const progressData = window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers?.get(1)?._idToElement?.get(4)?._currentElement?.props?.children?.[2]?.props?.progressData;
    
    if (progressData?.cohortComparison) {
      console.log('==== COHORT COMPARISON DATA ====');
      console.log('User Score:', progressData.cohortComparison.userScore);
      console.log('User Accuracy:', progressData.cohortComparison.userAccuracy + '%');
      console.log('User Speed:', progressData.cohortComparison.userSpeed + 's');
      console.log('-----------------------------');
      console.log('Peer Max Score:', progressData.cohortComparison.peerMaxScore);
      console.log('Peer Max Accuracy:', progressData.cohortComparison.peerMaxAccuracy + '%');
      console.log('Peer Max Speed:', progressData.cohortComparison.peerMaxSpeed + 's');
      console.log('==== END COHORT DATA ====');
      
      // Calculate the expected position as percentage of radius
      console.log('==== EXPECTED RADAR CHART POSITIONS (% of radius) ====');
      console.log('Peer Score position:', (progressData.cohortComparison.peerMaxScore / 100 * 100).toFixed(1) + '%');
      console.log('Peer Accuracy position:', (progressData.cohortComparison.peerMaxAccuracy / 100 * 100).toFixed(1) + '%');
      
      // For speed, calculate the normalized ratio
      const bestSpeed = 5;
      const worstSpeed = 60;
      const speedRange = worstSpeed - bestSpeed;
      const peerSpeed = progressData.cohortComparison.peerMaxSpeed;
      const normalizedSpeed = (worstSpeed - Math.max(bestSpeed, Math.min(worstSpeed, peerSpeed))) / speedRange;
      console.log('Peer Speed position:', (normalizedSpeed * 100).toFixed(1) + '%');
      console.log('==== END EXPECTED POSITIONS ====');
      
      return progressData.cohortComparison;
    } else {
      console.log('Cohort comparison data not found in React state');
    }
  } catch (e) {
    console.error('Error accessing React state:', e);
  }
  
  // Fallback: Check if data is visible in the DOM
  const peerValues = document.querySelector('.radar-info-text:nth-of-type(2)');
  if (peerValues) {
    console.log('Peer values from DOM:', peerValues.textContent);
  } else {
    console.log('Peer values element not found in DOM');
  }
}

// Run the check
logCohortValues();
