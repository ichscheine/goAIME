import React from 'react';
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
  showSolution
}) => {
  const handleChoiceClick = (choice) => {
    console.log(`AnswerChoices - Button clicked: ${choice}`);
    console.log(`AnswerChoices - Button state: mode=${mode}, answered=${answered}, answersDisabled=${answersDisabled}`);
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
            const isDisabled = mode === "practice" ? answered : answersDisabled;
            const isSelected = answered === choice;
            
            return (
              <button
                key={index}
                className={`choice-button ${isSelected ? 'selected' : ''}`}
                onClick={() => handleChoiceClick(choice)}
                disabled={isDisabled}
              >
                <span className="choice-label">{String.fromCharCode(65 + index)}.</span>
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