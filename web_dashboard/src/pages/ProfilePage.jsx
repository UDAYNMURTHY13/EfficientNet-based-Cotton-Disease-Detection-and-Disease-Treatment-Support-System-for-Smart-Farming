/**
 * Profile Page Component
 * Manage user profile and farm information
 */

import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import APIService from '../services/api';
import '../styles/profile.css';

function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    full_name: user?.name || '',
    phone: user?.phone || '',
    farm_location: user?.farm_name || '',
    farm_size_acres: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    setSuccess('');
    setLoading(true);

    try {
      await APIService.updateProfile(formData);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/login');
    }
  };

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-header">
        <h1>👤 My Profile</h1>
        <p>Manage your account and farm information</p>
      </div>

      <div className="profile-container">
        <div className="profile-card">
          <h2>User Information</h2>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label htmlFor="full_name">Full Name</label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={loading}
                />
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

            <div className="form-actions">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Updating...' : '✓ Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Account section */}
        <div className="profile-card">
          <h2>Account Settings</h2>
          
          <div className="account-info">
            <div className="info-item">
              <span className="info-label">Email:</span>
              <span className="info-value">{user?.email}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Role:</span>
              <span className="info-value">{user?.role || 'Farmer'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Account Created:</span>
              <span className="info-value">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>

          <div className="account-actions">
            <button 
              className="btn btn-secondary"
              onClick={handleLogout}
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
