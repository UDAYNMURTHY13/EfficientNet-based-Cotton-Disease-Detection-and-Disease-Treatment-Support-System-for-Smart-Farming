import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import APIService from '../services/api';
import '../styles/auth.css';

function SignupPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '', phone: '', password: '',
    full_name: '', farm_location: '', farm_size_acres: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await APIService.signup({
        ...formData,
        farm_size_acres: parseFloat(formData.farm_size_acres) || null,
      });
      if (res.access_token) {
        localStorage.setItem('token', res.access_token);
        navigate('/login');
      } else {
        setError(res.detail || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <aside className="auth-brand">
        <div className="brand-logo">🌿</div>
        <div className="brand-name">CottonCare AI</div>
        <p className="brand-tagline">Join thousands of farmers protecting their cotton crops with AI</p>
        <div className="brand-features">
          <div className="brand-feature">
            <span className="brand-feature-icon">🆓</span>
            <span className="brand-feature-text">Free to get started</span>
          </div>
          <div className="brand-feature">
            <span className="brand-feature-icon">📱</span>
            <span className="brand-feature-text">Works on any device</span>
          </div>
          <div className="brand-feature">
            <span className="brand-feature-icon">🔒</span>
            <span className="brand-feature-text">Your data stays private</span>
          </div>
        </div>
      </aside>

      <div className="auth-form-panel">
        <div className="auth-form-inner">
          <div className="auth-form-header">
            <h2>Create your account</h2>
            <p>Start protecting your cotton crops today</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" name="full_name" value={formData.full_name}
                onChange={handleChange} placeholder="Ravi Kumar" required disabled={loading} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" name="email" value={formData.email}
                  onChange={handleChange} placeholder="ravi@example.com" required disabled={loading} />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input type="tel" name="phone" value={formData.phone}
                  onChange={handleChange} placeholder="+91 9876543210" required disabled={loading} />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <input type="password" name="password" value={formData.password}
                onChange={handleChange} placeholder="At least 8 characters" required disabled={loading} />
              <small>Minimum 8 characters</small>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Farm Location</label>
                <input type="text" name="farm_location" value={formData.farm_location}
                  onChange={handleChange} placeholder="City / District" disabled={loading} />
              </div>
              <div className="form-group">
                <label>Farm Size (Acres)</label>
                <input type="number" name="farm_size_acres" value={formData.farm_size_acres}
                  onChange={handleChange} placeholder="0" step="0.1" disabled={loading} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg"
              disabled={loading} style={{ marginTop: '8px' }}>
              {loading ? <><span className="spinner-sm" /> Creating account…</> : 'Create account'}
            </button>
          </form>

          <div className="auth-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;