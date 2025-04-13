import { useState, useEffect, useCallback, useRef } from 'react';

// Timer types:
// - countdown: counts down from a specified time
// - stopwatch: counts up from zero
export const useTimer = (type = 'stopwatch', initialTime = 0) => {
  const [time, setTime] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const pausedTimeRef = useRef(0);
  
  // Start the timer
  const start = useCallback(() => {
    if (isRunning) return;
    
    setIsRunning(true);
    setIsComplete(false);
    
    // For stopwatch, start counting from now
    if (type === 'stopwatch') {
      startTimeRef.current = Date.now() - pausedTimeRef.current;
    } 
    // For countdown, calculate end time
    else if (type === 'countdown') {
      startTimeRef.current = Date.now() - (initialTime - time);
    }
    
    timerRef.current = setInterval(() => {
      if (type === 'stopwatch') {
        // For stopwatch, calculate elapsed time
        const elapsed = Date.now() - startTimeRef.current;
        setTime(elapsed);
      } else {
        // For countdown, calculate remaining time
        const elapsed = Date.now() - startTimeRef.current;
        const remaining = initialTime - elapsed;
        
        if (remaining <= 0) {
          setTime(0);
          setIsComplete(true);
          stop();
        } else {
          setTime(remaining);
        }
      }
    }, 100); // Update every 100ms for smoother display
  }, [initialTime, isRunning, time, type]);
  
  // Pause the timer
  const pause = useCallback(() => {
    if (!isRunning) return;
    
    clearInterval(timerRef.current);
    setIsRunning(false);
    
    // Store the current time for potential resume
    pausedTimeRef.current = time;
  }, [isRunning, time]);
  
  // Stop and reset the timer
  const stop = useCallback(() => {
    clearInterval(timerRef.current);
    setIsRunning(false);
    pausedTimeRef.current = 0;
    
    // Reset to initial time based on timer type
    if (type === 'stopwatch') {
      setTime(0);
    } else {
      setTime(initialTime);
    }
  }, [initialTime, type]);
  
  // Reset the timer
  const reset = useCallback(() => {
    stop();
    setIsComplete(false);
  }, [stop]);
  
  // Format time as mm:ss
  const formatTime = useCallback(() => {
    const totalSeconds = Math.floor(time / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [time]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
    };
  }, []);
  
  return {
    time,
    isRunning,
    isComplete,
    start,
    pause,
    stop,
    reset,
    formatTime
  };
};