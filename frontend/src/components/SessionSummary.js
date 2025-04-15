import React, { useEffect, useState } from 'react';
import { useProblem } from '../contexts/ProblemContext';
import ReviewSession from './SessionReview';

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
    mode
  } = useProblem();

  const [showReview, setShowReview] = useState(false);
  const [processedRecords, setProcessedRecords] = useState([]);

  // Debug and process attemptRecords when they change
  useEffect(() => {
    console.log("Raw attempt records:", attemptRecords);
    
    // Transform records into a consistent format
    const processed = [];
    
    // Create a record entry for each problem number
    for (let i = 1; i <= totalProblems; i++) {
      // Try different property names for problem number matching
      const found = attemptRecords.find(r => 
        (r.problemNumber === i || r.number === i || r.problem_number === i || r.index === i-1)
      );
      
      // Debug which records are being found
      if (found) {
        console.log(`Found record for problem ${i}:`, found);
      }
      
      processed[i-1] = {
        problemNumber: i,
        attempted: Boolean(found?.attempted || found?.isCorrect || found?.correct || found?.selectedAnswer || found?.answer),
        isCorrect: Boolean(found?.isCorrect || found?.correct || false),
        timeSpent: Number(found?.timeSpent || 0),
        answer: found?.selectedAnswer || found?.answer || found?.userAnswer || '—'
      };
    }
    
    console.log("Processed records:", processed);
    setProcessedRecords(processed);
  }, [attemptRecords, totalProblems]);
  
  useEffect(() => {
    completeSession();
  }, [completeSession]);
  
  // Calculate statistics
  const formatTime = (timeInSeconds) => {
    if (!timeInSeconds) return "00:00";
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const totalTimeSeconds = (cumulativeTime / 1000).toFixed(2);
  const averageTimePerProblem = attempted > 0 
    ? (cumulativeTime / attempted / 1000).toFixed(2) 
    : 0;

  return (
    <div className="session-summary">
      <h1 className="summary-title">{mode === "contest" ? "Contest" : "Practice"} Complete!</h1>
      
      <div className="summary-stats">
        <div className="stat-block">
          <div className="stat-label">Final Score</div>
          <div className="stat-value">{score} out of {totalProblems}</div>
        </div>
        
        <div className="stat-block">
          <div className="stat-label">Completion Rate</div>
          <div className="stat-value">
            {Math.round((attempted / totalProblems) * 100)}%
          </div>
        </div>
        
        <div className="stat-block">
          <div className="stat-label">Total Time</div>
          <div className="stat-value">{formatTime(totalTimeSeconds)}</div>
        </div>
        
        <div className="stat-block">
          <div className="stat-label">Avg. Time per Problem</div>
          <div className="stat-value">{formatTime(averageTimePerProblem)}</div>
        </div>
      </div>

      <h2 className="detail-heading">
        Problem Details - {selectedContest} {selectedYear}
      </h2>
      
      <div className="problems-grid">
        <div className="grid-header">
          <div className="grid-cell">#</div>
          <div className="grid-cell">Status</div>
          <div className="grid-cell">Time</div>
          <div className="grid-cell">Your Answer</div>
        </div>
        
        {processedRecords.map((record, index) => (
          <div className="grid-row" key={index}>
            <div className="grid-cell problem-number">{record.problemNumber}</div>
            <div className="grid-cell status">
              {record.attempted ? (
                record.isCorrect ? (
                  <span className="correct">Correct</span>
                ) : (
                  <span className="incorrect">Incorrect</span>
                )
              ) : (
                <span className="unattempted">Unattempted</span>
              )}
            </div>
            <div className="grid-cell time">
              {record.timeSpent > 0 ? formatTime(record.timeSpent/1000) : "—"}
            </div>
            <div className="grid-cell answer">
              {record.answer && record.answer !== '—' ? record.answer : "—"}
            </div>
          </div>
        ))}
      </div>

      {/* Combined summary actions with all buttons */}
      <div className="summary-actions">
        <button className="primary-button" onClick={() => window.location.reload()}>
          Start New Session
        </button>
        <button className="secondary-button" onClick={() => setShowReview(true)}>
          Review Solutions
        </button>
        <button className="secondary-button" onClick={() => window.print()}>
          Print Results
        </button>
      </div>

      {/* ReviewSession component */}
      {showReview && (
        <div className="review-overlay">
          <ReviewSession onClose={() => setShowReview(false)} />
        </div>
      )}
    </div>
  );
};

export default SessionSummary;