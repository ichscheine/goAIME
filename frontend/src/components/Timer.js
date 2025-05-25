// Update the Timer component to fix the Time Left calculation
import React, { useState, useEffect } from 'react';
import { useProblem } from '../contexts/ProblemContext';

const Timer = () => {
  const { 
    sessionStartTime, 
    sessionComplete,
    isPaused
  } = useProblem();
  
  const [elapsedDisplay, setElapsedDisplay] = useState('0:00');
  const [remainingDisplay, setRemainingDisplay] = useState('75:00');
  // Store the time when paused
  const [pausedElapsedTime, setPausedElapsedTime] = useState(null);
  
  // AMC10 has exactly 75 minutes
  const CONTEST_DURATION_SECONDS = 75 * 60;
  
  // Format time function
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };
  
  useEffect(() => {
    if (sessionComplete) return;
    
    // Store current elapsed time when pausing
    if (isPaused) {
      if (!pausedElapsedTime && sessionStartTime) {
        const elapsedMsAtPause = Date.now() - sessionStartTime;
        const elapsedSecondsAtPause = Math.floor(elapsedMsAtPause / 1000);
        setPausedElapsedTime(elapsedSecondsAtPause);
      }
      return; // Don't update timer while paused
    } else {
      // Reset paused time when unpausing
      setPausedElapsedTime(null);
    }
    
    const timerInterval = setInterval(() => {
      if (!sessionStartTime) {
        setElapsedDisplay('0:00');
        setRemainingDisplay(formatTime(CONTEST_DURATION_SECONDS));
        return;
      }
      
      // Calculate elapsed time in seconds (not milliseconds)
      const elapsedMs = Date.now() - sessionStartTime;
      const elapsedSecs = Math.floor(elapsedMs / 1000);
      
      // Format and set display values
      setElapsedDisplay(formatTime(elapsedSecs));
      
      // Calculate remaining time (ensure it's never negative)
      const remainingSecs = Math.max(0, CONTEST_DURATION_SECONDS - elapsedSecs);
      setRemainingDisplay(formatTime(remainingSecs));
      
    }, 1000);
    
    return () => clearInterval(timerInterval);
  }, [sessionStartTime, sessionComplete, isPaused, pausedElapsedTime]);
  
  // Display values when paused
  const displayElapsed = isPaused && pausedElapsedTime !== null
    ? formatTime(pausedElapsedTime)
    : elapsedDisplay;
    
  const displayRemaining = isPaused && pausedElapsedTime !== null
    ? formatTime(Math.max(0, CONTEST_DURATION_SECONDS - pausedElapsedTime))
    : remainingDisplay;
  
  return (
    <div className="timer-container">
      <div className="time-section time-elapsed">
        <span className="time-label">Time Elapsed:</span>
        <span className="time-value">{displayElapsed}</span>
      </div>
      <div className="time-section time-left">
        <span className="time-label">Time Left:</span>
        <span className="time-value">{displayRemaining}</span>
      </div>
    </div>
  );
};

export default Timer;