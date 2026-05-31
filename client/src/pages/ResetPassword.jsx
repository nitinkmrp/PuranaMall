import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./Auth.css";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem('pm-theme') || 'dark');
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.body.className = `deccan-theme ${theme}-mode`;
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('pm-theme', newTheme);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/auth/reset-password/${token}`,
        { password }
      );
      alert(res.data.message);
      navigate("/login");
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        alert(error.response.data.message);
      } else {
        alert("The recovery token is invalid or has expired. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`auth-wrapper deccan-theme ${theme}-mode`}>
      <div className="deccan-glow-blob-1"></div>
      <div className="deccan-glow-blob-2"></div>
      <div className="deccan-grid-overlay"></div>

      <div style={{ position: 'absolute', top: '24px', left: '24px', right: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <svg viewBox="0 0 400 80" width="130" height="30" xmlns="http://www.w3.org/2000/svg">
            <text x="0" y="60" fontSize="58" fontWeight="900" fill="var(--deccan-text-main)" letterSpacing="-3">PuranaMall</text>
            <circle cx="288" cy="20" r="8" fill="var(--deccan-primary)" />
          </svg>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="pm-theme-toggle-btn" onClick={toggleTheme} title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
            {theme === 'dark' ? (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
          <button 
            type="button"
            onClick={() => navigate('/')} 
            style={{
              background: 'rgba(255, 56, 56, 0.1)',
              border: '1px solid rgba(255, 56, 56, 0.3)',
              color: '#ff3838',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
          >
            ✕ Quit
          </button>
        </div>
      </div>

      <div className="auth-container">
        <div className="auth-header">
          <h1>Update Password</h1>
          <p>Please type your new secure campus password below</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-form-group">
            <label className="auth-label">New Password</label>
            <input
              className="auth-input"
              type="password"
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="auth-form-group">
            <label className="auth-label">Confirm New Password</label>
            <input
              className="auth-input"
              type="password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? "Updating credentials..." : "Reset My Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
