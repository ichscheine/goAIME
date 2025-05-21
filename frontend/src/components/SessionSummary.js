import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { useProblem } from '../contexts/ProblemContext';
import api from '../services/api';

const SessionSummary = () => {
  const { 
    totalProblems,
    score, 
    attempted, 
    cumulativeTime,
    attemptRecords, 
    incorrectProblems,
    startSession,
    completeSession,
    resetSession,
    selectedContest,
    selectedYear,
    mode,
    showSolution // Import this from ProblemContext
  } = useProblem();

  const [processedRecords, setProcessedRecords] = useState([]);

  // Modify the review solution handler to use the shared solution function
  const handleReviewSolution = (problemNumber) => {
    console.log(`Opening solution for problem ${problemNumber} from ${selectedContest} ${selectedYear}`);
    
    // Use the showSolution function from ProblemContext to display the solution
    // This will use the same mechanism as the "Show Solution" button in Practice Mode
    showSolution(problemNumber, selectedContest, selectedYear);
  };

  // Clean, simplified record processing - no debugging or dummy data
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
        
        // Mark as attempted and update data - Remove the minimum time constraint
        processed[index] = {
          problemNumber,
          attempted: true,
          isCorrect: Boolean(record.isCorrect),
          timeSpent: record.timeSpent || 0, // Remove the Math.max forcing minimum 1000ms
          answer: record.selectedAnswer || '—'
        };
        
        attemptedCount++;
      });
      
      // If we didn't process any records successfully but we have records,
      // fall back to using indices as problem numbers
      if (attemptedCount === 0 && attemptRecords.length > 0) {
        attemptRecords.forEach((record, i) => {
          if (i < problemCount) {
            processed[i] = {
              problemNumber: i + 1,
              attempted: true,
              isCorrect: Boolean(record.isCorrect),
              timeSpent: record.timeSpent || 0, // Remove the Math.max forcing minimum
              answer: record.selectedAnswer || '—'
            };
          }
        });
      }
    }
    
    setProcessedRecords(processed);
  }, [attemptRecords, totalProblems]);
  
  useEffect(() => {
    completeSession();
  }, [completeSession]);
  
  // Format time as MM:SS with proper handling for edge cases
  const formatTime = (seconds) => {
    if (typeof seconds !== 'number' || seconds <= 0) return "00:00";
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Calculate total time by summing all timeSpent values from records
  // This ensures we get accurate data even if cumulativeTime is not set correctly
  const calcTotalTime = () => {
    // If we have valid attempt records, sum their times without enforcing minimum
    if (attemptRecords && attemptRecords.length > 0) {
      return attemptRecords.reduce((sum, record) => sum + (record.timeSpent || 0), 0);
    }
    
    // Fallback to cumulativeTime if available
    if (cumulativeTime && cumulativeTime > 0) {
      return cumulativeTime;
    }
    
    // If all else fails, estimate a reasonable time
    return Math.max(attempted * 1000, 0); // Reduced from 30000 to be more realistic
  };
  
  // Calculate the time values
  const totalTimeMS = calcTotalTime();
  const totalTimeSeconds = Math.round(totalTimeMS / 1000);
  
  // Calculate average time per problem
  const avgTimeSeconds = attempted > 0 
    ? Math.round(totalTimeSeconds / attempted) 
    : 0;

  // Add debugging to analyze the problem details section creation
  useEffect(() => {
    // Set a reasonable default for totalProblems if it's not provided
    const problemCount = totalProblems || 25;
    
    console.log('Processing attempt records into problem details...');
    console.log('Total problems to process:', problemCount);
    console.log('Attempt records available:', attemptRecords);
    
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
      // Inspect format of the attemptRecords to see what's available
      console.log('First attempt record:', attemptRecords[0]);
      console.log('Available properties:', Object.keys(attemptRecords[0] || {}));
      
      // Process each record
      attemptRecords.forEach((record, recordIndex) => {
        // Try different ways to get the problem number
        let problemNumber;
        
        if (typeof record.problemNumber === 'number') {
          problemNumber = record.problemNumber;
          console.log(`Using record.problemNumber: ${problemNumber}`);
        } else if (typeof record.problem_number === 'number') {
          problemNumber = record.problem_number;
          console.log(`Using record.problem_number: ${problemNumber}`);
        } else {
          // Default to index+1
          problemNumber = recordIndex + 1;
          console.log(`Using index+1: ${problemNumber}`);
        }
        
        const index = problemNumber - 1;
        
        // Skip invalid indices
        if (index < 0 || index >= problemCount) {
          console.log(`Invalid index ${index} for problem number ${problemNumber}`);
          return;
        }
        
        console.log(`Processing record ${recordIndex} for problem ${problemNumber}:`, record);
        
        // Determine the time spent in milliseconds, checking all possible properties
        let timeSpentMs = 0;
        
        // Try to get time in milliseconds from all possible properties
        if (typeof record.timeSpent === 'number' && record.timeSpent > 0) {
          timeSpentMs = record.timeSpent;
        } else if (typeof record.timeSpentMs === 'number' && record.timeSpentMs > 0) {
          timeSpentMs = record.timeSpentMs;
        } else if (typeof record.time === 'number' && record.time > 0) {
          // Convert seconds to milliseconds if needed
          timeSpentMs = record.time * 1000;
        } else if (typeof record.time_spent === 'number' && record.time_spent > 0) {
          timeSpentMs = record.time_spent;
        }
        
        console.log(`Time data for problem ${problemNumber}:`, {
          timeSpentMs,
          original: {
            timeSpent: record.timeSpent,
            timeSpentMs: record.timeSpentMs,
            time: record.time,
            time_spent: record.time_spent
          }
        });
        
        // Get the selected answer from various possible properties
        const answer = record.selectedAnswer || record.selected_answer || record.choice || record.answer || '—';
        
        // Mark as attempted and update data
        processed[index] = {
          problemNumber,
          attempted: true,
          isCorrect: Boolean(record.isCorrect || record.correct),
          timeSpent: timeSpentMs,  // Store time in milliseconds
          answer
        };
      });
    }
    
    console.log('Final processed records:', processed);
    setProcessedRecords(processed);
    
    // Add explicit check of state after update
    setTimeout(() => {
      console.log('Processed records state after update:', processedRecords);
    }, 100);
  }, [attemptRecords, totalProblems]);

  // Add debugging for the render phase
  const renderDebug = () => {
    console.log('Rendering problem details with:', {
      processedRecords,
      recordsLength: processedRecords.length,
      attempted: processedRecords.filter(r => r.attempted).length
    });
  };
  
  // Call render debugging
  renderDebug();

  return (
    <div className="session-summary">
      <h1 className="summary-title">{mode === "contest" ? "Contest" : "Practice"} Complete!</h1>
      
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
      
      {/* Add debug info above the grid */}
      <div className="debug-info" style={{ marginBottom: '10px', fontSize: '12px', color: '#666' }}>
        Total records: {processedRecords.length}, 
        Attempted: {processedRecords.filter(r => r.attempted).length},
        Records with time: {processedRecords.filter(r => r.timeSpent > 0).length}
      </div>
      
      <div className="problems-grid">
        <div className="grid-header">
          <div className="grid-cell">#</div>
          <div className="grid-cell">Status</div>
          <div className="grid-cell">Your Answer</div>
          <div className="grid-cell">Time</div>
          <div className="grid-cell">Actions</div>
        </div>
        
        {processedRecords.map((record, index) => {
          return (
            <div className="grid-row" key={index}>
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
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {record.answer}
                  </ReactMarkdown>
                ) : "—"}
              </div>
              <div className="grid-cell time">
                {record.timeSpent > 0 ? formatTime(record.timeSpent / 1000) : "—"}
              </div>
              <div className="grid-cell actions">
                {record.attempted && (
                  <a 
                    href="#" 
                    className="review-link" 
                    onClick={(e) => {
                      e.preventDefault();
                      handleReviewSolution(record.problemNumber);
                    }}
                  >
                    Review Solution
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Replace buttons with just one print button */}
      <div className="summary-actions">
        <button className="primary-button" onClick={() => window.print()}>
          Print Results
        </button>
      </div>

      {/* Remove custom solution modal since we're using the shared solution display */}
    </div>
  );
};

export default SessionSummary;