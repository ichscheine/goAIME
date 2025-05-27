import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css'; // Using the same styling
import './RegistrationStyles.css';

const Registration = ({ onRegister }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Simple direct function to handle registration
  function handleRegister() {
    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    
    setLoading(true);
    
    try {
      // Create the user data
      const userData = {
        username,
        email,
        registeredAt: new Date().toISOString()
      };
      
      // Call the parent component's registration handler
      onRegister(userData);
      
      // Force page redirect to dashboard
      window.location.href = '/dashboard';
    } catch (error) {
      setError('Registration failed. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="landing-page">
      <div className="landing-page-background">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="pattern"></div>
      </div>
      
      <div className="login-container">
        <div className="login-content">
          <div className="login-logo">
            <span className="logo-icon">📊</span>
            <h1 className="logo-text">GoAIME</h1>
          </div>
          
          <div className="login-welcome">
            <h2>Join Our Math Community</h2>
            <p>Create an account to start your journey to mathematical excellence.</p>
          </div>
          
          <div className="registration-benefits">
            <div className="benefit-item">
              <div className="benefit-icon">🔒</div>
              <p>Secure progress tracking across devices</p>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">📊</div>
              <p>Access personalized performance analytics</p>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">🏆</div>
              <p>Compare your results with other users</p>
            </div>
          </div>
      
          {error && <div className="error-message">{error}</div>}
          
          {/* Simple div instead of form to avoid submission issues */}
          <div className="login-form">
            <div className="form-field">
              <label htmlFor="username">Username <span className="required">*</span></label>
              <div className="input-container">
                <span className="input-icon">👤</span>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                />
              </div>
            </div>
            
            <div className="form-field">
              <label htmlFor="email">Email <span className="optional">(optional)</span></label>
              <div className="input-container">
                <span className="input-icon">✉️</span>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                />
              </div>
            </div>
            
            <div className="form-note">
              <p>This simple registration helps track your progress. No password required.</p>
            </div>
            
            {/* Direct click handler button */}
            <button 
              type="button" 
              className={`login-button ${loading ? 'loading' : ''}`}
              disabled={loading || !username.trim()}
              onClick={handleRegister}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Start Practicing</span>
              )}
            </button>
          </div>
          
          <div className="login-footer">
            <p>Already have an account?</p>
            <button 
              className="register-button" 
              onClick={() => navigate('/login')}
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Registration;