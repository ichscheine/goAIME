import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

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

    try {
      console.log("Saving session for user:", user.username);
      console.log("Session data:", sessionData);
      
      const response = await api.saveSession(user.username, {
        session_id: sessionData.session_id,
        score: sessionData.score,
        attempted: sessionData.attempted,
        totalTime: sessionData.totalTime,
        // Remove solvedProblems as it's redundant with score
        // solvedProblems: sessionData.solvedProblems
        year: sessionData.year,
        contest: sessionData.contest,
        mode: sessionData.mode,
        completed_at: sessionData.completed_at,
        problems_attempted: sessionData.problems_attempted || []
      });
      
      // Check for success in the response
      // The backend returns a structure with success field or status field
      if (response.data && (response.data.success || response.status === 200)) {
        // Update local stats
        const newStats = {
          totalSessions: userStats.totalSessions + 1,
          totalProblems: userStats.totalProblems + sessionData.attempted,
          correctAnswers: userStats.correctAnswers + sessionData.score,
          averageTime: (userStats.averageTime * userStats.totalProblems + sessionData.totalTime) / 
                      (userStats.totalProblems + sessionData.attempted),
          lastSessionDate: new Date().toISOString()
        };
        setUserStats(newStats);
      }
      // Return true if we got a successful response (either by success field or HTTP status)
      console.log("Session save response:", response);
      
      // Handle different response formats
      const isSuccess = (
        // Check response.data.success
        (response.data && response.data.success === true) ||
        // Or check response.data.data.success (for nested Flask responses)
        (response.data && response.data.data && response.data.data.success === true) ||
        // Or just accept 200 status
        response.status === 200
      );
      
      return isSuccess;
    } catch (err) {
      console.error("Error saving session results:", err);
      if (err.response) {
        console.error("Error response status:", err.response.status);
        console.error("Error response data:", err.response.data);
      }
      return false;
    }
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