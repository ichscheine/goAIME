import React, { useState, useEffect, Suspense } from 'react';
import './App.css';
import './components/LandingStyles.css';
import './components/DashboardStyles.css';
import './components/SharedBackground.css';
import { ProblemProvider, useProblem } from './contexts/ProblemContext';
import { UserProvider } from './contexts/UserContext';
import { syncUserStatsWithDatabase } from './utils/syncUserStats';

import LandingPage from './components/LandingPage';
import Registration from './components/Registration';
import ProblemView from './components/ProblemView';
import Timer from './components/Timer';
import SolutionModal from './components/SolutionModal';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';

// Lazy load components
const SessionSummary = React.lazy(() => import('./components/SessionSummary'));
const ProgressTracking = React.lazy(() => import('./components/ProgressTracking'));

function App() {
  // User authentication state
  const [user, setUser] = useState(null);
  
  // Load user from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);
  
  // Handle user registration
  const handleRegistration = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };
  
  return (
    <UserProvider>
      <ProblemProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={!user ? <LandingPage /> : <Navigate to="/dashboard" />} />
            <Route path="/register" element={!user ? <Registration onRegister={handleRegistration} /> : <Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={user ? <AppContent user={user} /> : <Navigate to="/login" />} />
            <Route path="/problems/:id" element={user ? <ProblemView /> : <Navigate to="/login" />} />
            <Route path="/summary" element={user ? <SessionSummary /> : <Navigate to="/login" />} />
            <Route path="/progress" element={user ? <Suspense fallback={<div>Loading...</div>}><ProgressTracking username={user.username} /></Suspense> : <Navigate to="/login" />} />
            <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
          </Routes>
        </BrowserRouter>
      </ProblemProvider>
    </UserProvider>
  );
}

// Main app content when user is logged in
const AppContent = ({ user }) => {
  const [sessionCount, setSessionCount] = useState(0); // Initialize to 0, will be updated from API
  const [bestScore, setBestScore] = useState('--'); // Initialize to '--', will be updated from API
  
  const {
    sessionStarted,
    loading,
    error,
    sessionComplete,
    score,
    attempted,
    cumulativeTime,
    mode,
    setMode,
    problem,
    isPaused,
    totalProblems,
    handlePauseSession,
    handleResumeSession,
    handleRestartSession,
    handleQuitSession,
    selectedContest,
    setSelectedContest,
    selectedYear,
    setSelectedYear,
    selectedSkin,
    setSelectedSkin,
    resetContestProblems,
    startSession
  } = useProblem();
  
  const cumulativeTimeSeconds = (cumulativeTime / 1000).toFixed(2);
  
  // Fetch session count from backend when component mounts
  useEffect(() => {
    async function fetchSessionCount() {
      if (user && user.username) {
        try {
          const stats = await syncUserStatsWithDatabase(user.username);
          if (stats) {
            if (stats.sessionCount !== undefined) {
              setSessionCount(stats.sessionCount);
            }
            if (stats.bestScore !== undefined) {
              setBestScore(stats.bestScore);
            }
          }
        } catch (error) {
          console.error("Error fetching session count:", error);
        }
      }
    }
    
    fetchSessionCount();
  }, [user]);
  
  return (
    <div className="app-container">
      <div className="app-background">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="pattern"></div>
      </div>
      <header className="app-header">
        <div className="logo">goAIME</div>
        <Timer />
        {sessionStarted && problem && (
          <div className="progress-indicator">
            <span>Problem <span className="current">{attempted}</span> of <span className="total">{totalProblems}</span></span>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{width: `${(attempted / totalProblems) * 100}%`}}
              ></div>
            </div>
          </div>
        )}
        
        {/* Session Controls */}
        {sessionStarted && (
          <div className="session-controls">
            {!isPaused ? (
              <button 
                className="session-btn pause" 
                onClick={handlePauseSession}
                title="Pause Session"
              >
                ⏸️
              </button>
            ) : (
              <button 
                className="session-btn resume" 
                onClick={handleResumeSession}
                title="Resume Session"
              >
                ▶️
              </button>
            )}
            <button 
              className="session-btn restart" 
              onClick={handleRestartSession}
              title="Restart Session"
            >
              🔄
            </button>
          </div>
        )}
        {mode === "practice" && (
          <div className="score-board">
            Score: <strong>{score}</strong> / <strong>{attempted}</strong>
          </div>
        )}
        <div className="user-info">
          Welcome, {user?.username}!
          <button 
            onClick={() => {
              localStorage.removeItem('user');
              window.location.href = '/login';
            }} 
            className="logout-btn"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="main-layout full-width">
        <main className="content-panel">
          {!sessionStarted ? (
            <div className="instruction-message">
              <h2>Welcome to goAIME</h2>
              <p>Your personal math practice companion. Configure your settings and start practicing!</p>
              
              <div className="dashboard-container">
                <div className="dashboard-features">
                  <h3>Select Mode</h3>
                  <div className="feature-cards mode-selection">
                    <div 
                      className={`feature-card ${mode === 'competition' ? 'active' : ''}`}
                      onClick={() => !sessionStarted || sessionComplete ? setMode('competition') : null}
                      role="button"
                      tabIndex={0}
                      aria-pressed={mode === 'competition'}
                      aria-disabled={sessionStarted && !sessionComplete}
                    >
                      <div className="feature-icon">🏆</div>
                      <h3>Competition Mode</h3>
                      <p>Challenge yourself with timed tests to simulate real math competitions</p>
                    </div>
                    <div 
                      className={`feature-card ${mode === 'practice' ? 'active' : ''}`}
                      onClick={() => !sessionStarted || sessionComplete ? setMode('practice') : null}
                      role="button"
                      tabIndex={0}
                      aria-pressed={mode === 'practice'}
                      aria-disabled={sessionStarted && !sessionComplete}
                    >
                      <div className="feature-icon">📚</div>
                      <h3>Practice Mode</h3>
                      <p>Build your skills at your own pace with unlimited time</p>
                    </div>
                  </div>
                  
                  {/* Only show configuration after mode selection */}
                  {mode && (
                    <div className={`mode-config ${mode}`}>
                      <h3>{mode === 'competition' ? 'Competition' : 'Practice'} Settings</h3>
                      <div className="setting-group">
                        <label htmlFor="contest-select">Contest:</label>
                        <select
                          id="contest-select"
                          value={selectedContest}
                          onChange={(e) => {
                            setSelectedContest(e.target.value);
                            resetContestProblems();
                          }}
                          disabled={sessionStarted && !sessionComplete}
                        >
                          {['AMC 8', 'AMC 10A', 'AMC 10B', 'AMC 12A', 'AMC 12B', 'AIME I', 'AIME II'].map(contest => (
                            <option key={contest} value={contest}>{contest}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="setting-group">
                        <label htmlFor="year-select">Year:</label>
                        <select
                          id="year-select"
                          value={selectedYear}
                          onChange={(e) => {
                            setSelectedYear(e.target.value);
                            resetContestProblems();
                          }}
                          disabled={sessionStarted && !sessionComplete}
                        >
                          {[2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015].map(year => (
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
                            onChange={(e) => setSelectedSkin(e.target.value)}
                            disabled={sessionStarted && !sessionComplete}
                          >
                            {['EndMiner', 'Jupyter', 'Classic'].map(skin => (
                              <option key={skin} value={skin}>{skin}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      
                      <button
                        className="start-button"
                        onClick={startSession}
                        disabled={(sessionStarted && !sessionComplete)}
                      >
                        {sessionComplete ? 'New Session' : 'Start'}
                      </button>
                    </div>
                  )}
                  
                  <div className="analytics-section">
                    <div className="progress-section">
                      <Link 
                        to="/progress"
                        className="feature-card info-card"
                        role="button"
                        tabIndex={0}
                        style={{ 
                          cursor: 'pointer',
                          textDecoration: 'none', 
                          color: 'inherit',
                          display: 'block'
                        }}
                      >
                        <div className="feature-icon">📊</div>
                        <h3>Track Progress</h3>
                        <p>Monitor your improvement with detailed performance analytics</p>
                      </Link>
                    </div>
                    
                    {user && (
                      <div className="user-stats-section">
                        <h3>Your Statistics</h3>
                        <div className="stats-grid">
                          <div className="stat-card">
                            <div className="stat-icon">📝</div>
                            <div className="stat-details">
                              <div className="stat-label">Total Sessions</div>
                              <div className="stat-value">{sessionCount}</div>
                            </div>
                          </div>
                          <div className="stat-card">
                            <div className="stat-icon">🌟</div>
                            <div className="stat-details">
                              <div className="stat-label">Best Score</div>
                              <div className="stat-value">{bestScore}</div>
                            </div>
                          </div>
                          <div className="stat-card">
                            <div className="stat-icon">🕒</div>
                            <div className="stat-details">
                              <div className="stat-label">Last Session</div>
                              <div className="stat-value">{user.lastSession || 'Never'}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {loading && <p className="info-message">Loading...</p>}
              {error && <p className="error-message">{error}</p>}
              
              {sessionComplete ? (
                <Suspense fallback={<div>Loading...</div>}>
                  <SessionSummary 
                    score={score} 
                    attempted={attempted} 
                    cumulativeTimeSeconds={cumulativeTimeSeconds} 
                  />
                </Suspense>
              ) : (
                problem && !loading && <ProblemView />
              )}
            </>
          )}
        </main>
      </div>

      {/* Solution Modal - Always show regardless of session state */}
      <SolutionModal />

      {/* Pause Modal - Add this at the end of your component, before the closing div */}
      {isPaused && (
        <div className="pause-modal">
          <div className="pause-modal-content">
            <h3>Session Paused</h3>
            <p>Your timer has been paused. Take a break or continue when you're ready.</p>
            <div className="pause-modal-buttons">
              <button className="pause-modal-btn resume-btn" onClick={handleResumeSession}>
                Resume
              </button>
              <button className="pause-modal-btn quit-btn" onClick={handleQuitSession}>
                Quit Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;