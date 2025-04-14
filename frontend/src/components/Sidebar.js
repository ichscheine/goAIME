import React, { useState } from 'react'; // Add useState import
import { useProblem } from '../contexts/ProblemContext';

const CONTEST_OPTIONS = ['AMC 8', 'AMC 10A', 'AMC 10B', 'AMC 12A', 'AMC 12B', 'AIME I', 'AIME II'];
const YEAR_OPTIONS = [2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015];
const SKIN_OPTIONS = ['Minecraft', 'Pokemon', 'Classic'];

const Sidebar = ({ user }) => {
  // Add state for collapsed sidebar
  const [collapsed, setCollapsed] = useState(false);
  
  const {
    selectedContest,
    setSelectedContest,
    selectedYear,
    setSelectedYear,
    selectedSkin,
    setSelectedSkin,
    mode,
    setMode,
    shuffle,
    setShuffle,
    sessionStarted,
    sessionComplete,
    startSession,
    resetContestProblems
  } = useProblem();

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

  const toggleShuffle = () => {
    setShuffle(prev => !prev);
    resetContestProblems();
  };

  const handleStartClick = () => {
    startSession();
  };

  return (
    <aside className={`sidebar filter-sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Add toggle button */}
      <button 
        className="sidebar-toggle" 
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? "►" : "◄"}
      </button>
      
      <div className="sidebar-content">
        <div className="sidebar-section">
          <h2>Contest Settings</h2>
          
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
          
          <div className="setting-group checkbox">
            <input
              type="checkbox"
              id="shuffle-toggle"
              checked={shuffle}
              onChange={toggleShuffle}
              disabled={sessionStarted && !sessionComplete}
            />
            <label htmlFor="shuffle-toggle">Shuffle Problems?</label>
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
              Contest
            </button>
          </div>
          
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
            <p className="stats-summary">
              Total Sessions: 1<br />
              Best Score: --<br />
              Last Session: Now
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;