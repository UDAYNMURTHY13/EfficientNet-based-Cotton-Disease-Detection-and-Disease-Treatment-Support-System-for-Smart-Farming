import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import api from '../services/api';

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { login } = useContext(AuthContext);
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const token = res.data.access_token;
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (payload.role !== 'admin') throw new Error('This portal is for admins only');
      login(token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cc-login-wrap">
      <div className="cc-login-card">
        <h2 className="fw-bold mb-1" style={{ color: '#2e7d32' }}>
          <i className="bi bi-shield-lock-fill me-2" />Admin Login
        </h2>
        <p className="text-muted small mb-4">CottonCare AI — System Administration</p>

        {error && <div className="alert alert-danger py-2 small">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Email</label>
            <input type="email" className="form-control" value={email}
              onChange={e => setEmail(e.target.value)} placeholder="admin@cottoncare.ai" required />
          </div>
          <div className="mb-4">
            <label className="form-label small fw-semibold">Password</label>
            <input type="password" className="form-control" value={password}
              onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <button className="btn btn-success w-100 fw-semibold" type="submit" disabled={loading}>
            {loading && <span className="spinner-border spinner-border-sm me-1" />}
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
