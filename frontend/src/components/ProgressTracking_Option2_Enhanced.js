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
      totalProblems: 0,
      averageScore: 0,
      accuracyPercentage: 0,
      averageSpeed: 0
    },
    recentSessions: [],
    trendData: {
      accuracy: [],
      score: [],
      dates: []
    },
    cohortComparison: {
      userScore: 0,
      userAccuracy: 0,
      userSpeed: 0,
      peerMaxScore: 0,
      peerMaxAccuracy: 0,
      peerMaxSpeed: 0,
      userScorePercentile: 0,
      userAccuracyPercentile: 0,
      userSpeedPercentile: 0,
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
          
          // Add mock data for radar chart if it doesn't exist
          if (!response.data.data.cohortComparison.userScore) {
            console.warn('Adding mock data for radar chart');
            
            // Use the average score from overall performance for the user score
            response.data.data.cohortComparison.userScore = response.data.data.overallPerformance.averageScore || 75;
            response.data.data.cohortComparison.userSpeed = 45; // Mock speed in seconds
            response.data.data.cohortComparison.peerMaxScore = 95; 
            response.data.data.cohortComparison.peerMaxAccuracy = 98;
            response.data.data.cohortComparison.peerMaxSpeed = 30; // Mock speed in seconds (lower is better)
            
            // Also add to overall performance if not there
            if (!response.data.data.overallPerformance.averageSpeed) {
              response.data.data.overallPerformance.averageSpeed = 45;
            }
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

  // Format speed in seconds to a user-friendly string
  const formatSpeed = (seconds) => {
    return `${Math.round(seconds)}s`;
  };
  
  // Calculate speed percentile (lower is better for speed, but higher percentile is better)
  const calculateSpeedPercentile = () => {
    // If userSpeed is 0 or missing data, return 0
    if (!progressData.cohortComparison.userSpeed || !progressData.cohortComparison.peerMaxSpeed) return 0;
    
    // Get the user's speed and peer max speed
    const userSpeed = progressData.cohortComparison.userSpeed;
    const peerMaxSpeed = progressData.cohortComparison.peerMaxSpeed;
    
    // Handle edge cases
    if (userSpeed <= 0) return 100; // Perfect speed (instant) gets 100th percentile
    if (peerMaxSpeed <= 0) return 0; // Avoid division by zero
    
    // Calculate what percent of the way the user is from 0 to peerMaxSpeed
    // A lower speed is better, so we invert the ratio
    // We add a small margin (1.2 * peerMaxSpeed) to avoid extremes at the boundaries
    // This ensures that speeds slightly above peer max don't get 0 percentile
    const speedPercentile = Math.max(0, Math.min(100, 100 * (1 - (userSpeed / (peerMaxSpeed * 1.2)))));
    
    // Log for debugging
    console.log(`Speed Percentile Calculation: ${userSpeed}s / (${peerMaxSpeed}s * 1.2) = ${speedPercentile.toFixed(1)}%`);
    
    return speedPercentile;
  };
  
  // Determine the user's best metric
  const findBestMetric = () => {
    // Calculate ratios for each metric (normalized to 0-100 scale)
    const scoreRatio = progressData.cohortComparison.userScore / progressData.cohortComparison.peerMaxScore * 100;
    const accuracyRatio = progressData.cohortComparison.userAccuracy;
    // For speed, we calculate a percentile where higher is better
    const speedPercentile = calculateSpeedPercentile();
    
    // Get the best metric based on highest percentile
    let bestMetric = '';
    let bestRatio = 0;
    
    // Create an array of metrics for easier comparison and logging
    const metrics = [
      { name: 'Score', value: scoreRatio },
      { name: 'Accuracy', value: accuracyRatio },
      { name: 'Speed', value: speedPercentile }
    ];
    
    // Sort metrics by their values (descending)
    const sortedMetrics = [...metrics].sort((a, b) => b.value - a.value);
    
    // Log metric rankings for debugging
    console.log('Metric Rankings:');
    sortedMetrics.forEach((metric, index) => {
      console.log(`  ${index + 1}. ${metric.name}: ${metric.value.toFixed(1)}%`);
    });
    
    // The best metric is the one with the highest value
    bestMetric = sortedMetrics[0].name;
    
    return bestMetric;
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
              <div className="overview-stat">
                <div className="stat-value">{progressData.overallPerformance.averageSpeed.toFixed(1)}</div>
                <div className="stat-label">Avg. Speed(s)</div>
              </div>            </div>
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
                
                {/* Strongest Metric Section */}
                <div className="percentile-container">
                  <div className="percentile-label">Your Strongest Metric</div>
                  <div className="best-metric-container">
                    {(() => {
                      const bestMetric = findBestMetric();
                      let metricValue = '';
                      let metricColor = '#4f46e5';
                      
                      if (bestMetric === 'Score') {
                        metricValue = `${Math.round(progressData.cohortComparison.userScore)}/${Math.round(progressData.cohortComparison.peerMaxScore)}`;
                        metricColor = '#4f46e5';
                      } else if (bestMetric === 'Accuracy') {
                        metricValue = `${Math.round(progressData.cohortComparison.userAccuracy)}%`;
                        metricColor = '#ffa500';
                      } else if (bestMetric === 'Speed') {
                        // Show speed as both raw value and percentile rank
                        const speedPercentile = Math.round(calculateSpeedPercentile());
                        metricValue = `${Math.round(progressData.cohortComparison.userSpeed)}s (${speedPercentile}%)`;
                        metricColor = '#10b981';
                      }
                      
                      return (
                        <div className="best-metric-highlight" style={{ color: metricColor }}>
                          <span className="best-metric-name">{bestMetric}</span>
                          <span className="best-metric-value">{metricValue}</span>
                          {bestMetric === 'Speed' && (
                            <span style={{ fontSize: '0.8rem', marginTop: '5px' }}>
                              (lower time is better)
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  <div className="percentile-text">
                    You're in the top {Math.round(100 - (progressData.cohortComparison ? progressData.cohortComparison.userPercentile : 0))}% of students
                  </div>
                </div>
                
                {/* Radar Chart */}
                <div className="radar-chart-container">
                  <div className="radar-chart-title">Performance Metrics Comparison</div>
                  
                  {/* Informational text about speed percentile */}
                  <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '15px' }}>
                    Note: For Speed, a lower time (seconds) is better, but a higher percentile represents better performance.
                  </div>
                  
                  <div style={{ alignSelf: 'center', width: '100%' }} className="radar-chart">
                    <svg width="100%" height="400" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet">
                      {/* Enhancement zone indicator (15% circle) */}
                      <circle 
                        cx="200" 
                        cy="200" 
                        r={150 * 0.15} 
                        fill="rgba(226, 232, 240, 0.2)" 
                        stroke="#e2e8f0" 
                        strokeWidth="1" 
                        strokeDasharray="4,2"
                      />
                      <text 
                        x="200" 
                        y="160" 
                        textAnchor="middle" 
                        fontSize="9" 
                        fill="#94a3b8"
                      >
                        Enhanced visibility zone (15%)
                      </text>
                      
                      {/* Background circles */}
                      {[0.25, 0.5, 0.75, 1].map((scale, i) => (
                        <g key={`bg-circle-${i}`}>
                          <circle 
                            cx="200" 
                            cy="200" 
                            r={150 * scale} 
                            fill={scale === 0.25 ? "rgba(226, 232, 240, 0.1)" : 
                                 scale === 0.5 ? "rgba(226, 232, 240, 0.15)" : 
                                 scale === 0.75 ? "rgba(226, 232, 240, 0.05)" : 
                                 "rgba(226, 232, 240, 0.02)"}
                            stroke={scale === 1 ? "#cbd5e1" : "#e2e8f0"} 
                            strokeWidth={scale === 1 ? "1.5" : "1"} 
                            opacity={scale === 1 ? 0.9 : 0.7} 
                          />
                          {scale === 0.25 && (
                            <text x="205" y={200 - (150 * scale)} textAnchor="start" fontSize="10" fill="#94a3b8" opacity="0.9" fontWeight="600">
                              {Math.round(scale * 100)}%
                            </text>
                          )}
                          {scale === 0.5 && (
                            <text x="205" y={200 - (150 * scale)} textAnchor="start" fontSize="10" fill="#94a3b8" opacity="0.9" fontWeight="600">
                              {Math.round(scale * 100)}%
                            </text>
                          )}
                          {scale === 0.75 && (
                            <text x="205" y={200 - (150 * scale)} textAnchor="start" fontSize="10" fill="#94a3b8" opacity="0.9" fontWeight="600">
                              {Math.round(scale * 100)}%
                            </text>
                          )}
                          {scale === 1 && (
                            <text x="205" y={200 - (150 * scale)} textAnchor="start" fontSize="10" fill="#94a3b8" opacity="0.9" fontWeight="600">
                              100%
                            </text>
                          )}
                        </g>
                      ))}
                      
                      {/* Axis lines */}
                      {[
                        { label: "Score", angle: 0 },
                        { label: "Accuracy", angle: 120 },
                        { label: "Speed", angle: 240 }
                      ].map((axis, i) => {
                        const radian = (axis.angle - 90) * (Math.PI / 180);
                        const x = 200 + 150 * Math.cos(radian);
                        const y = 200 + 150 * Math.sin(radian);
                        
                        // Calculate label position a bit further out
                        const labelRadian = (axis.angle - 90) * (Math.PI / 180);
                        const labelX = 200 + 180 * Math.cos(labelRadian);
                        const labelY = 200 + 180 * Math.sin(labelRadian);
                        
                        return (
                          <g key={`axis-${i}`}>
                            <line 
                              x1="200" 
                              y1="200" 
                              x2={x} 
                              y2={y} 
                              stroke={axis.label === "Score" ? "rgba(79, 70, 229, 0.4)" :
                                      axis.label === "Accuracy" ? "rgba(255, 165, 0, 0.4)" :
                                      "rgba(16, 185, 129, 0.4)"} // Color-coded axes
                              strokeWidth="2.5" // Thicker stroke
                            />
                            <text 
                              x={labelX} 
                              y={labelY} 
                              textAnchor="middle" 
                              dominantBaseline="middle" 
                              fontSize="14" 
                              fontWeight="600" 
                              fill={axis.label === "Score" ? "#4f46e5" :
                                    axis.label === "Accuracy" ? "#ffa500" :
                                    "#10b981"} // Color-coded by metric
                              style={{ textShadow: "0px 0px 3px rgba(255,255,255,0.8)" }} // Text shadow for better contrast
                            >
                              {axis.label}
                            </text>
                          </g>
                        );
                      })}
                      
                      {/* Peer maximum area */}
                      <path 
                        d={(() => {
                          const scoreAngle = -90 * (Math.PI / 180);
                          const accuracyAngle = (120 - 90) * (Math.PI / 180);
                          const speedAngle = (240 - 90) * (Math.PI / 180);
                          
                          // For visualization consistency, scale all axes to actual peer maximum values
                          // This shows real data distribution but might create an asymmetric shape
                          const normalizedScore = progressData.cohortComparison.peerMaxScore / 100; // Scale based on max score (typically 6.0/100)
                          const normalizedAccuracy = progressData.cohortComparison.peerMaxAccuracy / 100; // Scale based on max accuracy (typically 24.0/100)
                          const normalizedSpeed = progressData.cohortComparison.peerMaxSpeed < 1 ? progressData.cohortComparison.peerMaxSpeed : 0.26; // Scale based on best speed
                          
                          // Apply a minimum scale to ensure visibility
                          const minScaleFactor = 0.15;
                          const scoreScale = Math.max(normalizedScore, minScaleFactor);
                          const accuracyScale = Math.max(normalizedAccuracy, minScaleFactor);
                          const speedScale = Math.max(normalizedSpeed, minScaleFactor);
                          
                          const scoreX = 200 + 150 * scoreScale * Math.cos(scoreAngle);
                          const scoreY = 200 + 150 * scoreScale * Math.sin(scoreAngle);
                          
                          const accuracyX = 200 + 150 * accuracyScale * Math.cos(accuracyAngle);
                          const accuracyY = 200 + 150 * accuracyScale * Math.sin(accuracyAngle);
                          
                          const speedX = 200 + 150 * speedScale * Math.cos(speedAngle);
                          const speedY = 200 + 150 * speedScale * Math.sin(speedAngle);
                          
                          return `M ${scoreX} ${scoreY} L ${accuracyX} ${accuracyY} L ${speedX} ${speedY} Z`;
                        })()}
                        fill="rgba(226, 232, 240, 0.3)"
                        stroke="#cbd5e1"
                        strokeWidth="1"
                        strokeDasharray="5,5"
                      />
                      
                      {/* User performance area */}
                      <path 
                        d={(() => {
                          const scoreAngle = -90 * (Math.PI / 180);
                          const accuracyAngle = (120 - 90) * (Math.PI / 180);
                          const speedAngle = (240 - 90) * (Math.PI / 180);
                          
                          // Calculate relative positions (ratio to peer max)
                          const scoreRatio = progressData.cohortComparison.userScore / progressData.cohortComparison.peerMaxScore;
                          const accuracyRatio = progressData.cohortComparison.userAccuracy / 100;
                          
                          // For speed, calculate the percentile (higher is better)
                          const normalizedUserSpeed = calculateSpeedPercentile() / 100;
                          
                          // Apply a minimum scale factor (0.15) to ensure metrics are visible
                          // This "pulls" small values away from the center for better visibility
                          const minScaleFactor = 0.15;
                          const enhancedScoreRatio = minScaleFactor + (1 - minScaleFactor) * scoreRatio;
                          const enhancedAccuracyRatio = minScaleFactor + (1 - minScaleFactor) * accuracyRatio;
                          const enhancedSpeedRatio = minScaleFactor + (1 - minScaleFactor) * normalizedUserSpeed;
                          
                          const scoreX = 200 + 150 * enhancedScoreRatio * Math.cos(scoreAngle);
                          const scoreY = 200 + 150 * enhancedScoreRatio * Math.sin(scoreAngle);
                          
                          const accuracyX = 200 + 150 * enhancedAccuracyRatio * Math.cos(accuracyAngle);
                          const accuracyY = 200 + 150 * enhancedAccuracyRatio * Math.sin(accuracyAngle);
                          
                          const speedX = 200 + 150 * enhancedSpeedRatio * Math.cos(speedAngle);
                          const speedY = 200 + 150 * enhancedSpeedRatio * Math.sin(speedAngle);
                          
                          return `M ${scoreX} ${scoreY} L ${accuracyX} ${accuracyY} L ${speedX} ${speedY} Z`;
                        })()}
                        fill="rgba(79, 70, 229, 0.45)" // Increased opacity for better visibility
                        stroke="#4f46e5"
                        strokeWidth="2.5" // Slightly thicker stroke
                      />
                      
                      {/* User performance points */}
                      {(() => {
                        const scoreAngle = -90 * (Math.PI / 180);
                        const accuracyAngle = (120 - 90) * (Math.PI / 180);
                        const speedAngle = (240 - 90) * (Math.PI / 180);
                        
                        // Calculate relative positions (ratio to peer max)
                        const scoreRatio = progressData.cohortComparison.userScore / progressData.cohortComparison.peerMaxScore;
                        const accuracyRatio = progressData.cohortComparison.userAccuracy / 100;
                        
                        // For speed, calculate the percentile (higher is better)
                        const normalizedUserSpeed = calculateSpeedPercentile() / 100;
                        
                        // Apply a minimum scale factor (0.15) to ensure metrics are visible
                        // This "pulls" small values away from the center for better visibility
                        const minScaleFactor = 0.15;
                        const enhancedScoreRatio = minScaleFactor + (1 - minScaleFactor) * scoreRatio;
                        const enhancedAccuracyRatio = minScaleFactor + (1 - minScaleFactor) * accuracyRatio;
                        const enhancedSpeedRatio = minScaleFactor + (1 - minScaleFactor) * normalizedUserSpeed;
                        
                        const scoreX = 200 + 150 * enhancedScoreRatio * Math.cos(scoreAngle);
                        const scoreY = 200 + 150 * enhancedScoreRatio * Math.sin(scoreAngle);
                        
                        const accuracyX = 200 + 150 * enhancedAccuracyRatio * Math.cos(accuracyAngle);
                        const accuracyY = 200 + 150 * enhancedAccuracyRatio * Math.sin(accuracyAngle);
                        
                        const speedX = 200 + 150 * enhancedSpeedRatio * Math.cos(speedAngle);
                        const speedY = 200 + 150 * enhancedSpeedRatio * Math.sin(speedAngle);
                        
                        // Calculate which metric is the student's strongest
                        let bestMetricIndex = 0;
                        let metrics = [
                          { ratio: scoreRatio, index: 0, name: 'Score' },
                          { ratio: accuracyRatio, index: 1, name: 'Accuracy' },
                          { ratio: normalizedUserSpeed, index: 2, name: 'Speed' }
                        ];
                        
                        // Sort metrics by their ratio values (descending)
                        const sortedMetrics = [...metrics].sort((a, b) => b.ratio - a.ratio);
                        bestMetricIndex = sortedMetrics[0].index;
                        
                        // Log the metric rankings for debugging
                        console.log('Radar Chart Metric Rankings:', sortedMetrics.map(m => `${m.name}: ${(m.ratio * 100).toFixed(1)}%`).join(', '));
                        
                        return [
                          { 
                            x: scoreX, 
                            y: scoreY, 
                            label: "Score", 
                            value: `${Math.round(progressData.cohortComparison.userScore)}`, 
                            max: `${Math.round(progressData.cohortComparison.peerMaxScore)}`,
                            isBest: bestMetricIndex === 0 
                          },
                          { 
                            x: accuracyX, 
                            y: accuracyY, 
                            label: "Accuracy", 
                            value: `${Math.round(progressData.cohortComparison.userAccuracy)}%`, 
                            max: `${Math.round(progressData.cohortComparison.peerMaxAccuracy)}%`,
                            isBest: bestMetricIndex === 1 
                          },
                          { 
                            x: speedX, 
                            y: speedY, 
                            label: "Speed", 
                            value: `${Math.round(progressData.cohortComparison.userSpeed)}s (${Math.round(calculateSpeedPercentile())}%)`, 
                            max: `${Math.round(progressData.cohortComparison.peerMaxSpeed)}s`,
                            percentile: Math.round(calculateSpeedPercentile()),
                            isBest: bestMetricIndex === 2 
                          }
                        ].map((point, i) => (
                          <g key={`point-${i}`}>
                            {/* Value background */}
                            <rect
                              x={point.x - 22}
                              y={point.y - 30}
                              width="44" // Wider for more space
                              height="22" // Taller for better visibility
                              rx="6" 
                              ry="6"
                              fill={point.isBest ? "rgba(16, 185, 129, 0.2)" : 
                                   point.label === "Score" ? "rgba(79, 70, 229, 0.2)" :
                                   point.label === "Accuracy" ? "rgba(255, 165, 0, 0.2)" :
                                   "rgba(16, 185, 129, 0.2)"} // Color-code by metric
                              stroke={point.isBest ? "#10b981" : 
                                     point.label === "Score" ? "#4f46e5" :
                                     point.label === "Accuracy" ? "#ffa500" :
                                     "#10b981"}
                              strokeWidth={point.isBest ? "1.5" : "1"}
                              style={point.isBest ? {filter: "drop-shadow(0px 0px 3px rgba(16, 185, 129, 0.5))"} : {}}
                            />
                            
                            {/* Highlight the best metric with a different color */}
                            <circle 
                              cx={point.x} 
                              cy={point.y} 
                              r="8" // Larger for better visibility
                              fill={point.isBest ? "#10b981" : 
                                   point.label === "Score" ? "#4f46e5" :
                                   point.label === "Accuracy" ? "#ffa500" :
                                   "#10b981"} // Color-code by metric
                            />
                            <circle 
                              cx={point.x} 
                              cy={point.y} 
                              r="5" // Larger for better visibility
                              fill="#fff" 
                            />
                            
                            {/* Display the metric name and value */}
                            <text 
                              x={point.x} 
                              y={point.y - 18} 
                              textAnchor="middle" 
                              fontSize="14" 
                              fontWeight="700" 
                              fill={point.isBest ? "#10b981" : 
                                   point.label === "Score" ? "#4f46e5" :
                                   point.label === "Accuracy" ? "#ffa500" :
                                   "#10b981"} // Color-code by metric
                              style={{textShadow: "0px 0px 3px rgba(255, 255, 255, 0.8)"}}
                            >
                              {point.value}
                            </text>
                            
                            {/* Display the maximum value */}
                            <text 
                              x={point.x} 
                              y={point.y + 22} 
                              textAnchor="middle" 
                              fontSize="11" 
                              fill="#64748b"
                              style={{fontStyle: "italic"}}
                            >
                              {point.label === "Speed" 
                                ? `(peer best: ${point.max})` 
                                : `(max: ${point.max})`
                              }
                            </text>
                            
                            {/* Add a star or badge for the best metric */}
                            {point.isBest && (
                              <g>
                                <rect
                                  x={point.x + 14}
                                  y={point.y - 30}
                                  width="16"
                                  height="16"
                                  rx="8"
                                  ry="8"
                                  fill="#10b981"
                                />
                                <text
                                  x={point.x + 22}
                                  y={point.y - 21}
                                  textAnchor="middle"
                                  fontSize="12"
                                  fontWeight="bold"
                                  fill="white"
                                >
                                  ★
                                </text>
                              </g>
                            )}
                          </g>
                        ));
                      })()}
                      
                      {/* Center point and label */}
                      <circle cx="200" cy="200" r="4" fill="#64748b" />
                      <circle cx="200" cy="200" r="8" fill="rgba(100, 116, 139, 0.2)" stroke="#64748b" strokeWidth="1" />
                      <text x="200" y="200" textAnchor="middle" dominantBaseline="middle" fontSize="12" fill="#64748b" fontWeight="600">You</text>
                    </svg>
                  </div>
                  
                  <div style={{ alignSelf: 'center', width: '100%' }} className="radar-legend">
                    <div className="legend-item">
                      <div className="legend-color" style={{ backgroundColor: "rgba(79, 70, 229, 0.45)", border: "2px solid #4f46e5" }}></div>
                      <div className="legend-label">Your Performance</div>
                    </div>
                    <div className="legend-item">
                      <div className="legend-color" style={{ backgroundColor: "rgba(226, 232, 240, 0.3)", border: "1px dashed #cbd5e1" }}></div>
                      <div className="legend-label">Peer Maximum</div>
                    </div>
                    <div className="legend-item">
                      <div className="legend-color" style={{ backgroundColor: "#10b981" }}></div>
                      <div className="legend-label">Your Best Metric</div>
                    </div>
                    <div className="legend-item">
                      <div className="legend-color" style={{ backgroundColor: "#4f46e5" }}></div>
                      <div className="legend-label">Score</div>
                    </div>
                    <div className="legend-item">
                      <div className="legend-color" style={{ backgroundColor: "#ffa500" }}></div>
                      <div className="legend-label">Accuracy</div>
                    </div>
                    <div className="legend-item">
                      <div className="legend-color" style={{ backgroundColor: "#10b981" }}></div>
                      <div className="legend-label">Speed</div>
                    </div>
                  </div>
                  
                  {/* Additional information for understanding metrics */}
                  <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '15px', textAlign: 'center' }}>
                    <p>This radar chart shows actual peer maximum values for each metric:</p>
                    <p>Score max: {progressData.cohortComparison.peerMaxScore.toFixed(1)}/100, 
                       Accuracy max: {progressData.cohortComparison.peerMaxAccuracy.toFixed(1)}%, 
                       Speed max: {progressData.cohortComparison.peerMaxSpeed.toFixed(2)}s</p>
                    <p>Values below 15% are enhanced for better visibility.</p>
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
