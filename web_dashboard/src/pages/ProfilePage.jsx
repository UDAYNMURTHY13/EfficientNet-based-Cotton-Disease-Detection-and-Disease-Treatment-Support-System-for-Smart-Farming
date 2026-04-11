import React, { useState, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import APIService from '../services/api';
import '../styles/profile.css';

function ProfilePage() {
  const { user, logout } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || user?.name || '',
    phone: user?.phone || '',
    farm_location: user?.farm_location || user?.farm_name || '',
    farm_size_acres: user?.farm_size_acres || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) =>
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
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

  const initials = (user?.full_name || user?.name || 'U')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="profile-page">
      <div className="page-header">
        <div>
          <h1>My Profile</h1>
          <p>Manage your account and farm information</p>
        </div>
      </div>

      <div className="profile-layout">
        {/* Left: avatar + account info */}
        <div className="profile-sidebar">
          <div className="card card-body" style={{ textAlign: 'center' }}>
            <div className="profile-avatar">{initials}</div>
            <div className="profile-name">{user?.full_name || user?.name || 'Farmer'}</div>
            <div className="profile-email">{user?.email}</div>
            <div className="profile-role-badge">{user?.role || 'Farmer'}</div>
          </div>

          <div className="card" style={{ marginTop: '16px' }}>
            <div className="card-header"><h3>Account Info</h3></div>
            <div className="card-body">
              {[
                { label: 'Email', value: user?.email },
                { label: 'Role', value: user?.role || 'Farmer' },
                { label: 'Phone', value: user?.phone || '—' },
                { label: 'Location', value: user?.farm_location || '—' },
                { label: 'Farm Size', value: user?.farm_size_acres ? `${user.farm_size_acres} acres` : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="info-row">
                  <span className="info-label">{label}</span>
                  <span className="info-value">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <button className="btn btn-danger btn-block" style={{ marginTop: '16px' }}
            onClick={logout}>
            Sign out
          </button>
        </div>

        {/* Right: edit form */}
        <div className="card">
          <div className="card-header"><h3>Edit Profile</h3></div>
          <div className="card-body">
            {error   && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" name="full_name" value={formData.full_name}
                  onChange={handleChange} placeholder="Your full name" disabled={loading} />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Phone Number</label>
                  <input type="tel" name="phone" value={formData.phone}
                    onChange={handleChange} placeholder="+91 9876543210" disabled={loading} />
                </div>
                <div className="form-group">
                  <label>Farm Location</label>
                  <input type="text" name="farm_location" value={formData.farm_location}
                    onChange={handleChange} placeholder="City / District" disabled={loading} />
                </div>
              </div>

              <div className="form-group">
                <label>Farm Size (Acres)</label>
                <input type="number" name="farm_size_acres" value={formData.farm_size_acres}
                  onChange={handleChange} placeholder="e.g. 5.5" step="0.1" disabled={loading} />
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <><span className="spinner-sm" /> Saving…</> : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;