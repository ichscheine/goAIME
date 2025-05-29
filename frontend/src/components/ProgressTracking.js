import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useEffect as useEffectDebug } from 'react';
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
          // Log the received data structure to diagnose missing parts
          console.log('Progress data structure:', JSON.stringify(response.data.data, null, 2));
          
          // Check if difficulty and topic data exist
          if (!response.data.data.difficultyPerformance || Object.keys(response.data.data.difficultyPerformance).length === 0) {
            console.warn('Missing difficulty performance data');
            
            // Add mock data for debugging if needed
            response.data.data.difficultyPerformance = {
              "Easy": { "correct": 25, "attempted": 30, "accuracy": 83.33 },
              "Medium": { "correct": 15, "attempted": 20, "accuracy": 75.00 },
              "Hard": { "correct": 5, "attempted": 10, "accuracy": 50.00 }
            };
          }
          
          if (!response.data.data.topicPerformance || Object.keys(response.data.data.topicPerformance).length === 0) {
            console.warn('Missing topic performance data');
            
            // Add mock data for debugging if needed
            response.data.data.topicPerformance = {
              "Algebra": { "correct": 18, "attempted": 25, "accuracy": 72.00 },
              "Geometry": { "correct": 12, "attempted": 15, "accuracy": 80.00 },
              "Number Theory": { "correct": 8, "attempted": 10, "accuracy": 80.00 },
              "Combinatorics": { "correct": 5, "attempted": 8, "accuracy": 62.50 },
              "Probability": { "correct": 2, "attempted": 2, "accuracy": 100.00 }
            };
          }
          
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
  
  // Debug effect to log state whenever it changes
  useEffectDebug(() => {
    console.log('Current progressData state:', progressData);
  }, [progressData]);

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
                <div className="stat-value">{progressData.overallPerformance.averageScore.toFixed(1)}</div>
                <div className="stat-label">Avg. Score</div>
              </div>              
              <div className="overview-stat">
                <div className="stat-value">{formatAccuracy(progressData.overallPerformance.accuracyPercentage)}</div>
                <div className="stat-label">Accuracy</div>
              </div>
            </div>
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
                <div className="time-series-chart">
                  <svg width="100%" height="500" viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid meet">
                    {/* Chart background */}
                    <rect x="70" y="40" width="860" height="380" fill="#f8fafc" rx="6" ry="6" />
                    
                    {/* X and Y axes */}
                    <line x1="70" y1="420" x2="930" y2="420" stroke="#cbd5e1" strokeWidth="2" />
                    <line x1="70" y1="40" x2="70" y2="420" stroke="#cbd5e1" strokeWidth="2" />
                    <line x1="930" y1="40" x2="930" y2="420" stroke="#cbd5e1" strokeWidth="2" /> {/* Right y-axis for accuracy */}
                    
                    {/* Left Y-axis labels (Score) */}
                    {progressData.trendData && progressData.trendData.score && progressData.trendData.score.length > 0 && (() => {
                      const maxScore = Math.max(...progressData.trendData.score);
                      const scoreStep = Math.ceil(maxScore / 4);
                      const scoreLabels = [0, scoreStep, scoreStep * 2, scoreStep * 3, scoreStep * 4];
                      
                      return scoreLabels.map((tick, i) => (
                        <g key={`score-tick-${i}`}>
                          <line 
                            x1="65" 
                            y1={420 - (tick * (380 / (scoreLabels[4] || 1)))} 
                            x2="70" 
                            y2={420 - (tick * (380 / (scoreLabels[4] || 1)))} 
                            stroke="#cbd5e1" 
                            strokeWidth="2" 
                          />
                          <text 
                            x="62" 
                            y={420 - (tick * (380 / (scoreLabels[4] || 1)))} 
                            textAnchor="end" 
                            alignmentBaseline="middle" 
                            fontSize="14"
                            fill="#64748b"
                          >
                            {tick}
                          </text>
                        </g>
                      ));
                    })()}

                    {/* Right Y-axis labels (Accuracy) */}
                    {[0, 25, 50, 75, 100].map((tick, i) => (
                      <g key={`y-tick-${i}`}>
                        <line 
                          x1="930" 
                          y1={420 - (tick * 3.8)} 
                          x2="935" 
                          y2={420 - (tick * 3.8)} 
                          stroke="#cbd5e1" 
                          strokeWidth="2" 
                        />
                        <text 
                          x="938" 
                          y={420 - (tick * 3.8)} 
                          textAnchor="start" 
                          alignmentBaseline="middle" 
                          fontSize="14"
                          fill="#64748b"
                        >
                          {tick}%
                        </text>
                      </g>
                    ))}
                    
                    {/* Grid lines */}
                    {[0, 25, 50, 75, 100].map((tick, i) => (
                      <line 
                        key={`grid-${i}`}
                        x1="70" 
                        y1={420 - (tick * 3.8)} 
                        x2="930" 
                        y2={420 - (tick * 3.8)} 
                        stroke="#e2e8f0" 
                        strokeWidth="1" 
                        strokeDasharray="5,5"
                      />
                    ))}
                    
                    {/* Generate line paths for accuracy and score */}
                    {progressData.trendData && progressData.trendData.accuracy && progressData.trendData.accuracy.length > 0 && (
                      <>
                        {/* Score line (primary metric) */}
                        <path 
                          d={progressData.trendData.score.reduce((path, score, i, arr) => {
                            const dataLength = progressData.trendData.score.length;
                            const xStep = 860 / (dataLength - 1 || 1);
                            // Reverse the index to make dates ascend from left to right
                            const revIndex = dataLength - 1 - i;
                            const x = 70 + (revIndex * xStep);
                            const maxScore = Math.max(...progressData.trendData.score);
                            const y = 420 - (score * (380 / (maxScore || 1)));
                            return `${path} ${i === 0 ? 'M' : 'L'} ${x},${y}`;
                          }, '')}
                          fill="none" 
                          stroke="#4f46e5" 
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        {/* Accuracy line (secondary metric) */}
                        <path 
                          d={progressData.trendData.accuracy.reduce((path, accuracy, i) => {
                            const dataLength = progressData.trendData.accuracy.length;
                            const xStep = 860 / (dataLength - 1 || 1);
                            // Reverse the index to make dates ascend from left to right
                            const revIndex = dataLength - 1 - i;
                            const x = 70 + (revIndex * xStep);
                            const y = 420 - (accuracy * 3.8);
                            return `${path} ${i === 0 ? 'M' : 'L'} ${x},${y}`;
                          }, '')}
                          fill="none" 
                          stroke="#ffa500" 
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        
                        {/* Score data points */}
                        {progressData.trendData.score.map((score, i) => {
                          const dataLength = progressData.trendData.score.length;
                          const xStep = 860 / (dataLength - 1 || 1);
                          // Reverse the index to make dates ascend from left to right
                          const revIndex = dataLength - 1 - i;
                          const x = 70 + (revIndex * xStep);
                          const maxScore = Math.max(...progressData.trendData.score);
                          const y = 420 - (score * (380 / (maxScore || 1)));
                          return (
                            <g key={`score-point-${i}`}>
                              <circle 
                                cx={x}
                                cy={y}
                                r="6" 
                                fill="#4f46e5" 
                              />
                              <circle 
                                cx={x}
                                cy={y}
                                r="4" 
                                fill="#fff" 
                              />
                              <title>
                                {`Date: ${formatDate(progressData.trendData.dates[i])}\nAccuracy: ${progressData.trendData.accuracy[i]}%\nScore: ${score}`}
                              </title>
                            </g>
                          );
                        })}
                        
                        {/* Accuracy data points */}
                        {progressData.trendData.accuracy.map((accuracy, i) => {
                          const dataLength = progressData.trendData.accuracy.length;
                          const xStep = 860 / (dataLength - 1 || 1);
                          // Reverse the index to make dates ascend from left to right
                          const revIndex = dataLength - 1 - i;
                          const x = 70 + (revIndex * xStep);
                          const y = 420 - (accuracy * 3.8);
                          return (
                            <g key={`accuracy-point-${i}`}>
                              <circle 
                                cx={x}
                                cy={y}
                                r="6" 
                                fill="#ffa500" 
                              />
                              <circle 
                                cx={x}
                                cy={y}
                                r="4" 
                                fill="#fff" 
                              />
                              <title>
                                {`Date: ${formatDate(progressData.trendData.dates[i])}\nAccuracy: ${accuracy}%\nScore: ${progressData.trendData.score[i]}`}
                              </title>
                            </g>
                          );
                        })}
                        
                        {/* X-axis labels (dates) - fixed positioning */}
                        {progressData.trendData.dates.map((date, i) => {
                          const dataLength = progressData.trendData.dates.length;
                          const xStep = 860 / (dataLength - 1 || 1);
                          // Reverse the index to make dates ascend from left to right
                          const revIndex = dataLength - 1 - i;
                          const x = 70 + (revIndex * xStep);
                          
                          // Only show labels for the first, middle, and last date if there are more than 3
                          const showLabel = dataLength <= 5 || i === 0 || i === dataLength - 1 || i === Math.floor(dataLength / 2);
                          
                          return showLabel ? (
                            <text 
                              key={`x-label-${i}`}
                              x={x} 
                              y="460" 
                              textAnchor="middle" 
                              fontSize="14"
                              fill="#64748b"
                              transform={`rotate(45 ${x}, 460)`}
                            >
                              {formatDate(date)}
                            </text>
                          ) : null;
                        })}

                        {/* Y-axis titles */}
                        <text 
                          x="25" 
                          y="230" 
                          textAnchor="middle" 
                          fontSize="15"
                          fontWeight="600"
                          fill="#64748b"
                          transform="rotate(-90 25, 230)"
                        >
                          Score
                        </text>
                        <text 
                          x="975" 
                          y="230" 
                          textAnchor="middle" 
                          fontSize="15"
                          fontWeight="600"
                          fill="#64748b"
                          transform="rotate(90 975, 230)"
                        >
                          Accuracy (%)
                        </text>
                      </>
                    )}
                  </svg>
                  
                  <div className="chart-legend">
                    <div className="legend-item">
                      <div className="legend-color" style={{ backgroundColor: "#4f46e5" }}></div>
                      <div className="legend-label">Score</div>
                    </div>
                    <div className="legend-item">
                      <div className="legend-color" style={{ backgroundColor: "#ffa500" }}></div>
                      <div className="legend-label">Accuracy (%)</div>
                    </div>
                  </div>
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
