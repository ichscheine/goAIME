import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './ProgressTracking.css';

const ProgressTracking = ({ username }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progressData, setProgressData] = useState({
    topicPerformance: {},
    difficultyPerformance: {},
    overallPerformance: {
      totalSessions: 0,
      averageScore: 0,
      totalProblems: 0,
      accuracyPercentage: 0
    },
    recentSessions: []
  });

  useEffect(() => {
    async function fetchProgressData() {
      if (!username) return;
      
      setLoading(true);
      setError(null);
      
      try {
        console.log(`Fetching progress data for user: ${username}`);
        // Test API connection first
        const testResponse = await fetch('/api/health');
        console.log('API health check:', testResponse.ok ? 'OK' : 'Failed');
        
        // Fetch user progress data from the API
        const response = await axios.get(`/api/user/progress/${username}`);
        console.log('Progress data response:', response);
        
        if (response.data && response.data.success) {
          setProgressData(response.data.data);
        } else {
          setError('Failed to load progress data');
        }
      } catch (error) {
        console.error('Error fetching progress data:', error);
        setError('Error connecting to server');
      } finally {
        setLoading(false);
      }
    }
    
    fetchProgressData();
  }, [username]);

  // Format accuracy percentage with % symbol
  const formatAccuracy = (accuracy) => {
    return `${Math.round(accuracy)}%`;
  };

  // Format date in a user-friendly way
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (e) {
      return 'Unknown date';
    }
  };

  return (
    <div className="progress-tracking-container">
      <div className="progress-header">
        <h2>Your Progress Dashboard</h2>
        <Link 
          to="/dashboard"
          className="back-to-dashboard"
          style={{ 
            textDecoration: 'none',
            display: 'inline-block'
          }}
        >
          Back to Dashboard
        </Link>
      </div>
      {loading ? (
        <div className="progress-loading">
          <div className="spinner"></div>
          <p>Loading your progress data...</p>
        </div>
      ) : error ? (
        <div className="progress-error">
          <p>{error}</p>
          <p>Please try again later or contact support if the issue persists.</p>
        </div>
      ) : (
        <>
          <div className="progress-overview">
            <h3>Overall Performance</h3>
            <div className="overview-stats">
              <div className="overview-stat">
                <div className="stat-value">{progressData.overallPerformance.totalSessions}</div>
                <div className="stat-label">Total Sessions</div>
              </div>
              <div className="overview-stat">
                <div className="stat-value">{progressData.overallPerformance.totalProblems}</div>
                <div className="stat-label">Problems Attempted</div>
              </div>
              <div className="overview-stat">
                <div className="stat-value">{formatAccuracy(progressData.overallPerformance.accuracyPercentage)}</div>
                <div className="stat-label">Accuracy</div>
              </div>
              <div className="overview-stat">
                <div className="stat-value">{progressData.overallPerformance.averageScore.toFixed(1)}</div>
                <div className="stat-label">Avg. Score</div>
              </div>
            </div>
          </div>

          {/* Difficulty Performance Section */}
          <div className="performance-section">
            <h3>Performance by Difficulty</h3>
            <div className="difficulty-chart">
              {Object.entries(progressData.difficultyPerformance).map(([difficulty, data]) => (
                <div key={difficulty} className={`difficulty-bar difficulty-${difficulty.toLowerCase()}`}>
                  <div className="difficulty-label">{difficulty}</div>
                  <div className="bar-container">
                    <div 
                      className="bar-fill" 
                      style={{ width: `${data.accuracy}%` }}
                    ></div>
                    <div className="bar-text">{formatAccuracy(data.accuracy)}</div>
                  </div>
                  <div className="attempt-info">
                    {data.correct}/{data.attempted} correct
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Topic Performance Section */}
          <div className="performance-section">
            <h3>Performance by Topic</h3>
            <div className="topic-chart">
              {Object.entries(progressData.topicPerformance)
                .sort((a, b) => b[1].attempted - a[1].attempted) // Sort by most attempted
                .slice(0, 6) // Show top 6 most attempted topics
                .map(([topic, data]) => (
                  <div key={topic} className="topic-row">
                    <div className="topic-name">{topic}</div>
                    <div className="bar-container">
                      <div 
                        className="bar-fill" 
                        style={{ width: `${data.accuracy}%` }}
                      ></div>
                      <div className="bar-text">{formatAccuracy(data.accuracy)}</div>
                    </div>
                    <div className="attempt-info">
                      {data.correct}/{data.attempted}
                    </div>
                  </div>
                ))
              }
            </div>
            {Object.keys(progressData.topicPerformance).length > 6 && (
              <div className="more-topics-info">
                + {Object.keys(progressData.topicPerformance).length - 6} more topics
              </div>
            )}
          </div>

          {/* Recent Sessions Section */}
          <div className="performance-section">
            <h3>Recent Sessions</h3>
            <div className="recent-sessions">
              {progressData.recentSessions.length === 0 ? (
                <p className="no-data">No recent sessions found.</p>
              ) : (
                <table className="sessions-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Contest</th>
                      <th>Mode</th>
                      <th>Score</th>
                      <th>Accuracy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {progressData.recentSessions.map((session, index) => (
                      <tr key={index}>
                        <td>{formatDate(session.completedAt)}</td>
                        <td>{session.contest} {session.year}</td>
                        <td>{session.mode}</td>
                        <td>{session.score}/{session.totalAttempted}</td>
                        <td>{formatAccuracy(session.accuracy)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProgressTracking;
