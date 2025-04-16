import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <div className="form-container">
        <h1 className="title">Welcome to GoAIME</h1>
        <p className="subtitle">Track your progress and improve your skills!</p>

        <form className="registration-form">
          <div className="form-group">
            <label htmlFor="username">Username <span className="required">(required)</span></label>
            <input
              type="text"
              id="username"
              name="username"
              placeholder="Enter your username"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email <span className="optional">(optional)</span></label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email address"
            />
          </div>

          <button type="submit" className="primary-button">Start Practicing</button>
        </form>

        <p className="note">
          Note: This simple registration helps track your progress. No password required.
        </p>

        {/* Add a Register button */}
        <div className="register-link">
          <p>Don't have an account?</p>
          <button
            className="secondary-button"
            onClick={() => navigate('/register')}
          >
            Register Here
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;