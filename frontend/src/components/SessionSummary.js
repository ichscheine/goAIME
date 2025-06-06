import React, { useEffect, useState } from 'react';
import { useProblem } from '../contexts/ProblemContext';
import MathRenderer from './MathRenderer';
import api from '../services/api';  // Import the API service

const SessionSummary = () => {
  const { 
    totalProblems,
    score, 
    attempted, 
    cumulativeTime,
    attemptRecords, 
    completeSession,
    selectedContest,
    selectedYear,
    mode,
    sessionStartTime, // New state for session start time
    pausedTime // New state for total paused time
  } = useProblem();

  const [processedRecords, setProcessedRecords] = useState([]);
  const [expandedSolutions, setExpandedSolutions] = useState({});
  const [solutionData, setSolutionData] = useState({});
  const [loadingSolutions, setLoadingSolutions] = useState({});

  // Handle reviewing solution - inline expansion
  const handleReviewSolution = async (problemNumber) => {
    
    // If already expanded, collapse it
    if (expandedSolutions[problemNumber]) {
      setExpandedSolutions(prev => ({
        ...prev,
        [problemNumber]: false
      }));
      return;
    }
    
    // Mark as loading and expand
    setLoadingSolutions(prev => ({
      ...prev,
      [problemNumber]: true
    }));
    
    setExpandedSolutions(prev => ({
      ...prev,
      [problemNumber]: true
    }));
    
    try {
      // Use the proper API service to fetch solution data
      const response = await api.getProblemByParams({
        contest: selectedContest,
        year: selectedYear,
        problem_number: problemNumber
      });

      
      if (response && response.data) {
        // Store the solution text - check multiple possible field names
        const solutionText = response.data.solution || 
                            response.data.formattedSolution || 
                            response.data.solution_text ||
                            response.data.detailed_solution ||
                            "No solution available.";
                            
        // Get similar problems from any possible field name
        const similarProblems = response.data.similar_problems || 
                              response.data.similar_questions || 
                              [];
                              
        setSolutionData(prev => ({
          ...prev,
          [problemNumber]: {
            solution: solutionText,
            similarProblems: similarProblems
          }
        }));
      } else {
        setSolutionData(prev => ({
          ...prev,
          [problemNumber]: {
            solution: "No solution data available.",
            similarProblems: []
          }
        }));
      }
    } catch (error) {
      setSolutionData(prev => ({
        ...prev,
        [problemNumber]: {
          solution: "Error loading solution. Please try again.",
          similarProblems: []
        }
      }));
    } finally {
      setLoadingSolutions(prev => ({
        ...prev,
        [problemNumber]: false
      }));
    }
  };

  // Clean, simplified record processing 
  useEffect(() => {
    // Set a reasonable default for totalProblems if it's not provided
    const problemCount = totalProblems || 25;
    
    // Create a fixed array of default "not attempted" records
    const processed = Array(problemCount).fill().map((_, i) => ({
      problemNumber: i + 1,
      attempted: false,
      isCorrect: false,
      timeSpent: 0,
      answer: '—'
    }));
    
    // If we have real attempt records, update the processed records
    if (attemptRecords && attemptRecords.length > 0) {
      // Get attempted problem count for validation
      let attemptedCount = 0;
      
      // Process each record
      attemptRecords.forEach(record => {
        // Get the problem number, defaulting to the index+1 if not provided
        const problemNumber = Math.max(1, record.problemNumber || 1);
        const index = problemNumber - 1;
        
        // Skip invalid indices
        if (index < 0 || index >= problemCount) return;
        
        // More direct check for correctness, handling both property names
        // This explicitly checks both properties that might indicate correctness
        const isCorrect = record.correct === true || record.isCorrect === true;
        
        
        // Mark as attempted and update data
        processed[index] = {
          problemNumber,
          attempted: true,
          isCorrect: isCorrect,
          timeSpent: Math.max(record.timeSpent || 0, 100),
          answer: record.selectedAnswer || record.choice || '—'
        };
        
        attemptedCount++;
      });
      
      // If we didn't process any records successfully but we have records,
      // fall back to using indices as problem numbers
      if (attemptedCount === 0 && attemptRecords.length > 0) {
        attemptRecords.forEach((record, i) => {
          if (i < problemCount) {
            // Same property checking logic for fallback
            const isCorrect = record.hasOwnProperty('correct') ? record.correct : 
                             record.hasOwnProperty('isCorrect') ? record.isCorrect : false;
            
            processed[i] = {
              problemNumber: i + 1,
              attempted: true,
              isCorrect: Boolean(isCorrect),
              timeSpent: Math.max(record.timeSpent || 0, 100), // Use a smaller minimum to preserve accuracy
              answer: record.selectedAnswer || record.choice || '—'
            };
          }
        });
      }
    }
    
    setProcessedRecords(processed);
  }, [attemptRecords, totalProblems]);
  
  const [sessionCompleted, setSessionCompleted] = useState(false);

  useEffect(() => {
    // Only complete session if it hasn't been completed already
    // Add proper dependency on completeSession to ensure it's called when the component mounts
    // but only if the session isn't already complete
    if (!sessionCompleted) {
      console.log("SessionSummary: Completing session");
      completeSession();
      setSessionCompleted(true);
    }
  }, [completeSession, sessionCompleted]); // Include dependencies
  
  // Format time as MM:SS with proper handling for edge cases
  const formatTime = (seconds) => {
    if (typeof seconds !== 'number' || seconds <= 0) return "00:00";
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Calculate total time
  const calcTotalTime = () => {
    // Use the total elapsed time from session if available (excluding pause time)
    if (sessionStartTime) {
      const totalElapsedMs = Date.now() - sessionStartTime;
      // Subtract any paused time if available
      const effectiveTimeMs = pausedTime > 0 ? totalElapsedMs - pausedTime : totalElapsedMs;
      return Math.max(effectiveTimeMs, 100);
    }
    
    // Fallbacks if session time is not available
    if (cumulativeTime && cumulativeTime > 0) {
      return cumulativeTime;
    }
    
    // Sum individual times as last resort
    if (attemptRecords && attemptRecords.length > 0) {
      return attemptRecords.reduce((sum, record) => sum + (record.timeSpent || 100), 0);
    }
    
    return Math.max(attempted * 30000, 100);
  };
  
  const totalTimeMS = calcTotalTime();
  const totalTimeSeconds = Math.round(totalTimeMS / 1000);
  
  const avgTimeSeconds = attempted > 0 
    ? Math.round(totalTimeSeconds / attempted) 
    : 0;

  // Add this CSS rule for print optimization
  const printStyles = `
    @media print {
      body * {
        visibility: hidden;
      }
      .session-summary, .session-summary * {
        visibility: visible;
      }
      .session-summary {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
      }
    }
  `;

  // Inject the print styles into the document head
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = printStyles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, [printStyles]);

  return (
    <div className="session-summary">
      <h1 className="summary-title">{mode === "competition" ? "Competition" : "Practice"} Complete!</h1>
      
      <div className="summary-stats">
        <div className="stat-block">
          <div className="stat-label">Final Score</div>
          <div className="stat-value">{score} out of {totalProblems || processedRecords.length}</div>
        </div>
        
        <div className="stat-block">
          <div className="stat-label">Completion Rate</div>
          <div className="stat-value">
            {Math.round((attempted / (totalProblems || processedRecords.length)) * 100)}%
          </div>
        </div>
        
        <div className="stat-block">
          <div className="stat-label">Total Time</div>
          <div className="stat-value">{formatTime(totalTimeSeconds)}</div>
        </div>
        
        <div className="stat-block">
          <div className="stat-label">Avg. Time per Problem</div>
          <div className="stat-value">{formatTime(avgTimeSeconds)}</div>
        </div>
      </div>

      <h2 className="detail-heading">
        Problem Details - {selectedContest} {selectedYear}
      </h2>
      
      <div className="problems-grid inline-solutions">
        <div className="grid-header">
          <div className="grid-cell">#</div>
          <div className="grid-cell">Status</div>
          <div className="grid-cell">Your Answer</div>
          <div className="grid-cell">Time</div>
          <div className="grid-cell">Actions</div>
        </div>
        
        {processedRecords.map((record, index) => (
          <React.Fragment key={index}>
            <div className="grid-row">
              <div className="grid-cell problem-number">{record.problemNumber}</div>
              <div className="grid-cell status">
                {record.attempted ? (
                  record.isCorrect ? (
                    <span className="correct">✓ Correct</span>
                  ) : (
                    <span className="incorrect">✗ Incorrect</span>
                  )
                ) : (
                  <span className="unattempted">Not attempted</span>
                )}
              </div>
              <div className="grid-cell answer">
                {record.answer && record.answer !== '—' ? (
                  <MathRenderer>
                    {record.answer}
                  </MathRenderer>
                ) : "—"}
              </div>
              <div className="grid-cell time">
                {record.timeSpent > 0 ? formatTime(record.timeSpent / 1000) : "—"}
              </div>
              <div className="grid-cell actions">
                {record.attempted && (
                  <button 
                    className={`solution-toggle-btn ${expandedSolutions[record.problemNumber] ? 'expanded' : ''}`}
                    onClick={() => handleReviewSolution(record.problemNumber)}
                  >
                    {expandedSolutions[record.problemNumber] ? 'Hide Solution' : 'Show Solution'}
                  </button>
                )}
              </div>
            </div>
            
            {/* Expandable solution section */}
            {expandedSolutions[record.problemNumber] && (
              <div className="expanded-solution-row">
                {loadingSolutions[record.problemNumber] ? (
                  <div className="solution-loading">Loading solution...</div>
                ) : (
                  <div className="inline-solution-content">
                    <h3>Solution for Problem {record.problemNumber}</h3>
                    <div className="solution-text">
                      <MathRenderer>
                        {solutionData[record.problemNumber]?.solution || "No solution available."}
                      </MathRenderer>
                    </div>
                    
                    {solutionData[record.problemNumber]?.similarProblems?.length > 0 && (
                      <div className="similar-problems-section">
                        <h4>Similar Problems</h4>
                        <ul className="similar-problems-list">
                          {solutionData[record.problemNumber].similarProblems.map((problem, i) => (
                            <li key={i} className="similar-problem-item">
                              <strong>{problem.difficulty || 'Practice'}</strong>
                              <div className="similar-problem-text">
                                <MathRenderer>
                                  {problem.question || problem.text || '(No preview available)'}
                                </MathRenderer>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <button 
                      className="close-solution-btn"
                      onClick={() => setExpandedSolutions(prev => ({
                        ...prev,
                        [record.problemNumber]: false
                      }))}
                    >
                      Close Solution
                    </button>
                  </div>
                )}
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="summary-actions">
        <button className="primary-button" onClick={() => window.print()}>
          Print Results
        </button>
        <button className="secondary-button" onClick={() => window.location.href = '/'}>
          Return to Homepage
        </button>
      </div>
    </div>
  );
};

export default SessionSummary;