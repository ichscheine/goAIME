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
        console.error('Error loading user:', err);
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
      console.error('Registration error:', err);
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
    if (!user) return;
    
    try {
      // In a real app, send to backend
      // await api.saveSession(user.username, sessionData);
      
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
      
      return true;
    } catch (err) {
      console.error('Error saving session:', err);
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