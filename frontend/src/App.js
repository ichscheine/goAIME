import React, { useState, useEffect } from 'react';
import './App.css';
import { ProblemProvider, useProblem } from './contexts/ProblemContext';
import { formatTimeMinSec, formatDate } from './utils/formatter';

import Registration from './components/Registration';
import Sidebar from './components/Sidebar';
import ProblemView from './components/ProblemView';
import SessionSummary from './components/SessionSummary';
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
          <Route path="/login" element={!user ? <Registration onRegister={handleRegistration} /> : <Navigate to="/dashboard" />} />
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
    timeLeft,
    problem
  } = useProblem();
  
  const cumulativeTimeSeconds = (cumulativeTime / 1000).toFixed(2);
  
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>AMC Practice</h1>
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
        <div className="score-board">
          {mode === "practice" ? (
            <>Score: {score} / {attempted} | Time Left: {formatTimeMinSec(timeLeft)}</>
          ) : (
            <>Attempted: {attempted} | Time Left: {formatTimeMinSec(timeLeft)}</>
          )}
        </div>
        {/* Only show these if they have values */}
        {cumulativeTime > 0 && (
          <div className="time-info">
            Time elapsed: {formatTimeMinSec(cumulativeTime/1000)}
          </div>
        )}

        {problem?.created_at && (
          <div className="date-info">
            Created on: {formatDate(problem.created_at)}
          </div>
        )}
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
    </div>
  );
};

export default App;