import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

const SolutionDisplay = ({ problem }) => {
  if (!problem || !problem.detailed_solution) {
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
          {problem.detailed_solution}
        </ReactMarkdown>
      </div>
      
      {problem.similar_questions && problem.similar_questions.length > 0 && (
        <div className="similar-problems">
          <h4>Similar Problems:</h4>
          <ul>
            {problem.similar_questions.map((similar, index) => (
              <li key={index}>
                {similar.contest} {similar.year}, Problem {similar.problem_number}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SolutionDisplay;