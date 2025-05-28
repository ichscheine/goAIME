import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import api from '../services/api';

// Simple debounce utility
const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
};

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userStats, setUserStats] = useState({
    totalSessions: 0,
    totalProblems: 0,
    correctAnswers: 0,
    averageTime: 0,
    lastSessionDate: null
  });
  
  // Track pending save requests
  const saveInProgress = useRef(false);
  const pendingSaveData = useRef(null);
  
  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      setLoading(true);
      try {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          
          // In a real app, you would fetch user stats from the backend
          // const stats = await api.getUserStats(parsedUser.username);
          // setUserStats(stats);
        }
      } catch (err) {
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };
    
    loadUser();
  }, []);
  
  // Function to register a new user
  const registerUser = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, send to backend
      // const response = await api.registerUser(userData);
      
      // For now, just store locally
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Function to log out
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };
  
  // Function to save session results
  const saveSessionResults = async (sessionData) => {
    if (!user) {
      console.log("Cannot save session: No user is logged in");
      return false;
    }

    // Debounce rapid calls to this function
    const sendSaveRequest = debounce(async (data) => {
      try {
        console.log("Saving session for user:", user.username);
        console.log("Session data:", data);
        
        // Retry logic for handling 429 errors
        let retries = 0;
        const MAX_RETRIES = 3;
        
        while (retries < MAX_RETRIES) {
          try {
            const response = await api.saveSession(user.username, {
              session_id: data.session_id,
              score: data.score,
              attempted: data.attempted,
              totalTime: data.totalTime,
              year: data.year,
              contest: data.contest,
              mode: data.mode,
              completed_at: data.completed_at,
              problems_attempted: data.problems_attempted || []
            });
            
            // If we get here, the request succeeded
            if (response.data && (response.data.success || response.status === 200)) {
              // Update local stats
              const newStats = {
                totalSessions: userStats.totalSessions + 1,
                totalProblems: userStats.totalProblems + data.attempted,
                correctAnswers: userStats.correctAnswers + data.score,
                averageTime: (userStats.averageTime * userStats.totalProblems + data.totalTime) / 
                           (userStats.totalProblems + data.attempted),
                lastSessionDate: new Date().toISOString()
              };
              setUserStats(newStats);
            }
            
            // Return true for success
            console.log("Session save response:", response);
            return true;
          } catch (err) {
            // Handle rate limiting (429) errors with retries
            if (err.response && err.response.status === 429 && retries < MAX_RETRIES - 1) {
              retries++;
              const waitTime = retries * 1000; // Exponential backoff: 1s, 2s, 3s
              console.log(`Rate limited (429), retry ${retries}/${MAX_RETRIES-1} after ${waitTime}ms`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
            } else {
              // Rethrow for non-429 errors or if we've exhausted retries
              console.error("Error saving session results:", err);
              if (err.response) {
                console.error("Error response status:", err.response.status);
                console.error("Error response data:", err.response.data);
              }
              return false;
            }
          }
        }
        
        // If we get here, we've exhausted our retries
        return false;
      } catch (err) {
        console.error("Unexpected error in save request:", err);
        return false;
      }
    }, 1000); // 1 second debounce

    // If a save is already in progress, queue this one
    if (saveInProgress.current) {
      pendingSaveData.current = sessionData;
      return true;
    }

    saveInProgress.current = true;
    const result = await sendSaveRequest(sessionData);
    saveInProgress.current = false;

    // If there was pending data, process it after the current save completes
    if (pendingSaveData.current) {
      const pendingData = pendingSaveData.current;
      pendingSaveData.current = null;
      return await saveSessionResults(pendingData);
    }

    return result;
  };
  
  return (
    <UserContext.Provider value={{
      user,
      loading,
      error,
      userStats,
      registerUser,
      logout,
      saveSessionResults
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);