import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

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
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex]}
        >
          {problem.solution}
        </ReactMarkdown>
      </div>
      
      {problem.similar_problems && problem.similar_problems.length > 0 && (
        <div className="similar-problems">
          <h4>Similar Problems:</h4>
          <ul>
            {problem.similar_problems.map((similar, index) => (
              <li key={index}>
                <div className="similar-problem">
                  <strong>Question:</strong> {similar.question}
                </div>
                <div className="difficulty">
                  <strong>Difficulty:</strong> {similar.difficulty}
                </div>
                {similar.detailed_solution && (
                  <div className="similar-solution">
                    <strong>Solution:</strong> 
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                    >
                      {similar.detailed_solution}
                    </ReactMarkdown>
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