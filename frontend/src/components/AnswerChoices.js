import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

const AnswerChoices = ({
  problem,
  mode,
  answered,
  answersDisabled,
  onChoiceClick,
  onShowSolution,
  onNextProblem,
  showSolution,
  selectedChoice // Add this to track selected answer
}) => {
  // Track selected option locally
  const [localSelectedChoice, setLocalSelectedChoice] = useState(selectedChoice);
  
  // Update when prop changes
  useEffect(() => {
    setLocalSelectedChoice(selectedChoice);
  }, [selectedChoice]);
  
  const handleChoiceClick = (choice) => {
    console.log(`AnswerChoices - Button clicked: ${choice}`);
    console.log(`AnswerChoices - Button state: mode=${mode}, answered=${answered}, answersDisabled=${answersDisabled}`);
    setLocalSelectedChoice(choice); // Update local state for immediate feedback
    onChoiceClick(choice);
  };

  return (
    <section className="answer-section">
      <div className="answer-section-header">
        <h2>Answer Choices</h2>
        {mode === "practice" && (
          <div className="practice-buttons-row">
            <button
              className="solution-button"
              onClick={onShowSolution}
            >
              {showSolution ? "Hide Solution" : "Show Solution"}
            </button>
            <button
              className="next-problem-button"
              onClick={onNextProblem}
              disabled={!answered}
            >
              Next Problem
            </button>
          </div>
        )}
      </div>
      <div className="answer-choices">
        {Array.isArray(problem?.answer_choices) &&
          problem.answer_choices.map((choice, index) => {
            // const letter = String.fromCharCode(65 + index); // A, B, C, D, E
            const isSelected = localSelectedChoice === choice; // Define isSelected
            const isDisabled = answersDisabled; // Define isDisabled
            
            return (
              <button
                key={index}
                className={`choice-button ${isSelected ? 'selected' : ''}`}
                onClick={() => handleChoiceClick(choice)}
                disabled={isDisabled}
              >
                {/* <span className="choice-label">{letter}</span> */}
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {choice}
                </ReactMarkdown>
              </button>
            );
          })}
      </div>
    </section>
  );
};

export default AnswerChoices;