import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import './LandingPage.css';
import './LoginFeatures.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [mode, setMode] = useState('guest'); // 'guest' or 'registered'

  // Simple direct function to handle login
  function handleLogin() {
    if (!username.trim()) return;
    setIsLoading(true);
    setLoginError('');

    if (mode === 'guest') {
      // Guest mode: just store username
      localStorage.setItem('user', JSON.stringify({
        username,
        email: '',
        guest: true,
        loginTime: new Date().toISOString()
      }));
      window.location.href = '/dashboard';
      return;
    }

    // Registered user mode
    if (!password) {
      setIsLoading(false);
      setLoginError('Password required.');
      return;
    }
    const storedUser = JSON.parse(localStorage.getItem(`user_${username}`));
    if (!storedUser || storedUser.password !== password) {
      setIsLoading(false);
      setLoginError('Invalid username or password.');
      return;
    }
    localStorage.setItem('user', JSON.stringify({
      username,
      email: storedUser.email || '',
      guest: false,
      loginTime: new Date().toISOString()
    }));
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
            <h2>Ace your Math Competition!</h2>
            <p>Practice with real math competition problems and track your progress over time.</p>
          </div>
          
          <div className="feature-highlights">
            <div className="feature-item">
              <span className="feature-icon">🏆</span>
              <div className="feature-text">
                <h3>Competition Mode</h3>
                <p>Simulate real test conditions</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📚</span>
              <div className="feature-text">
                <h3>Varied Problems</h3>
                <p>Access multiple competitions</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📈</span>
              <div className="feature-text">
                <h3>Track Progress</h3>
                <p>See improvement over time</p>
              </div>
            </div>
          </div>

          <div className="login-mode-toggle">
            <button
              className={mode === 'guest' ? 'active' : ''}
              onClick={() => setMode('guest')}
            >
              Guest
            </button>
            <button
              className={mode === 'registered' ? 'active' : ''}
              onClick={() => setMode('registered')}
            >
              Registered User
            </button>
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

            {mode === 'registered' && (
              <div className="form-field">
                <label htmlFor="password">Password <span className="required">*</span></label>
                <div className="input-container">
                  <span className="input-icon">🔒</span>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            )}

            {loginError && (
              <div className="form-error">
                <p>{loginError}</p>
              </div>
            )}

            <div className="form-note">
              <p>
                {mode === 'guest'
                  ? 'No password required. Your progress will be saved for this session.'
                  : 'Registered users can log in with username and password.'}
              </p>
            </div>

            {/* Direct click handler without form submission */}
            <button
              type="button"
              className={`login-button ${isLoading ? 'loading' : ''}`}
              disabled={isLoading || !username.trim() || (mode === 'registered' && !password)}
              onClick={handleLogin}
            >
              {isLoading ? (
                <>
                  <div className="spinner"></div>
                  <span>Signing In...</span>
                </>
              ) : (
                <span>{mode === 'guest' ? 'Continue as Guest' : 'Sign In'}</span>
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