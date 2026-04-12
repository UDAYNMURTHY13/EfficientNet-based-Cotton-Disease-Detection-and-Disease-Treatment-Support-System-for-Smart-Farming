import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthContext from '../context/AuthContext';
import APIService from '../services/api';
import '../styles/auth.css';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useContext(AuthContext);
  const { t } = useTranslation();
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
        <p className="brand-tagline">{t('login.feature_4') ? t('login.tagline') : 'AI-powered cotton disease detection for modern farmers'}</p>
        <div className="brand-features">
          <div className="brand-feature">
            <span className="brand-feature-icon">🔬</span>
            <span className="brand-feature-text">{t('login.feature_1')}</span>
          </div>
          <div className="brand-feature">
            <span className="brand-feature-icon">🤖</span>
            <span className="brand-feature-text">{t('login.feature_2')}</span>
          </div>
          <div className="brand-feature">
            <span className="brand-feature-icon">💊</span>
            <span className="brand-feature-text">{t('login.feature_3')}</span>
          </div>
          <div className="brand-feature">
            <span className="brand-feature-icon">📈</span>
            <span className="brand-feature-text">{t('login.feature_4')}</span>
          </div>
        </div>
      </aside>

      {/* Right form panel */}
      <div className="auth-form-panel">
        <div className="auth-form-inner">
          <div className="auth-form-header">
            <h2>{t('login.welcome')}</h2>
            <p>{t('login.subtitle')}</p>
          </div>

          {info  && <div className="alert alert-info">{info}</div>}
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">{t('login.email')}</label>
              <input
                type="email" id="email" name="email"
                value={formData.email} onChange={handleChange}
                placeholder="farmer@example.com" required disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">{t('login.password')}</label>
              <input
                type="password" id="password" name="password"
                value={formData.password} onChange={handleChange}
                placeholder="Enter your password" required disabled={loading}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}
              style={{ marginTop: '8px' }}>
              {loading ? <><span className="spinner-sm" /> {t('login.sign_in')}…</> : t('login.sign_in')}
            </button>
          </form>

          <div className="demo-hint">
            {t('login.demo_hint')}
          </div>

          <div className="auth-footer">
            {t('login.no_account')} <Link to="/signup">{t('login.create_free')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
