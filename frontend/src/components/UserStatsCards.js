import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { syncUserStatsWithDatabase, getUserSpecificFix } from '../utils/syncUserStats';

const UserStatsCards = ({ username }) => {
  const [userStats, setUserStats] = useState({
    sessions: [],
    bestScore: '--',
    lastSession: 'Never'
  });
  const [sessionCount, setSessionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch local stats from localStorage
  useEffect(() => {
    if (username) {
      const storageKey = `user_stats_${username}`;
      const storedStats = localStorage.getItem(storageKey);
      
      if (storedStats) {
        setUserStats(JSON.parse(storedStats));
      }
    }
  }, [username]);
  
  // Fetch session count from backend
  useEffect(() => {
    async function fetchSessionCount() {
      if (!username) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Check for user-specific fixes first
        const userFix = getUserSpecificFix(username);
        
        if (userFix) {
          console.log(`Applying special fix for ${username}`);
          
          if (userFix.sessionCount !== null) {
            console.log(`Using fixed session count: ${userFix.sessionCount}`);
            setSessionCount(userFix.sessionCount);
            
            // Update localStorage to ensure it's correct
            const storageKey = `user_stats_${username}`;
            const storedStats = localStorage.getItem(storageKey);
            const parsedStats = storedStats ? JSON.parse(storedStats) : { 
              sessions: [], 
              bestScore: userFix.bestScore || '--',
              lastSession: null
            };
            
            // Force update to correct sessions count
            if (parsedStats.sessions.length !== userFix.sessionCount) {
              parsedStats.sessions = new Array(userFix.sessionCount).fill({});
              
              // Update best score if specified
              if (userFix.bestScore !== null) {
                parsedStats.bestScore = userFix.bestScore;
              }
              
              localStorage.setItem(storageKey, JSON.stringify(parsedStats));
            }
            
            setLoading(false);
            return;
          }
        }
        
        // For other users, use the new sync utility function
        console.log(`Syncing stats for ${username} with database...`);
        const updatedStats = await syncUserStatsWithDatabase(username);
        
        if (updatedStats) {
          setSessionCount(updatedStats.sessions.length);
        } else {
          // Fallback to API call if the sync function fails
          console.log(`Sync failed, fetching session count for ${username} from API...`);
          const response = await axios.get(`/api/sessions/count/${username}`);
          
          if (response.data && response.data.success) {
            const dbCount = response.data.data.count;
            console.log(`API returned ${dbCount} sessions for ${username}`);
            setSessionCount(dbCount);
            
            // Update local storage to keep it in sync
            const storageKey = `user_stats_${username}`;
            const storedStats = localStorage.getItem(storageKey);
            const parsedStats = storedStats ? JSON.parse(storedStats) : { 
              sessions: [], 
              bestScore: '--',
              lastSession: null
            };
            
            const localCount = parsedStats.sessions ? parsedStats.sessions.length : 0;
            
            // Only update localStorage if the count doesn't match
            if (localCount !== dbCount) {
              console.log(`Updating localStorage session count from ${localCount} to ${dbCount}`);
              
              // Create array of proper length (we don't have the actual session data)
              parsedStats.sessions = new Array(dbCount).fill({});
              
              // Save back to localStorage
              localStorage.setItem(storageKey, JSON.stringify(parsedStats));
              console.log('localStorage updated successfully');
            } else {
              console.log('localStorage session count already matches database');
            }
          } else {
            // API call succeeded but returned an error
            console.error('Error in session count API response:', response.data);
            setError('Could not retrieve session count');
            // Fallback to local storage
            setSessionCount(userStats.sessions ? userStats.sessions.length : 0);
          }
        }
      } catch (error) {
        console.error('Error fetching session count:', error);
        setError('Failed to connect to server');
        
        // Fall back to local storage count if API fails
        const localCount = userStats.sessions ? userStats.sessions.length : 0;
        console.log(`API request failed. Falling back to localStorage count: ${localCount}`);
        setSessionCount(localCount);
        
        // Check if server might be down
        if (error.message && error.message.includes('Network Error')) {
          console.log('Network error detected. Server might be down.');
        }
      } finally {
        setLoading(false);
      }
    }
    
    fetchSessionCount();
    // Remove userStats.sessions from dependency array to avoid refetch loops
  }, [username]);
  
  const formatLastSession = () => {
    if (!userStats.lastSession) return 'Never';
    
    try {
      // Simple formatting
      const lastSession = new Date(userStats.lastSession);
      const now = new Date();
      const diffTime = Math.abs(now - lastSession);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      
      return lastSession.toLocaleDateString();
    } catch (e) {
      return 'Unknown';
    }
  };

  return (
    <>
      <div className="stat-card">
        <div className="stat-icon">📝</div>
        <div className="stat-details">
          <div className="stat-label">Total Sessions</div>
          <div className="stat-value">
            {loading ? (
              <span className="loading-indicator">
                <span className="dot-flashing"></span>
              </span>
            ) : error ? (
              <span title={error} className="stat-error">{sessionCount}</span>
            ) : (
              sessionCount
            )}
          </div>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">🌟</div>
        <div className="stat-details">
          <div className="stat-label">Best Score</div>
          <div className="stat-value">{userStats.bestScore || '--'}</div>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">🕒</div>
        <div className="stat-details">
          <div className="stat-label">Last Session</div>
          <div className="stat-value">{formatLastSession()}</div>
        </div>
      </div>
    </>
  );
};

export default UserStatsCards;
