import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import axios from 'axios';

const APITestPage = () => {
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiBaseUrl] = useState(process.env.REACT_APP_API_URL || 'http://localhost:5001');

  useEffect(() => {
    const testAPI = async () => {
      try {
        setLoading(true);
        
        // First test - initialize a session
        console.log('Testing session initialization...');
        const sessionResponse = await axios.post(`${apiBaseUrl}/api/problems/session`, {
          shuffle: false,
          contest: 'AMC 10A',
          year: 2022
        });
        
        console.log('Session initialization response:', sessionResponse.data);
        
        if (!sessionResponse.data?.data?.session_id) {
          throw new Error('Failed to initialize session - no session_id returned');
        }
        
        const sessionId = sessionResponse.data.data.session_id;
        console.log(`Session initialized with ID: ${sessionId}`);
        
        // Second test - get the first problem
        console.log('Fetching first problem...');
        const problemResponse = await axios.get(`${apiBaseUrl}/api/problems/next`, {
          params: { session_id: sessionId }
        });
        
        console.log('First problem response:', problemResponse.data);
        
        if (!problemResponse.data?.data) {
          throw new Error('No problem data received from API');
        }
        
        setProblem(problemResponse.data.data);
        setLoading(false);
      } catch (err) {
        console.error('API Test Error:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    testAPI();
  }, [apiBaseUrl]);
  
  return (
    <div className="api-test-container" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>API Test Page</h1>
      <p>This page tests the API connection to MongoDB and displays a problem if successful.</p>
      
      <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
        <h2>API Base URL: {apiBaseUrl}</h2>
        
        {loading && <p>Loading problem data...</p>}
        
        {error && (
          <div style={{ color: 'red', padding: '10px', backgroundColor: '#ffeeee', borderRadius: '5px' }}>
            <h3>Error:</h3>
            <p>{error}</p>
          </div>
        )}
        
        {problem && (
          <div style={{ marginTop: '20px' }}>
            <h3>Problem {problem.problem_number} from {problem.contest_id}</h3>
            
            <div className="problem-text" style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
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
                {problem.answer_choices.map((choice, index) => (
                  <li key={index} style={{ margin: '8px 0' }}>
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
            
            <div className="solution" style={{ marginTop: '20px', padding: '10px', backgroundColor: '#e6f7ff', borderRadius: '5px' }}>
              <h4>Solution:</h4>
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {problem.solution}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default APITestPage;