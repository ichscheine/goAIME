import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { useProblem } from '../contexts/ProblemContext';

const ReviewSession = ({ onClose }) => {
  const { 
    attemptRecords, 
    selectedContest, 
    selectedYear,
    totalProblems
  } = useProblem();
  
  const [expandedProblem, setExpandedProblem] = useState(null);
  const [loadingData, setLoadingData] = useState({});
  const [problemDetails, setProblemDetails] = useState({});

  // Fetch solution and similar problems for a specific problem
  const fetchProblemDetails = async (problemNumber) => {
    if (problemDetails[problemNumber]) {
      return; 
    }
    
    setLoadingData(prev => ({ ...prev, [problemNumber]: true }));
    
    try {
      // Replace with your actual API endpoint
      const response = await fetch(`/api/problems/${selectedContest}/${selectedYear}/${problemNumber}/details`);
      const data = await response.json();
      
      setProblemDetails(prev => ({
        ...prev,
        [problemNumber]: data
      }));
    } catch (error) {
      console.error("Failed to load problem details:", error);
    } finally {
      setLoadingData(prev => ({ ...prev, [problemNumber]: false }));
    }
  };

  const handleExpandProblem = (problemNumber) => {
    if (expandedProblem === problemNumber) {
      setExpandedProblem(null);
    } else {
      setExpandedProblem(problemNumber);
      fetchProblemDetails(problemNumber);
    }
  };

  // Format attempt status with colored indicator
  const renderAttemptStatus = (problemNumber) => {
    const record = attemptRecords.find(r => r.problemNumber === problemNumber);
    
    if (!record || !record.attempted) {
      return <span className="status unattempted">Not Attempted</span>;
    }
    
    return record.isCorrect ? 
      <span className="status correct">Correct</span> : 
      <span className="status incorrect">Incorrect</span>;
  };

  return (
    <div className="review-session">
      <div className="review-header">
        <h1>Session Review</h1>
        <p>Review solutions and practice similar problems to enhance your learning</p>
        <button className="close-button" onClick={onClose}>
          &times;
        </button>
      </div>

      <div className="problems-list">
        {Array.from({ length: totalProblems }, (_, i) => i + 1).map(problemNumber => (
          <div key={problemNumber} className="problem-review-item">
            <div 
              className={`problem-header ${expandedProblem === problemNumber ? 'expanded' : ''}`}
              onClick={() => handleExpandProblem(problemNumber)}
            >
              <div className="problem-title">
                <span className="problem-number">Problem {problemNumber}</span>
                {renderAttemptStatus(problemNumber)}
              </div>
              <span className="expand-icon">
                {expandedProblem === problemNumber ? '▼' : '▶'}
              </span>
            </div>
            
            {expandedProblem === problemNumber && (
              <div className="problem-details">
                {loadingData[problemNumber] ? (
                  <div className="loading">Loading solution...</div>
                ) : problemDetails[problemNumber] ? (
                  <>
                    <div className="solution-section">
                      <h3>Solution</h3>
                      <div className="solution-content">
                        <ReactMarkdown 
                          remarkPlugins={[remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                        >
                          {problemDetails[problemNumber].solution}
                        </ReactMarkdown>
                      </div>
                    </div>
                    
                    {problemDetails[problemNumber].similar_problems?.length > 0 && (
                      <div className="similar-problems">
                        <h3>Similar Problems for Practice</h3>
                        <ul className="similar-list">
                          {problemDetails[problemNumber].similar_problems.map((problem, index) => (
                            <li key={index} className="similar-problem-item">
                              <div className="problem-info">
                                <span className="problem-difficulty">{problem.difficulty || 'Practice'}</span>
                              </div>
                              <div className="problem-question">
                                <ReactMarkdown
                                  remarkPlugins={[remarkMath]}
                                  rehypePlugins={[rehypeKatex]}
                                >
                                  {problem.question || '(No question text available)'}
                                </ReactMarkdown>
                              </div>
                              <button className="practice-button">Practice</button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="no-data">No solution available</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="review-actions">
        <button className="primary-button" onClick={onClose}>
          Return to Summary
        </button>
      </div>
    </div>
  );
};

export default ReviewSession;