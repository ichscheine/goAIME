import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

const DirectProblemLoader = () => {
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiUrl] = useState(process.env.REACT_APP_API_URL || 'http://localhost:5001');
  const [sessionId, setSessionId] = useState(null);

  // Directly initialize a session and load a problem when component mounts
  useEffect(() => {
    const loadProblem = async () => {
      try {
        setLoading(true);
        
        // Step 1: Initialize session
        console.log('Initializing session...');
        const sessionResponse = await axios.post(`${apiUrl}/api/problems/session`, {
          contest: 'AMC 10A',
          year: 2022,
          shuffle: false
        });
        
        console.log('Session response:', sessionResponse.data);
        
        if (!sessionResponse.data?.data?.session_id) {
          throw new Error('Failed to get session ID');
        }
        
        const newSessionId = sessionResponse.data.data.session_id;
        setSessionId(newSessionId);
        
        // Step 2: Get the first problem
        console.log(`Fetching first problem with session ID: ${newSessionId}`);
        const problemResponse = await axios.get(`${apiUrl}/api/problems/next`, {
          params: { session_id: newSessionId }
        });
        
        console.log('Problem response:', problemResponse.data);
        
        if (!problemResponse.data?.data) {
          throw new Error('Failed to get problem data');
        }
        
        setProblem(problemResponse.data.data);
        setLoading(false);
      } catch (err) {
        console.error('Error loading problem:', err);
        setError(err.message || 'Failed to load problem');
        setLoading(false);
      }
    };
    
    loadProblem();
  }, [apiUrl]);

  // Click handler for next problem button
  const handleNextProblem = async () => {
    if (!sessionId) return;
    
    try {
      setLoading(true);
      
      const response = await axios.get(`${apiUrl}/api/problems/next`, {
        params: { session_id: sessionId }
      });
      
      if (!response.data?.data) {
        throw new Error('Failed to get next problem');
      }
      
      setProblem(response.data.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching next problem:', err);
      setError(err.message || 'Failed to load next problem');
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-container">Loading problem directly from API...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <h3>Error:</h3>
        <p>{error}</p>
        <p>Check your browser console for more details.</p>
      </div>
    );
  }

  if (!problem) {
    return <div className="no-problem">No problem data available.</div>;
  }

  return (
    <div className="direct-problem-container" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Direct Problem Loader</h2>
      <p>This component bypasses the regular app state management and loads problems directly.</p>
      
      <div className="problem-card" style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '20px', marginTop: '20px' }}>
        <h3>Problem {problem.problem_number}</h3>
        <div className="problem-text">
          <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
          >
            {problem.problem_text}
          </ReactMarkdown>
        </div>
        
        <div className="answer-choices" style={{ marginTop: '20px' }}>
          <h4>Answer Choices:</h4>
          <ul>
            {problem.answer_choices && problem.answer_choices.map((choice, index) => (
              <li key={index} style={{ margin: '10px 0' }}>
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {choice}
                </ReactMarkdown>
              </li>
            ))}
          </ul>
        </div>
        
        <button 
          onClick={handleNextProblem}
          style={{ padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '20px' }}
        >
          Load Next Problem
        </button>
      </div>
      
      <div style={{ marginTop: '20px', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '4px' }}>
        <h4>Debug Info:</h4>
        <p>Session ID: {sessionId}</p>
        <p>Problem ID: {problem._id}</p>
        <p>Contest: {problem.contest_id}</p>
      </div>
    </div>
  );
};

export default DirectProblemLoader;