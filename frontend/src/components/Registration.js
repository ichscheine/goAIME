import React, { useState } from 'react';

const Registration = ({ onRegister }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // In a real app, send registration data to server
      // const response = await api.registerUser({ username, email });
      
      // For now, just use the form data
      onRegister({ 
        username,
        email,
        registeredAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Registration failed, please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registration-form">
      {error && <p className="error-message">{error}</p>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username (required)</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Choose a username"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="email">Email (optional)</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
          />
        </div>
        
        <button 
          type="submit" 
          className="primary-button"
          disabled={loading}
        >
          {loading ? 'Please wait...' : 'Start Practicing'}
        </button>
      </form>
      
      <p className="registration-note">
        Note: This simple registration helps track your progress.
        No password required.
      </p>
    </div>
  );
};

export default Registration;