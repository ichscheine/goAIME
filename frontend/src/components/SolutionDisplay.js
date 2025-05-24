import React from 'react';
import MathRenderer from './MathRenderer';

const SolutionDisplay = ({ problem }) => {
  if (!problem || !problem.solution) {
    return (
      <div className="solution-section">
        <h3>Solution</h3>
        <p>No solution available for this problem.</p>
      </div>
    );
  }

  return (
    <div className="solution-section">
      <h3>Solution</h3>
      <div className="markdown-content solution-content">
        <MathRenderer>
          {problem.solution}
        </MathRenderer>
      </div>
      
      {problem.similar_problems && problem.similar_problems.length > 0 && (
        <div className="similar-problems">
          <h4>Similar Problems:</h4>
          <ul>
            {problem.similar_problems.map((similar, index) => (
              <li key={index}>
                <div className="similar-problem">
                  <strong>Question:</strong> <MathRenderer>{similar.question}</MathRenderer>
                </div>
                <div className="difficulty">
                  <strong>Difficulty:</strong> {similar.difficulty}
                </div>
                {similar.detailed_solution && (
                  <div className="similar-solution">
                    <strong>Solution:</strong> 
                    <MathRenderer>
                      {similar.detailed_solution}
                    </MathRenderer>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SolutionDisplay;