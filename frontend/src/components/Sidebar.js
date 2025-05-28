import React, { useState, useEffect } from 'react'; // Add useEffect import
import { useProblem } from '../contexts/ProblemContext';
import { Link } from 'react-router-dom';

const CONTEST_OPTIONS = ['AMC 8', 'AMC 10A', 'AMC 10B', 'AMC 12A', 'AMC 12B', 'AIME I', 'AIME II'];
const YEAR_OPTIONS = [2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015];
const SKIN_OPTIONS = ['EndMiner', 'Jupyter', 'Classic'];

const Sidebar = ({ user }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [userStats, setUserStats] = useState({
    sessions: [],
    bestScore: '--',
    lastSession: 'Never'
  });
  
  const {
    selectedContest,
    setSelectedContest,
    selectedYear,
    setSelectedYear,
    selectedSkin,
    setSelectedSkin,
    mode,
    setMode,
    sessionStarted,
    sessionComplete,
    startSession,
    resetContestProblems
  } = useProblem();

  // Load user stats from localStorage when user changes
  useEffect(() => {
    if (user && user.username) {
      const storageKey = `user_stats_${user.username}`;
      const storedStats = localStorage.getItem(storageKey);
      
      if (storedStats) {
        const parsedStats = JSON.parse(storedStats);
        setUserStats(parsedStats);
      } else {
        // Reset to default if no stats found
        setUserStats({
          sessions: [],
          bestScore: '--',
          lastSession: 'Never'
        });
      }
    }
  }, [user]);

  const formatLastSession = () => {
    if (!userStats || !userStats.lastSession) return 'Never';
    
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

  // Existing handler functions
  const handleContestChange = (e) => {
    setSelectedContest(e.target.value);
    resetContestProblems();
  };

  const handleYearChange = (e) => {
    setSelectedYear(e.target.value);
    resetContestProblems();
  };

  const handleSkinChange = (e) => {
    setSelectedSkin(e.target.value);
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
  };

  const handleStartClick = () => {
    startSession();
    // Automatically collapse sidebar when starting a session
    setCollapsed(true);
  };

  return (
    <aside className={`sidebar filter-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <button 
        className="sidebar-toggle" 
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? "►" : "◄"}
      </button>
      
      <div className="sidebar-content">
        <div className="sidebar-section">
          <h2>Competition Settings</h2>
          
          <div className="setting-group">
            <label htmlFor="contest-select">Contest:</label>
            <select
              id="contest-select"
              value={selectedContest}
              onChange={handleContestChange}
              disabled={sessionStarted && !sessionComplete}
            >
              {CONTEST_OPTIONS.map(contest => (
                <option key={contest} value={contest}>{contest}</option>
              ))}
            </select>
          </div>
        
          <div className="setting-group">
            <label htmlFor="year-select">Year:</label>
            <select
              id="year-select"
              value={selectedYear}
              onChange={handleYearChange}
              disabled={sessionStarted && !sessionComplete}
            >
              {YEAR_OPTIONS.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="sidebar-section">
          <h2>Mode</h2>
          
          <div className="mode-buttons">
            <button
              className={`mode-button ${mode === 'practice' ? 'active' : ''}`}
              onClick={() => handleModeChange('practice')}
              disabled={sessionStarted && !sessionComplete}
            >
              Practice
            </button>
            
            <button
              className={`mode-button ${mode === 'contest' ? 'active' : ''}`}
              onClick={() => handleModeChange('contest')}
              disabled={sessionStarted && !sessionComplete}
            >
              Competition
            </button>
          </div>
          
          {mode === 'practice' && (
            <div className="setting-group">
              <label htmlFor="skin-select">Theme:</label>
              <select
                id="skin-select"
                value={selectedSkin}
                onChange={handleSkinChange}
                disabled={sessionStarted && !sessionComplete}
              >
                {SKIN_OPTIONS.map(skin => (
                  <option key={skin} value={skin}>{skin}</option>
                ))}
              </select>
            </div>
          )}
          
          <div className="start-button-container">
            <button
              className="start-button"
              onClick={handleStartClick}
              disabled={(sessionStarted && !sessionComplete) || !mode}
            >
              {sessionComplete ? 'New Session' : 'Start'}
            </button>
          </div>
        </div>
        
        {user && (
          <div className="sidebar-section user-section">
            <h3>User: {user.username}</h3>
            <div className="stats-summary">
              <div className="stat-item">
                <span className="stat-label">Total Sessions:</span>
                <span className="stat-value">{userStats.sessions ? userStats.sessions.length : 0}</span>
              </div>
              
              <div className="stat-item">
                <span className="stat-label">Best Score:</span>
                <span className={`stat-value ${userStats.bestScore > 0 ? 'highlight' : ''}`}>
                  {userStats.bestScore || '--'}
                </span>
              </div>
              
              <div className="stat-item">
                <span className="stat-label">Last Session:</span>
                <span className="stat-value">{formatLastSession()}</span>
              </div>
            </div>
            
            {/* Add Track Progress Link */}
            <div className="progress-link-container">
              <Link to="/progress" className="progress-link">
                <span className="progress-icon">📊</span>
                <span>Track Progress</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;