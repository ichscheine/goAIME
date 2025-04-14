// Update the Timer component to respect isPaused
import React, { useState, useEffect } from 'react';
import { useProblem } from '../contexts/ProblemContext';

const Timer = () => {
  const { 
    sessionStartTime, 
    mode,
    sessionComplete,
    isPaused // Add this to get pause state
  } = useProblem();
  
  const [elapsedDisplay, setElapsedDisplay] = useState('0:00');
  const [remainingDisplay, setRemainingDisplay] = useState('--:--');
  // Store the time when paused
  const [pausedElapsedTime, setPausedElapsedTime] = useState(null);
  
  // Format time function
  const formatTime = (milliseconds) => {
    if (!milliseconds || isNaN(milliseconds)) return '0:00';
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  useEffect(() => {
    if (sessionComplete) return;
    
    // Store current elapsed time when pausing
    if (isPaused) {
      if (!pausedElapsedTime && sessionStartTime) {
        setPausedElapsedTime(Date.now() - sessionStartTime);
      }
      return; // Don't update timer while paused
    } else {
      // Reset paused time when unpausing
      setPausedElapsedTime(null);
    }
    
    const timerInterval = setInterval(() => {
      if (!sessionStartTime) {
        setElapsedDisplay('0:00');
        return;
      }
      
      const elapsed = Date.now() - sessionStartTime;
      setElapsedDisplay(formatTime(elapsed));
      
      if (mode === 'contest') {
        const contestDuration = 75 * 60 * 1000; // 75 minutes for contest
        const remaining = Math.max(0, contestDuration - elapsed);
        setRemainingDisplay(formatTime(remaining));
      }
    }, 1000);
    
    return () => clearInterval(timerInterval);
  }, [sessionStartTime, mode, sessionComplete, isPaused, pausedElapsedTime]);
  
  // If paused, show the frozen time
  const displayElapsed = isPaused && pausedElapsedTime 
    ? formatTime(pausedElapsedTime)
    : elapsedDisplay;
    
  const displayRemaining = isPaused && pausedElapsedTime && mode === 'contest'
    ? formatTime(Math.max(0, 75 * 60 * 1000 - pausedElapsedTime))
    : remainingDisplay;
  
  return (
    <div className="timer-container">
      <span className="time-elapsed">Time Elapsed: {displayElapsed}</span>
      {mode === 'contest' && (
        <span className="time-left">Time Left: {displayRemaining}</span>
      )}
    </div>
  );
};

export default Timer;