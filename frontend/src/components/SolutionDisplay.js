import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

const SolutionDisplay = ({ problem }) => {
  const text = problem.solution;
  // Log the full problem object to inspect structure
  console.log("Problem in SolutionDisplay:", problem);
  
  const similar = problem.similar_questions 
               || problem.similar_problems 
               || [];      // catch both possible names
  
  // Log what we found for debugging
  console.log("Similar questions found:", similar);

  if (!problem || !text) {
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
          {text}
        </ReactMarkdown>
      </div>

      <div className="similar-problems">
        <h4>Similar Questions:</h4>
        {similar.length > 0 ? (
          <ul>
            {similar.map((s, i) => (
              <li key={i} className="similar-question-item">
                <strong>{s.difficulty || 'Practice'}</strong>: 
                <div className="markdown-content">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {s.question || "(Question content not available)"}
                  </ReactMarkdown>
                </div>
                
                {s.detailed_solution && (
                  <div className="similar-solution">
                    <h5>Solution:</h5>
                    <div className="markdown-content">
                      <ReactMarkdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                      >
                        {s.detailed_solution}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>No similar questions found.</p>
        )}
      </div>
    </div>
  );
};

export default SolutionDisplay;