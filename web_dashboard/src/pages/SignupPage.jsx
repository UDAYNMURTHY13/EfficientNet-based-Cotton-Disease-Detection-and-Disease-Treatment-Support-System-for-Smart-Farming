/**
 * Signup Page Component
 * Farmer registration interface
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import APIService from '../services/api';
import '../styles/auth.css';

function SignupPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    full_name: '',
    farm_location: '',
    farm_size_acres: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await APIService.signup({
        ...formData,
        farm_size_acres: parseFloat(formData.farm_size_acres) || null
      });
      
      if (response.access_token) {
        localStorage.setItem('token', response.access_token);
        navigate('/dashboard');
      } else {
        setError(response.detail || 'Signup failed');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>🌾 CottonCare AI</h1>
          <p>Farmer Registration</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="full_name">Full Name</label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Your full name"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+91 9876543210"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 8 characters"
              required
              disabled={loading}
            />
            <small>Minimum 8 characters required</small>
          </div>

          <div className="form-group">
            <label htmlFor="farm_location">Farm Location</label>
            <input
              type="text"
              id="farm_location"
              name="farm_location"
              value={formData.farm_location}
              onChange={handleChange}
              placeholder="City/District"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="farm_size_acres">Farm Size (Acres)</label>
            <input
              type="number"
              id="farm_size_acres"
              name="farm_size_acres"
              value={formData.farm_size_acres}
              onChange={handleChange}
              placeholder="0"
              step="0.1"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Creating account...' : '✓ Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Login here</Link></p>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
