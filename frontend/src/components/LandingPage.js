import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Simple direct function to handle login
  function handleLogin() {
    if (!username.trim()) return;
    
    setIsLoading(true);
    
    // Store user in localStorage - this is the key step!
    localStorage.setItem('user', JSON.stringify({ 
      username, 
      email,
      loginTime: new Date().toISOString() 
    }));
    
    // Force page reload to trigger the useEffect in App.js
    // This is more reliable than navigate() in some cases
    window.location.href = '/dashboard';
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
            <h1 className="logo-text">goAIME</h1>
          </div>
          
          <div className="login-welcome">
            <h2>Welcome Back</h2>
            <p>Track your progress and improve your math skills.</p>
          </div>

          {/* Simple form without onSubmit to avoid form submission issues */}
          <div className="login-form">
            <div className="form-field">
              <label htmlFor="username">Username <span className="required">*</span></label>
              <div className="input-container">
                <span className="input-icon">👤</span>
                <input
                  type="text"
                  id="username"
                  name="username"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
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
                  name="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-note">
              <p>This simple registration helps track your progress. No password required.</p>
            </div>

            {/* Direct click handler without form submission */}
            <button 
              type="button" 
              className={`login-button ${isLoading ? 'loading' : ''}`}
              disabled={isLoading || !username.trim()}
              onClick={handleLogin}
            >
              {isLoading ? (
                <>
                  <div className="spinner"></div>
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Start Practicing</span>
              )}
            </button>
          </div>

          <div className="login-footer">
            <p>Don't have an account?</p>
            <button
              className="register-button"
              onClick={() => navigate('/register')}
            >
              Register Here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;