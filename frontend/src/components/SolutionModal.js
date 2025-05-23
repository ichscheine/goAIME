import React from 'react';
import MathRenderer from './MathRenderer';
import { useProblem } from '../contexts/ProblemContext';

const SolutionModal = () => {
  const { solutionProblem, showingSolution, hideSolution, solutionError, loading } = useProblem();
  
  if (!showingSolution) {
    return null;
  }
  
  // Extract the solution text from various possible fields
  const getSolutionText = () => {
    if (!solutionProblem) return null;
    
    // Try all possible field names for solution
    return solutionProblem.solution || 
           solutionProblem.formattedSolution || 
           solutionProblem.solution_text || 
           null;
  };
  
  const solutionText = getSolutionText();
  
  // Get similar problems from various possible field names
  const similarProblems = solutionProblem ? 
    (solutionProblem.similar_problems || 
     solutionProblem.similar_questions || 
     []) : [];
  
  return (
    <div className="solution-modal-overlay" onClick={hideSolution}>
      <div className="solution-modal" onClick={e => e.stopPropagation()}>
        <div className="solution-modal-header">
          <h2>Solution for Problem {solutionProblem?.problem_number}</h2>
          <button 
            className="close-button"
            onClick={hideSolution}
          >
            &times;
          </button>
        </div>
        
        <div className="solution-modal-content">
          {loading ? (
            <div className="loading-indicator">Loading solution...</div>
          ) : solutionError ? (
            <div className="error-message">
              {solutionError}
              <p>Please try again later or contact support if the problem persists.</p>
            </div>
          ) : solutionProblem ? (
            <>
              {solutionText ? (
                <div className="markdown-content solution-content">
                  <MathRenderer>
                    {solutionText}
                  </MathRenderer>
                </div>
              ) : (
                <div className="solution-placeholder">
                  <p>No solution is currently available for this problem.</p>
                  <p>Please check back later or try another problem.</p>
                </div>
              )}
              
              {similarProblems.length > 0 && (
                <div className="similar-problems">
                  <h4>Similar Problems:</h4>
                  <ul>
                    {similarProblems.map((s, i) => (
                      <li key={i}>
                        <div className="similar-problem">
                          <strong>{s.difficulty || 'Practice'}</strong>
                        </div>
                        <div className="markdown-content">
                          <MathRenderer>
                            {s.question || s.text || '(No preview available)'}
                          </MathRenderer>
                        </div>
                        {s.detailed_solution && (
                          <div className="similar-solution">
                            <strong>Solution:</strong> 
                            <MathRenderer>
                              {s.detailed_solution}
                            </MathRenderer>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <p>Unable to load solution data. Please try again.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SolutionModal;