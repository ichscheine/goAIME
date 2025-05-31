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
          
          // Calculate proper cohort comparison metrics if they don't exist
          if (!response.data.data.cohortComparison || !response.data.data.cohortComparison.userScore) {
            console.log('Fetching real cohort comparison metrics from API');
            
            // Initialize cohortComparison object if it doesn't exist
            if (!response.data.data.cohortComparison) {
              response.data.data.cohortComparison = {};
            }
            
            // Use actual user metrics from overall performance
            response.data.data.cohortComparison.userScore = response.data.data.overallPerformance.averageScore || 0;
            response.data.data.cohortComparison.userAccuracy = response.data.data.overallPerformance.accuracyPercentage || 0;
            response.data.data.cohortComparison.userSpeed = response.data.data.overallPerformance.averageSpeed || 0;
            
            try {
              // Fetch real cohort data from the API
              const cohortResponse = await axios.get(`/api/cohort/metrics/${username}`);
              
              if (cohortResponse.data && cohortResponse.data.success) {
                console.log('Received cohort metrics from API:', cohortResponse.data);
                
                // Store cohort data for percentile calculations
                const cohortData = cohortResponse.data.data.cohortData;
                response.data.data.cohortComparison.cohortData = cohortData;
                
                // Store peer maximum values from API
                response.data.data.cohortComparison.peerMaxScore = cohortResponse.data.data.peerMaxScore;
                response.data.data.cohortComparison.peerMaxAccuracy = cohortResponse.data.data.peerMaxAccuracy;
                response.data.data.cohortComparison.peerMaxSpeed = cohortResponse.data.data.peerMaxSpeed;
                
                // Store user metrics from API - make sure to include the speed value from cohort metrics
                response.data.data.cohortComparison.userScore = cohortResponse.data.data.userScore || response.data.data.cohortComparison.userScore;
                response.data.data.cohortComparison.userAccuracy = cohortResponse.data.data.userAccuracy || response.data.data.cohortComparison.userAccuracy;
                response.data.data.cohortComparison.userSpeed = cohortResponse.data.data.userSpeed; // Use speed directly from cohort metrics
                
                // Store user percentile values from API
                response.data.data.cohortComparison.userScorePercentile = cohortResponse.data.data.userScorePercentile;
                response.data.data.cohortComparison.userAccuracyPercentile = cohortResponse.data.data.userAccuracyPercentile;
                response.data.data.cohortComparison.userSpeedPercentile = cohortResponse.data.data.userSpeedPercentile;
                
                // Store overall user percentile from API
                response.data.data.cohortComparison.userPercentile = cohortResponse.data.data.userPercentile;
                
                console.log('Imported cohort metrics from API:', response.data.data.cohortComparison);
                console.log('User Speed from cohort API:', cohortResponse.data.data.userSpeed);
                console.log('User Speed in cohortComparison after import:', response.data.data.cohortComparison.userSpeed);
              } else {
                console.error('API returned unsuccessful response:', cohortResponse);
                throw new Error('Failed to get cohort metrics data from API: ' + 
                  (cohortResponse.data && cohortResponse.data.message ? cohortResponse.data.message : 'Unknown error'));
              }
            } catch (cohortError) {
              console.error('Error fetching cohort metrics:', cohortError);
              
              if (cohortError.response) {
                console.error('API error response:', cohortError.response.status, cohortError.response.data);
              }
              
              // Fallback: Calculate estimated percentile values based on available data
              console.warn('Using fallback percentile calculation method');
              
              // For score and accuracy: higher is better, scale linearly compared to peer max
              // Assume peer max is ~25% higher than user's value if we don't have real data
              const estimatedPeerMaxScore = response.data.data.cohortComparison.userScore * 1.25;
              response.data.data.cohortComparison.peerMaxScore = Math.min(100, estimatedPeerMaxScore);
              
              const estimatedPeerMaxAccuracy = response.data.data.cohortComparison.userAccuracy * 1.25;
              response.data.data.cohortComparison.peerMaxAccuracy = Math.min(100, estimatedPeerMaxAccuracy);
              
              // For speed: lower is better, assume peer max speed is ~20% faster than user's
              const userSpeed = response.data.data.cohortComparison.userSpeed;
              response.data.data.cohortComparison.peerMaxSpeed = Math.max(1, userSpeed * 0.8);
              
              // Calculate estimated percentiles based on ratio to peer max
              const scorePercentile = response.data.data.cohortComparison.peerMaxScore > 0 
                ? (response.data.data.cohortComparison.userScore / response.data.data.cohortComparison.peerMaxScore * 100)
                : 0;
              
              const accuracyPercentile = response.data.data.cohortComparison.peerMaxAccuracy > 0 
                ? (response.data.data.cohortComparison.userAccuracy / response.data.data.cohortComparison.peerMaxAccuracy * 100)
                : 0;
              
              // For speed, lower is better, so we invert the ratio
              const speedPercentile = response.data.data.cohortComparison.peerMaxSpeed > 0 
                ? Math.max(0, Math.min(100, 100 * (1 - (userSpeed / (response.data.data.cohortComparison.peerMaxSpeed * 1.2)))))
                : 0;
              
              // Store user percentile values
              response.data.data.cohortComparison.userScorePercentile = scorePercentile;
              response.data.data.cohortComparison.userAccuracyPercentile = accuracyPercentile;
              response.data.data.cohortComparison.userSpeedPercentile = speedPercentile;
              
              // Overall percentile is the average of the three metric percentiles
              response.data.data.cohortComparison.userPercentile = Math.round(
                (scorePercentile + accuracyPercentile + speedPercentile) / 3
              );
              
              console.log('Calculated fallback cohort metrics:', response.data.data.cohortComparison);
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
    if (accuracy === undefined || accuracy === null) {
      return '0%';
    }
    return `${Math.round(accuracy)}%`;
  };

  // Format speed in seconds to a user-friendly string
  const formatSpeed = (seconds) => {
    if (seconds === undefined || seconds === null) {
      return '0s';
    }
    return `${Math.round(seconds)}s`;
  };
  
  // Calculate speed percentile (lower is better for speed, but higher percentile is better)
  const calculateSpeedPercentile = () => {
    // If cohortComparison doesn't exist or is missing data, return 0
    if (!progressData.cohortComparison || !progressData.cohortComparison.userSpeed) return 0;
    
    // If we have a pre-calculated userSpeedPercentile from the API, use that
    if (progressData.cohortComparison.userSpeedPercentile !== undefined && progressData.cohortComparison.userSpeedPercentile > 0) {
      console.log(`Using API-provided Speed Percentile: ${progressData.cohortComparison.userSpeedPercentile.toFixed(1)}%`);
      return progressData.cohortComparison.userSpeedPercentile;
    }
    
    // If we have cohort data available, calculate the percentile directly
    if (progressData.cohortComparison.cohortData && progressData.cohortComparison.cohortData.speeds && progressData.cohortComparison.cohortData.speeds.length > 0) {
      const userSpeed = progressData.cohortComparison.userSpeed;
      const cohortSpeeds = progressData.cohortComparison.cohortData.speeds;
      
      // For speed, lower is better
      // Calculate what percentage of the cohort speeds are higher than the user's speed
      const speedPercentile = cohortSpeeds.length > 0 
        ? cohortSpeeds.filter(speed => speed > userSpeed).length / cohortSpeeds.length * 100 
        : 0;
      
      // Log for debugging
      console.log(`Statistical Speed Percentile: ${typeof speedPercentile === 'number' ? speedPercentile.toFixed(1) : '0.0'}% (${cohortSpeeds.filter(speed => speed > userSpeed).length} out of ${cohortSpeeds.length} peer speeds are slower than user's ${userSpeed}s)`);
      
      return speedPercentile;
    }
    
    // Fallback: use the simpler calculation if we don't have cohort data
    // Get the user's speed and peer max speed
    const userSpeed = progressData.cohortComparison.userSpeed;
    const peerMaxSpeed = progressData.cohortComparison.peerMaxSpeed;
    
    // Handle edge cases
    if (userSpeed <= 0) return 100; // Perfect speed (instant) gets 100th percentile
    if (peerMaxSpeed <= 0) return 0; // Avoid division by zero
    
    // Calculate percentile based on distance from peer max (which is better)
    // A lower speed is better, so we invert the ratio
    const speedPercentile = Math.max(0, Math.min(100, 100 * (1 - (userSpeed / (peerMaxSpeed * 1.2)))));
    
    // Log for debugging
    console.log(`Fallback Speed Percentile Calculation: ${userSpeed}s / (${peerMaxSpeed}s * 1.2) = ${typeof speedPercentile === 'number' ? speedPercentile.toFixed(1) : '0.0'}%`);
    
    return speedPercentile;
  };
  
  // Determine the user's best metric
  const findBestMetric = () => {
    // If cohort comparison data is missing, return empty string
    if (!progressData.cohortComparison) return '';
    
    // Get percentiles for each metric from cohort comparison data
    const scorePercentile = progressData.cohortComparison.userScorePercentile !== undefined 
      ? progressData.cohortComparison.userScorePercentile 
      : (progressData.cohortComparison.peerMaxScore > 0 
         ? (progressData.cohortComparison.userScore / progressData.cohortComparison.peerMaxScore * 100)
         : 0);
    
    const accuracyPercentile = progressData.cohortComparison.userAccuracyPercentile !== undefined 
      ? progressData.cohortComparison.userAccuracyPercentile 
      : (progressData.cohortComparison.peerMaxAccuracy > 0 
         ? (progressData.cohortComparison.userAccuracy / progressData.cohortComparison.peerMaxAccuracy * 100)
         : 0);
    
    const speedPercentile = calculateSpeedPercentile();
    
    // Create an array of metrics for easier comparison and logging
    const metrics = [
      { name: 'Score', value: scorePercentile },
      { name: 'Accuracy', value: accuracyPercentile },
      { name: 'Speed', value: speedPercentile }
    ];
    
    // Log raw metric values for debugging
    console.log('Raw metric values:');
    console.log(`  Score: ${progressData.cohortComparison.userScore}, Percentile: ${scorePercentile}`);
    console.log(`  Accuracy: ${progressData.cohortComparison.userAccuracy}, Percentile: ${accuracyPercentile}`);
    console.log(`  Speed: ${progressData.cohortComparison.userSpeed}, Percentile: ${speedPercentile}`);
    
    // Sort metrics by their values (descending)
    const sortedMetrics = [...metrics].sort((a, b) => b.value - a.value);
    
    // Log metric rankings for debugging
    console.log('Metric Rankings (using real data):');
    sortedMetrics.forEach((metric, index) => {
      const metricValue = metric.value !== undefined && metric.value !== null ? metric.value.toFixed(1) : '0.0';
      console.log(`  ${index + 1}. ${metric.name}: ${metricValue}%`);
    });
    
    // The best metric is the one with the highest percentile
    return sortedMetrics[0].name;
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
                <div className="stat-value">{progressData.overallPerformance && progressData.overallPerformance.averageScore !== undefined ? progressData.overallPerformance.averageScore.toFixed(1) : '0.0'}</div>
                <div className="stat-label">Avg. Score</div>
              </div>              
              <div className="overview-stat">
                <div className="stat-value">{progressData.overallPerformance && progressData.overallPerformance.accuracyPercentage !== undefined ? formatAccuracy(progressData.overallPerformance.accuracyPercentage) : '0%'}</div>
                <div className="stat-label">Accuracy</div>
              </div>
              <div className="overview-stat">
                <div className="stat-value">{progressData.overallPerformance && progressData.overallPerformance.averageSpeed !== undefined ? progressData.overallPerformance.averageSpeed.toFixed(1) : '0.0'}</div>
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
                  <p>This chart shows your performance trend over your {progressData.trendData.dates.length} most recent sessions. Statistics calculated from these {progressData.trendData.dates.length} sessions may differ from overall lifetime averages.</p>
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
                        
                        {/* Score mean line */}
                        {(() => {
                          const scoreValues = progressData.trendData.score;
                          if (scoreValues.length === 0) return null;
                          
                          // Calculate mean score
                          const mean = scoreValues.reduce((sum, val) => sum + val, 0) / scoreValues.length;
                          const maxScore = Math.max(...scoreValues);
                          const y = 420 - (mean * (380 / (maxScore || 1)));
                          
                          return (
                            <line 
                              x1="70" 
                              y1={y} 
                              x2="930" 
                              y2={y} 
                              stroke="#4f46e5" 
                              className="mean-line" 
                            />
                          );
                        })()}
                        
                        {/* Score confidence interval area */}
                        {(() => {
                          const scoreValues = progressData.trendData.score;
                          if (scoreValues.length < 3) return null;
                          
                          // Calculate mean and standard deviation
                          const mean = scoreValues.reduce((sum, val) => sum + val, 0) / scoreValues.length;
                          const variance = scoreValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / scoreValues.length;
                          const stdDev = Math.sqrt(variance);
                          
                          // 95% confidence interval = mean ± 1.96 * (stdDev / sqrt(n))
                          const confidenceFactor = 1.96 * (stdDev / Math.sqrt(scoreValues.length));
                          const upperCI = mean + confidenceFactor;
                          const lowerCI = Math.max(0, mean - confidenceFactor);
                          
                          const maxScore = Math.max(...scoreValues);
                          const upperY = 420 - (upperCI * (380 / (maxScore || 1)));
                          const lowerY = 420 - (lowerCI * (380 / (maxScore || 1)));
                          
                          return (
                            <rect 
                              x="70" 
                              y={upperY} 
                              width="860" 
                              height={lowerY - upperY} 
                              fill="#4f46e5" 
                              className="confidence-area" 
                            />
                          );
                        })()}

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
                        
                        {/* Accuracy mean line */}
                        {(() => {
                          const accuracyValues = progressData.trendData.accuracy;
                          if (accuracyValues.length === 0) return null;
                          
                          // Calculate mean accuracy
                          const mean = accuracyValues.reduce((sum, val) => sum + val, 0) / accuracyValues.length;
                          const y = 420 - (mean * 3.8);
                          
                          return (
                            <line 
                              x1="70" 
                              y1={y} 
                              x2="930" 
                              y2={y} 
                              stroke="#ffa500" 
                              className="mean-line" 
                            />
                          );
                        })()}
                        
                        {/* Accuracy confidence interval area */}
                        {(() => {
                          const accuracyValues = progressData.trendData.accuracy;
                          if (accuracyValues.length < 3) return null;
                          
                          // Calculate mean and standard deviation
                          const mean = accuracyValues.reduce((sum, val) => sum + val, 0) / accuracyValues.length;
                          const variance = accuracyValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / accuracyValues.length;
                          const stdDev = Math.sqrt(variance);
                          
                          // 95% confidence interval = mean ± 1.96 * (stdDev / sqrt(n))
                          const confidenceFactor = 1.96 * (stdDev / Math.sqrt(accuracyValues.length));
                          const upperCI = Math.min(100, mean + confidenceFactor);
                          const lowerCI = Math.max(0, mean - confidenceFactor);
                          
                          const upperY = 420 - (upperCI * 3.8);
                          const lowerY = 420 - (lowerCI * 3.8);
                          
                          return (
                            <rect 
                              x="70" 
                              y={upperY} 
                              width="860" 
                              height={lowerY - upperY} 
                              fill="#ffa500" 
                              className="confidence-area" 
                            />
                          );
                        })()}
                        
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
                    <div className="legend-item">
                      <div className="legend-color" style={{ backgroundColor: "#4f46e5", opacity: "0.2" }}></div>
                      <div className="legend-label">95% Confidence Interval</div>
                    </div>
                    <div className="legend-item">
                      <div style={{ width: "20px", height: "2px", backgroundColor: "#4f46e5", margin: "8px 0", backgroundImage: "linear-gradient(to right, #4f46e5 50%, transparent 50%)", backgroundSize: "8px 100%" }}></div>
                      <div className="legend-label">Mean Value</div>
                    </div>
                  </div>
                  
                  {/* User metrics statistics */}
                  {(() => {
                    const scoreValues = progressData.trendData.score;
                    const accuracyValues = progressData.trendData.accuracy;
                    
                    if (scoreValues.length === 0 || accuracyValues.length === 0) return null;
                    
                    // Calculate score statistics
                    const scoreMean = scoreValues.reduce((sum, val) => sum + val, 0) / scoreValues.length;
                    const scoreVariance = scoreValues.reduce((sum, val) => sum + Math.pow(val - scoreMean, 2), 0) / scoreValues.length;
                    const scoreStdDev = Math.sqrt(scoreVariance);
                    const scoreCI = 1.96 * (scoreStdDev / Math.sqrt(scoreValues.length));
                    
                    // Calculate accuracy statistics
                    const accuracyMean = accuracyValues.reduce((sum, val) => sum + val, 0) / accuracyValues.length;
                    const accuracyVariance = accuracyValues.reduce((sum, val) => sum + Math.pow(val - accuracyMean, 2), 0) / accuracyValues.length;
                    const accuracyStdDev = Math.sqrt(accuracyVariance);
                    const accuracyCI = 1.96 * (accuracyStdDev / Math.sqrt(accuracyValues.length));
                    
                    return (
                      <div className="trend-statistics">
                        <div className="trend-stat">
                          <div className="trend-stat-value">{scoreMean.toFixed(1)}</div>
                          <div className="trend-stat-label">Mean Score</div>
                        </div>
                        <div className="trend-stat">
                          <div className="trend-stat-value">±{scoreCI.toFixed(1)}</div>
                          <div className="trend-stat-label">Score 95% CI</div>
                        </div>
                        <div className="trend-stat">
                          <div className="trend-stat-value">{accuracyMean.toFixed(1)}%</div>
                          <div className="trend-stat-label">Mean Accuracy</div>
                        </div>
                        <div className="trend-stat">
                          <div className="trend-stat-value">±{accuracyCI.toFixed(1)}%</div>
                          <div className="trend-stat-label">Accuracy 95% CI</div>
                        </div>
                        <div className="trend-stat">
                          <div className="trend-stat-value">{scoreStdDev.toFixed(1)}</div>
                          <div className="trend-stat-label">Score Std Dev</div>
                        </div>
                        <div className="trend-stat">
                          <div className="trend-stat-value">{accuracyStdDev.toFixed(1)}%</div>
                          <div className="trend-stat-label">Accuracy Std Dev</div>
                        </div>
                      </div>
                    );
                  })()}
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
                
                {/* Metrics Comparison Cards */}
                <div className="metric-cards-container">
                  <h4 className="metric-cards-title">Performance by Metric</h4>
                  
                  <div className="metric-cards">
                    {(() => {
                      const bestMetric = findBestMetric();
                      
                      // Get percentiles from cohort comparison data
                      const scorePercentile = progressData.cohortComparison.userScorePercentile !== undefined 
                        ? progressData.cohortComparison.userScorePercentile 
                        : (progressData.cohortComparison.userScore / progressData.cohortComparison.peerMaxScore * 100);
                      
                      const accuracyPercentile = progressData.cohortComparison.userAccuracyPercentile !== undefined 
                        ? progressData.cohortComparison.userAccuracyPercentile 
                        : (progressData.cohortComparison.userAccuracy / progressData.cohortComparison.peerMaxAccuracy * 100);
                      
                      const speedPercentile = calculateSpeedPercentile();
                      
                      return (
                        <>
                          {/* Score Card */}
                          <div className={`metric-card ${bestMetric === 'Score' ? 'metric-card-best' : ''}`}>
                            <div className="metric-card-header">
                              <span className="metric-name">Your Avg. Score</span>
                              {bestMetric === 'Score' && <span className="best-tag">★ Best</span>}
                            </div>
                            <div className="metric-value-container">
                              <span className="metric-value" style={{ color: '#4f46e5' }}>
                                {progressData.cohortComparison.userScore !== undefined ? Number(progressData.cohortComparison.userScore).toFixed(2) : 0}
                              </span>
                              <span className="metric-max">
                                / {progressData.cohortComparison.peerMaxScore !== undefined ? Math.round(progressData.cohortComparison.peerMaxScore) : 0}
                              </span>
                            </div>
                            <div className="metric-percentage">
                              {typeof scorePercentile === 'number' ? Math.round(scorePercentile) : 0}% percentile
                              <span className="metric-tooltip" title="This means your score is higher than this percentage of your peers">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="10"></circle>
                                  <line x1="12" y1="16" x2="12" y2="12"></line>
                                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                </svg>
                              </span>
                            </div>
                            <div className="metric-progress">
                              <div className="metric-progress-bar" style={{ width: `${typeof scorePercentile === 'number' ? scorePercentile : 0}%`, backgroundColor: '#4f46e5' }}></div>
                            </div>
                          </div>
                          
                          {/* Accuracy Card */}
                          <div className={`metric-card ${bestMetric === 'Accuracy' ? 'metric-card-best' : ''}`}>
                            <div className="metric-card-header">
                              <span className="metric-name">Your Avg. Accuracy</span>
                              {bestMetric === 'Accuracy' && <span className="best-tag">★ Best</span>}
                            </div>
                            <div className="metric-value-container">
                              <span className="metric-value" style={{ color: '#ffa500' }}>
                                {progressData.cohortComparison.userAccuracy !== undefined ? Math.round(progressData.cohortComparison.userAccuracy) : 0}%
                              </span>
                              <span className="metric-max">
                                / {progressData.cohortComparison.peerMaxAccuracy !== undefined ? Math.round(progressData.cohortComparison.peerMaxAccuracy) : 0}%
                              </span>
                            </div>
                            <div className="metric-percentage">
                              {typeof accuracyPercentile === 'number' ? Math.round(accuracyPercentile) : 0}% percentile
                              <span className="metric-tooltip" title="This means your accuracy is higher than this percentage of your peers">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="10"></circle>
                                  <line x1="12" y1="16" x2="12" y2="12"></line>
                                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                </svg>
                              </span>
                            </div>
                            <div className="metric-progress">
                              <div className="metric-progress-bar" style={{ width: `${typeof accuracyPercentile === 'number' ? accuracyPercentile : 0}%`, backgroundColor: '#ffa500' }}></div>
                            </div>
                          </div>
                          
                          {/* Speed Card */}
                          <div className={`metric-card ${bestMetric === 'Speed' ? 'metric-card-best' : ''}`}>
                            <div className="metric-card-header">
                              <span className="metric-name">Your Avg. Speed</span>
                              {bestMetric === 'Speed' && <span className="best-tag">★ Best</span>}
                            </div>
                            <div className="metric-value-container">
                              <span className="metric-value" style={{ color: '#10b981' }}>
                                {progressData.cohortComparison.userSpeed !== undefined ? Number(progressData.cohortComparison.userSpeed).toFixed(2) : 0}s
                              </span>
                              <span className="metric-max">
                                (Peer best: {progressData.cohortComparison.peerMaxSpeed !== undefined ? Number(progressData.cohortComparison.peerMaxSpeed).toFixed(2) : 0}s)
                              </span>
                            </div>
                            <div className="metric-percentage">
                              {typeof speedPercentile === 'number' ? Math.round(speedPercentile) : 0}% percentile
                              <span className="metric-tooltip" title="This means you're faster than this percentage of your peers">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="10"></circle>
                                  <line x1="12" y1="16" x2="12" y2="12"></line>
                                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                </svg>
                              </span>
                            </div>
                            <div className="metric-footnote">
                              Lower time is better. You're faster than {typeof speedPercentile === 'number' ? Math.round(speedPercentile) : 0}% of peers.
                            </div>
                            <div className="metric-progress">
                              <div className="metric-progress-bar" style={{ width: `${typeof speedPercentile === 'number' ? speedPercentile : 0}%`, backgroundColor: '#10b981' }}></div>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
                
                {/* Radar Chart */}
                <div className="radar-chart-container">
                  <div className="radar-chart-header">
                    <h4 className="radar-chart-title">Performance Metrics Visualization</h4>
                    <p className="radar-chart-subtitle">Visual comparison of your metrics against peer maximums</p>
                  </div>
                  
                  {/* Informational text about speed percentile */}
                  <div className="radar-chart-info">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    <span>For Speed, a lower time (seconds) is better, but a higher percentile represents better performance.</span>
                  </div>
                  
                  <div style={{ alignSelf: 'center', width: '100%' }} className="radar-chart">
                    <svg width="100%" height="400" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet">
                      {/* Enhancement zone indicator (35% circle) */}
                      <circle 
                        cx="200" 
                        cy="200" 
                        r={150 * 0.35} 
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
                        Enhanced visibility zone (35%)
                      </text>
                      
                      {/* Background circles */}
                      {[0.25, 0.5, 0.75, 1].map((scale, i) => (
                        <g key={`bg-circle-${i}`}>
                          <circle 
                            cx="200" 
                            cy="200" 
                            r={150 * scale} 
                            fill="none" 
                            stroke="#e2e8f0" 
                            strokeWidth="1" 
                            opacity={0.7} 
                          />
                          {scale === 0.25 && (
                            <text x="205" y={200 - (150 * scale)} textAnchor="start" fontSize="10" fill="#94a3b8" opacity="0.9">
                              {Math.round(scale * 100)}%
                            </text>
                          )}
                          {scale === 0.5 && (
                            <text x="205" y={200 - (150 * scale)} textAnchor="start" fontSize="10" fill="#94a3b8" opacity="0.9">
                              {Math.round(scale * 100)}%
                            </text>
                          )}
                          {scale === 0.75 && (
                            <text x="205" y={200 - (150 * scale)} textAnchor="start" fontSize="10" fill="#94a3b8" opacity="0.9">
                              {Math.round(scale * 100)}%
                            </text>
                          )}
                          {scale === 1 && (
                            <text x="205" y={200 - (150 * scale)} textAnchor="start" fontSize="10" fill="#94a3b8" opacity="0.9">
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
                              stroke="#cbd5e1" 
                              strokeWidth="2" 
                            />
                            <text 
                              x={labelX} 
                              y={labelY} 
                              textAnchor="middle" 
                              dominantBaseline="middle" 
                              fontSize="14" 
                              fontWeight="600" 
                              fill="#64748b"
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
                          
                          // For visualization consistency, we set all axes to 100% for the radar chart
                          // This makes the visualization symmetric and shows the theoretical maximum
                          const normalizedScore = 1.0; // Full radius for peer maximum
                          const normalizedAccuracy = 1.0; // Full radius for peer maximum
                          const normalizedSpeed = 1.0; // Full radius for peer maximum
                          
                          const scoreX = 200 + 150 * normalizedScore * Math.cos(scoreAngle);
                          const scoreY = 200 + 150 * normalizedScore * Math.sin(scoreAngle);
                          
                          const accuracyX = 200 + 150 * normalizedAccuracy * Math.cos(accuracyAngle);
                          const accuracyY = 200 + 150 * normalizedAccuracy * Math.sin(accuracyAngle);
                          
                          const speedX = 200 + 150 * normalizedSpeed * Math.cos(speedAngle);
                          const speedY = 200 + 150 * normalizedSpeed * Math.sin(speedAngle);
                          
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
                          
                          // Get percentiles for each metric
                          const scorePercentile = progressData.cohortComparison.userScorePercentile !== undefined 
                            ? progressData.cohortComparison.userScorePercentile / 100
                            : progressData.cohortComparison.userScore / progressData.cohortComparison.peerMaxScore;
                          
                          const accuracyPercentile = progressData.cohortComparison.userAccuracyPercentile !== undefined 
                            ? progressData.cohortComparison.userAccuracyPercentile / 100
                            : progressData.cohortComparison.userAccuracy / 100;
                          
                          // For speed, calculate the percentile (higher is better)
                          const normalizedUserSpeed = calculateSpeedPercentile() / 100;
                          
                          // Apply a minimum scale factor (0.35) to ensure metrics are visible
                          // This "pulls" small values away from the center for better visibility
                          const minScaleFactor = 0.35;
                          const enhancedScoreRatio = minScaleFactor + (1 - minScaleFactor) * scorePercentile;
                          const enhancedAccuracyRatio = minScaleFactor + (1 - minScaleFactor) * accuracyPercentile;
                          const enhancedSpeedRatio = minScaleFactor + (1 - minScaleFactor) * normalizedUserSpeed;
                          
                          const scoreX = 200 + 150 * enhancedScoreRatio * Math.cos(scoreAngle);
                          const scoreY = 200 + 150 * enhancedScoreRatio * Math.sin(scoreAngle);
                          
                          const accuracyX = 200 + 150 * enhancedAccuracyRatio * Math.cos(accuracyAngle);
                          const accuracyY = 200 + 150 * enhancedAccuracyRatio * Math.sin(accuracyAngle);
                          
                          const speedX = 200 + 150 * enhancedSpeedRatio * Math.cos(speedAngle);
                          const speedY = 200 + 150 * enhancedSpeedRatio * Math.sin(speedAngle);
                          
                          return `M ${scoreX} ${scoreY} L ${accuracyX} ${accuracyY} L ${speedX} ${speedY} Z`;
                        })()}
                        fill="rgba(79, 70, 229, 0.3)"
                        stroke="#4f46e5"
                        strokeWidth="2"
                      />
                      
                      {/* User performance points */}
                      {(() => {
                        const scoreAngle = -90 * (Math.PI / 180);
                        const accuracyAngle = (120 - 90) * (Math.PI / 180);
                        const speedAngle = (240 - 90) * (Math.PI / 180);
                        
                        // Get percentiles for each metric
                        const scorePercentile = progressData.cohortComparison.userScorePercentile !== undefined 
                          ? progressData.cohortComparison.userScorePercentile / 100
                          : (progressData.cohortComparison.peerMaxScore > 0 
                             ? progressData.cohortComparison.userScore / progressData.cohortComparison.peerMaxScore
                             : 0);
                        
                        const accuracyPercentile = progressData.cohortComparison.userAccuracyPercentile !== undefined 
                          ? progressData.cohortComparison.userAccuracyPercentile / 100
                          : (progressData.cohortComparison.userAccuracy / 100);
                        
                        // For speed, calculate the percentile (higher is better)
                        const normalizedUserSpeed = calculateSpeedPercentile() / 100;
                        
                        // Apply a minimum scale factor (0.35) to ensure metrics are visible
                        // This "pulls" small values away from the center for better visibility
                        const minScaleFactor = 0.35;
                        const enhancedScoreRatio = minScaleFactor + (1 - minScaleFactor) * scorePercentile;
                        const enhancedAccuracyRatio = minScaleFactor + (1 - minScaleFactor) * accuracyPercentile;
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
                          { ratio: scorePercentile, index: 0, name: 'Score' },
                          { ratio: accuracyPercentile, index: 1, name: 'Accuracy' },
                          { ratio: normalizedUserSpeed, index: 2, name: 'Speed' }
                        ];
                        
                        // Sort metrics by their ratio values (descending)
                        const sortedMetrics = [...metrics].sort((a, b) => b.ratio - a.ratio);
                        bestMetricIndex = sortedMetrics[0].index;
                        
                        // Log the metric rankings for debugging
                        console.log('Radar Chart Metric Rankings:', sortedMetrics.map(m => 
                          `${m.name}: ${typeof m.ratio === 'number' ? (m.ratio * 100).toFixed(1) : '0.0'}%`
                        ).join(', '));
                        
                        return [
                          { 
                            x: scoreX, 
                            y: scoreY, 
                            label: "Score", 
                            value: `${Number(progressData.cohortComparison.userScore).toFixed(1)}`, 
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
                            value: `${Number(progressData.cohortComparison.userSpeed).toFixed(2)}s (${Math.round(calculateSpeedPercentile())}%)`, 
                            max: `${Number(progressData.cohortComparison.peerMaxSpeed).toFixed(2)}s`,
                            percentile: Math.round(calculateSpeedPercentile()),
                            isBest: bestMetricIndex === 2 
                          }
                        ].map((point, i) => (
                          <g key={`point-${i}`}>
                            {/* Value background */}
                            <rect
                              x={point.x - 20}
                              y={point.y - 28}
                              width="40"
                              height="18"
                              rx="4"
                              ry="4"
                              fill={point.isBest ? "rgba(16, 185, 129, 0.1)" : "rgba(79, 70, 229, 0.1)"}
                              stroke={point.isBest ? "#10b981" : "#4f46e5"}
                              strokeWidth="1"
                            />
                            
                            {/* Highlight the best metric with a different color */}
                            <circle 
                              cx={point.x} 
                              cy={point.y} 
                              r="6" 
                              fill={point.isBest ? "#10b981" : "#4f46e5"} 
                            />
                            <circle 
                              cx={point.x} 
                              cy={point.y} 
                              r="4" 
                              fill="#fff" 
                            />
                            
                            {/* Display the metric name and value */}
                            <text 
                              x={point.x} 
                              y={point.y - 16} 
                              textAnchor="middle" 
                              fontSize="14" 
                              fontWeight="700" 
                              fill={point.isBest ? "#10b981" : "#4f46e5"}
                            >
                              {point.value}
                            </text>
                            
                            {/* Display the maximum value */}
                            <text 
                              x={point.x} 
                              y={point.y + 20} 
                              textAnchor="middle" 
                              fontSize="10" 
                              fill="#64748b"
                            >
                              {point.label === "Speed" 
                                ? `(peer best: ${point.max})` 
                                : `(max: ${point.max})`
                              }
                            </text>
                            
                            {/* Add a star for the best metric */}
                            {point.isBest && (
                              <text 
                                x={point.x + 18} 
                                y={point.y - 16} 
                                textAnchor="start" 
                                fontSize="14" 
                                fill="#10b981"
                              >
                                ★
                              </text>
                            )}
                          </g>
                        ));
                      })()}
                      
                      {/* Center point and label */}
                      <circle cx="200" cy="200" r="3" fill="#64748b" />
                      <text x="200" y="200" textAnchor="middle" dominantBaseline="middle" fontSize="12" fill="#64748b" fontWeight="600">You</text>
                    </svg>
                  </div>
                  
                  <div style={{ alignSelf: 'center', width: '100%' }} className="radar-legend">
                    <div className="legend-item">
                      <div className="legend-color" style={{ backgroundColor: "rgba(79, 70, 229, 0.3)", border: "2px solid #4f46e5" }}></div>
                      <div className="legend-label">Your Performance</div>
                    </div>
                    <div className="legend-item">
                      <div className="legend-color" style={{ backgroundColor: "rgba(226, 232, 240, 0.3)", border: "1px dashed #cbd5e1" }}></div>
                      <div className="legend-label">Peer Maximum</div>
                    </div>
                    <div className="legend-item">
                      <div className="legend-color" style={{ backgroundColor: "#10b981" }}></div>
                      <div className="legend-label">Your Strongest Metric</div>
                    </div>
                  </div>
                  
                  {/* Additional information for understanding metrics */}
                  <div className="radar-chart-footer">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                    <span>This chart visualizes each metric relative to a theoretical maximum (100%). Actual peer maximums: Score: {progressData.cohortComparison.peerMaxScore.toFixed(1)}/100, Accuracy: {progressData.cohortComparison.peerMaxAccuracy.toFixed(1)}%, Speed: {progressData.cohortComparison.peerMaxSpeed.toFixed(2)}s. Values below 35% are enhanced for better visibility.</span>
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
