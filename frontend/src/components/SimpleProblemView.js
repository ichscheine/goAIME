import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { useSimpleProblem } from '../contexts/SimpleProblemContext';

const SimpleProblemView = () => {
  const {
    problem,
    loading,
    error,
    score,
    attempted,
    sessionComplete,
    selectedContest,
    selectedYear,
    mode,
    setSelectedContest,
    setSelectedYear,
    setMode,
    startSession,
    submitAnswer
  } = useSimpleProblem();

  const [sessionStarted, setSessionStarted] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [answered, setAnswered] = useState(false);

  const handleStart = async () => {
    const success = await startSession();
    if (success) {
      setSessionStarted(true);
    }
  };

  const handleChoiceClick = (choice) => {
    if (answered) return;
    
    setSelectedChoice(choice);
    setAnswered(true);
    
    setTimeout(() => {
      submitAnswer(choice);
      setSelectedChoice(null);
      setAnswered(false);
    }, 1000);
  };

  if (!sessionStarted) {
    return (
      <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
        <h1>Simple Problem Practice</h1>
        
        <div style={{ marginBottom: '20px' }}>
          <label>Contest: </label>
          <select value={selectedContest} onChange={(e) => setSelectedContest(e.target.value)}>
            <option value="AMC 10A">AMC 10A</option>
            <option value="AMC 10B">AMC 10B</option>
            <option value="AMC 12A">AMC 12A</option>
            <option value="AMC 12B">AMC 12B</option>
          </select>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label>Year: </label>
          <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
            <option value={2022}>2022</option>
            <option value={2021}>2021</option>
            <option value={2020}>2020</option>
            <option value={2019}>2019</option>
          </select>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label>Mode: </label>
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="practice">Practice</option>
            <option value="contest">Contest</option>
          </select>
        </div>
        
        <button 
          onClick={handleStart}
          style={{ 
            padding: '15px 30px', 
            backgroundColor: '#4CAF50', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px', 
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          Start Session
        </button>
      </div>
    );
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>;
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>
        <h3>Error: {error}</h3>
      </div>
    );
  }

  if (sessionComplete) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <h2>Session Complete!</h2>
        <p>Score: {score} out of {attempted}</p>
        <p>Accuracy: {attempted > 0 ? Math.round((score / attempted) * 100) : 0}%</p>
        <button 
          onClick={() => {
            setSessionStarted(false);
            setSelectedChoice(null);
            setAnswered(false);
          }}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#2196F3', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          New Session
        </button>
      </div>
    );
  }

  if (!problem) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>No problem available</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Problem {problem.problem_number}</h2>
        <div>Score: {score} | Attempted: {attempted}</div>
      </div>
      
      <div style={{ 
        border: '1px solid #ddd', 
        borderRadius: '8px', 
        padding: '20px', 
        marginBottom: '20px',
        backgroundColor: '#f9f9f9'
      }}>
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex]}
        >
          {problem.problem_text}
        </ReactMarkdown>
      </div>
      
      <div>
        <h4>Answer Choices:</h4>
        <div style={{ display: 'grid', gap: '10px' }}>
          {problem.answer_choices && problem.answer_choices.map((choice, index) => (
            <button
              key={index}
              onClick={() => handleChoiceClick(choice)}
              disabled={answered}
              style={{
                padding: '15px',
                border: '2px solid #ddd',
                borderRadius: '8px',
                backgroundColor: selectedChoice === choice ? '#e3f2fd' : 'white',
                borderColor: selectedChoice === choice ? '#2196F3' : '#ddd',
                cursor: answered ? 'default' : 'pointer',
                textAlign: 'left',
                opacity: answered ? 0.7 : 1
              }}
            >
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {choice}
              </ReactMarkdown>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SimpleProblemView;