import React, { useEffect } from 'react';
import { useProblem } from '../contexts/ProblemContext';

const SessionSummary = () => {
  const { 
    score, 
    attempted, 
    cumulativeTime, 
    attemptRecords, 
    incorrectProblems, // Add this
    resetSession, 
    startSession,
    completeSession
  } = useProblem();

    useEffect(() => {
      completeSession();
    }, [completeSession]);
  
  // Calculate statistics
  const totalTimeSeconds = (cumulativeTime / 1000).toFixed(2);
  const averageTimePerProblem = attempted > 0 
    ? (cumulativeTime / attempted / 1000).toFixed(2) 
    : 0;
  
  // Format attempt records for display
  const problemNumbers = Array.from({ length: 25 }, (_, i) => (i + 1).toString());
  const attemptMap = attemptRecords.reduce((acc, record) => {
    acc[record.problem_number] = {
      correct: record.correct,
      timeSpent: (record.timeSpent / 1000).toFixed(2)
    };
    return acc;
  }, {});

  const handleRestart = () => {
    resetSession();
    startSession();
  };

  return (
    <div className="session-summary">
      <h2>Practice Complete!</h2>
      
      <div className="summary-stats">
        <p>Your final score is {score} out of {attempted}.</p>
        <p>Total time: {totalTimeSeconds} seconds.</p>
        <p>Average time per problem: {averageTimePerProblem} seconds.</p>
      </div>
      
      <div className="problem-grid">
        {problemNumbers.map(num => {
          const attempt = attemptMap[num];
          const attempted = !!attempt;
          const correct = attempted && attempt.correct;
          
          return (
            <div key={num} className="problem-grid-item">
              <div className="problem-number">{num}</div>
              <div className="problem-status">
                {attempted ? (
                  correct ? "✓" : "✗"
                ) : "-"}
              </div>
              <div className="problem-time">
                {attempted ? `${attempt.timeSpent}s` : "-"}
              </div>
            </div>
          );
        })}
      </div>

      {incorrectProblems.length > 0 && (
        <div className="incorrect-problems-section">
          <h3>Review Incorrect Problems</h3>
          {incorrectProblems.map((problem, index) => (
            <div key={index} className="incorrect-problem">
              <h4>Problem {problem.problem_number || index + 1}</h4>
              <div className="problem-text">
                <p>{problem.problem_text || problem.description}</p>
                {problem.image_url && (
                  <img 
                    src={problem.image_url} 
                    alt="Problem diagram" 
                    className="problem-image"
                  />
                )}
              </div>
              <div className="problem-answer-info">
                <p><strong>Your answer:</strong> {problem.userAnswer}</p>
                <p><strong>Correct answer:</strong> {problem.correct_answer}</p>
              </div>
              {problem.solution && (
                <div className="problem-solution">
                  <h5>Solution:</h5>
                  <p>{problem.solution}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      <div className="summary-actions">
        <button 
          className="restart-button" 
          onClick={handleRestart}
        >
          Start New Session
        </button>
      </div>
    </div>
  );
};

export default SessionSummary;