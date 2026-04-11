import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import APIService from '../services/api';
import '../styles/auth.css';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useContext(AuthContext);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('reason') === 'session_expired') {
      setInfo('Your session has expired. Please log in again.');
    }
  }, [location.search]);

  const handleChange = (e) =>
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await APIService.login(formData.email, formData.password);
      if (res.access_token) {
        const user = await APIService.getProfile(res.access_token);
        login(user, res.access_token);
        navigate('/dashboard');
      } else {
        setError(res.detail || 'Invalid credentials. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Connection error. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left brand panel */}
      <aside className="auth-brand">
        <div className="brand-logo">🌿</div>
        <div className="brand-name">CottonCare AI</div>
        <p className="brand-tagline">AI-powered cotton disease detection for modern farmers</p>
        <div className="brand-features">
          <div className="brand-feature">
            <span className="brand-feature-icon">🔬</span>
            <span className="brand-feature-text">Multi-stage disease analysis</span>
          </div>
          <div className="brand-feature">
            <span className="brand-feature-icon">🤖</span>
            <span className="brand-feature-text">Explainable AI insights</span>
          </div>
          <div className="brand-feature">
            <span className="brand-feature-icon">💊</span>
            <span className="brand-feature-text">Treatment recommendations</span>
          </div>
          <div className="brand-feature">
            <span className="brand-feature-icon">📈</span>
            <span className="brand-feature-text">Crop health tracking</span>
          </div>
        </div>
      </aside>

      {/* Right form panel */}
      <div className="auth-form-panel">
        <div className="auth-form-inner">
          <div className="auth-form-header">
            <h2>Welcome back</h2>
            <p>Sign in to your CottonCare account</p>
          </div>

          {info  && <div className="alert alert-info">{info}</div>}
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <input
                type="email" id="email" name="email"
                value={formData.email} onChange={handleChange}
                placeholder="farmer@example.com" required disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password" id="password" name="password"
                value={formData.password} onChange={handleChange}
                placeholder="Enter your password" required disabled={loading}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}
              style={{ marginTop: '8px' }}>
              {loading ? <><span className="spinner-sm" /> Signing in…</> : 'Sign in'}
            </button>
          </form>

          <div className="demo-hint">
            Demo: <strong>test@example.com</strong> / <strong>password123</strong>
          </div>

          <div className="auth-footer">
            Don't have an account? <Link to="/signup">Create one free</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

