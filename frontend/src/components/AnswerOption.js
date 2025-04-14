// Update or create the AnswerOption component

import React from 'react';
import './AnswerOption.css'; // Make sure to create this CSS file

const AnswerOption = ({ option, isSelected, onClick, disabled }) => {
  return (
    <div 
      className={`answer-option ${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
      onClick={disabled ? null : onClick}
    >
      <span className="option-label">{option.label}</span>
      <span className="option-text">{option.text}</span>
    </div>
  );
};

export default AnswerOption;