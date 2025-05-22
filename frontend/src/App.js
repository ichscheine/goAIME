import React, { useState, useEffect } from 'react';
import './App.css';
import { ProblemProvider, useProblem } from './contexts/ProblemContext';

import LandingPage from './components/LandingPage';
import Registration from './components/Registration';
import Sidebar from './components/Sidebar';
import ProblemView from './components/ProblemView';
import SessionSummary from './components/SessionSummary';
import Timer from './components/Timer';
import SolutionModal from './components/SolutionModal';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

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
    <ProblemProvider>
      <BrowserRouter>
      <Routes>
        <Route path="/login" element={!user ? <LandingPage /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!user ? <Registration onRegister={handleRegistration} /> : <Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={user ? <AppContent user={user} /> : <Navigate to="/login" />} />
        <Route path="/problems/:id" element={user ? <ProblemView /> : <Navigate to="/login" />} />
        <Route path="/summary" element={user ? <SessionSummary /> : <Navigate to="/login" />} />
        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      </Routes>
      </BrowserRouter>
    </ProblemProvider>
  );
}

// Main app content when user is logged in
const AppContent = ({ user }) => {
  const {
    sessionStarted,
    loading,
    error,
    sessionComplete,
    score,
    attempted,
    cumulativeTime,
    mode,
    problem,
    isPaused,
    totalProblems,
    handlePauseSession,
    handleResumeSession,
    handleRestartSession,
    handleQuitSession
  } = useProblem();
  
  const cumulativeTimeSeconds = (cumulativeTime / 1000).toFixed(2);
  
  return (
    <div className="app-container">
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

      <div className="main-layout">
        <Sidebar user={user} />
        
        <main className="content-panel">
          {!sessionStarted ? (
            <div className="instruction-message">
              <h2>I am awesome and I know it</h2>
              <p>Let's go.</p>
            </div>
          ) : (
            <>
              {loading && <p className="info-message">Loading...</p>}
              {error && <p className="error-message">{error}</p>}
              
              {sessionComplete ? (
                <SessionSummary 
                  score={score} 
                  attempted={attempted} 
                  cumulativeTimeSeconds={cumulativeTimeSeconds} 
                />
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