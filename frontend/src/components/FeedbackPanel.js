import React from 'react';

const FeedbackPanel = ({ isCorrect, feedbackImage }) => {
  return (
    <div className={`feedback-panel ${isCorrect ? 'correct' : 'incorrect'}`}>
      <div className="feedback-content">
        <h3>{isCorrect ? 'Correct!' : 'Incorrect'}</h3>
        {feedbackImage && (
          <div className="feedback-image">
            <img src={feedbackImage} alt={isCorrect ? "Correct answer" : "Incorrect answer"} loading="lazy" />
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackPanel;