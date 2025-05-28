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
    recentSessions: [],
    trendData: {
      accuracy: [],
      score: [],
      dates: []
    },
    cohortComparison: {
      userPercentile: 0,
      averageAccuracy: 0,
      topPerformerAccuracy: 0,
      userAccuracy: 0
    }
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
          <div className="progress-intro">
            <p>Track your improvement over time with detailed performance analytics. The more you practice, the more insights you'll see here!</p>
          </div>
          
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

          {/* Performance Trend Section */}
          <div className="performance-section">
            <h3>Performance Trend</h3>
            {progressData.trendData && progressData.trendData.accuracy && progressData.trendData.accuracy.length === 0 ? (
              <p className="no-data">No trend data available yet. Complete more sessions to see your progress over time.</p>
            ) : (
              <div className="trend-chart">
                <div className="trend-info">
                  <p>This chart shows your performance trend over your recent sessions.</p>
                </div>
                <div className="trend-data">
                  {progressData.trendData && progressData.trendData.accuracy && progressData.trendData.accuracy.map((accuracy, index) => (
                    <div key={index} className="trend-bar-container">
                      <div className="trend-date">{formatDate(progressData.trendData.dates[index])}</div>
                      <div className="trend-metrics">
                        <div className="trend-label">Accuracy</div>
                        <div className="bar-container">
                          <div 
                            className="bar-fill" 
                            style={{ width: `${accuracy}%` }}
                          ></div>
                          <div className="bar-text">{formatAccuracy(accuracy)}</div>
                        </div>
                        <div className="trend-label">Score</div>
                        <div className="trend-score">{progressData.trendData.score[index]}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Cohort Comparison Section */}
          <div className="performance-section">
            <h3>Comparison with Peers</h3>
            {progressData.cohortComparison && progressData.cohortComparison.userAccuracy === 0 ? (
              <p className="no-data">No comparison data available yet. Complete more sessions to see how you compare with peers.</p>
            ) : (
              <div className="cohort-comparison">
                <div className="comparison-info">
                  <p>See how your performance compares to other students working on similar problems.</p>
                </div>
                <div className="percentile-container">
                  <div className="percentile-label">Your Position</div>
                  <div className="percentile-bar-container">
                    <div 
                      className="percentile-marker"
                      style={{ left: `${progressData.cohortComparison ? progressData.cohortComparison.userPercentile : 0}%` }}
                    >
                      <div className="marker-dot"></div>
                      <div className="marker-label">You</div>
                    </div>
                    <div className="percentile-bar"></div>
                    <div className="percentile-labels">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>
                  <div className="percentile-text">
                    You're in the top {Math.round(100 - (progressData.cohortComparison ? progressData.cohortComparison.userPercentile : 0))}% of students
                  </div>
                </div>
                <div className="accuracy-comparison">
                  <div className="comparison-row">
                    <div className="comparison-label">Your Accuracy</div>
                    <div className="comparison-value">{formatAccuracy(progressData.cohortComparison ? progressData.cohortComparison.userAccuracy : 0)}</div>
                    <div 
                      className="comparison-bar-fill your-accuracy" 
                      style={{ width: `${progressData.cohortComparison ? progressData.cohortComparison.userAccuracy : 0}%` }}
                    ></div>
                  </div>
                  <div className="comparison-row">
                    <div className="comparison-label">Average</div>
                    <div className="comparison-value">{formatAccuracy(progressData.cohortComparison ? progressData.cohortComparison.averageAccuracy : 0)}</div>
                    <div 
                      className="comparison-bar-fill average-accuracy" 
                      style={{ width: `${progressData.cohortComparison ? progressData.cohortComparison.averageAccuracy : 0}%` }}
                    ></div>
                  </div>
                  <div className="comparison-row">
                    <div className="comparison-label">Top Performers</div>
                    <div className="comparison-value">{formatAccuracy(progressData.cohortComparison ? progressData.cohortComparison.topPerformerAccuracy : 0)}</div>
                    <div 
                      className="comparison-bar-fill top-accuracy" 
                      style={{ width: `${progressData.cohortComparison ? progressData.cohortComparison.topPerformerAccuracy : 0}%` }}
                    ></div>
                  </div>
                </div>
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
