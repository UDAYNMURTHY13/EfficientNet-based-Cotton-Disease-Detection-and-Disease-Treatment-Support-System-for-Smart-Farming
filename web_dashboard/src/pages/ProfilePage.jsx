import React, { useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import AuthContext from '../context/AuthContext';
import APIService from '../services/api';
import '../styles/profile.css';

function ProfilePage() {
  const { user, logout } = useContext(AuthContext);
  const { t } = useTranslation();
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
      setSuccess(t('profile.save_success'));
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || t('profile.save_failed'));
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
          <h1>{t('profile.title')}</h1>
          <p>{t('profile.subtitle')}</p>
        </div>
      </div>

      <div className="profile-layout">
        {/* Left: avatar + account info */}
        <div className="profile-sidebar">
          <div className="card card-body" style={{ textAlign: 'center' }}>
            <div className="profile-avatar">{initials}</div>
            <div className="profile-name">{user?.full_name || user?.name || t('sidebar.farmer')}</div>
            <div className="profile-email">{user?.email}</div>
            <div className="profile-role-badge">{user?.role || t('sidebar.farmer')}</div>
          </div>

          <div className="card" style={{ marginTop: '16px' }}>
            <div className="card-header"><h3>{t('profile.account_info')}</h3></div>
            <div className="card-body">
              {[
                { label: t('profile.email'),     value: user?.email },
                { label: t('profile.role'),      value: user?.role || t('sidebar.farmer') },
                { label: t('profile.phone'),     value: user?.phone || '—' },
                { label: t('profile.location'),  value: user?.farm_location || '—' },
                { label: t('profile.farm_size'), value: user?.farm_size_acres ? t('profile.farm_size_unit', { size: user.farm_size_acres }) : '—' },
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
            {t('profile.sign_out')}
          </button>
        </div>

        {/* Right: edit form */}
        <div className="card">
          <div className="card-header"><h3>{t('profile.edit_profile')}</h3></div>
          <div className="card-body">
            {error   && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>{t('profile.full_name')}</label>
                <input type="text" name="full_name" value={formData.full_name}
                  onChange={handleChange} placeholder={t('profile.full_name_placeholder')} disabled={loading} />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{t('profile.phone')}</label>
                  <input type="tel" name="phone" value={formData.phone}
                    onChange={handleChange} placeholder={t('profile.phone_placeholder')} disabled={loading} />
                </div>
                <div className="form-group">
                  <label>{t('profile.farm_location')}</label>
                  <input type="text" name="farm_location" value={formData.farm_location}
                    onChange={handleChange} placeholder={t('profile.farm_location_placeholder')} disabled={loading} />
                </div>
              </div>

              <div className="form-group">
                <label>{t('profile.farm_size_acres')}</label>
                <input type="number" name="farm_size_acres" value={formData.farm_size_acres}
                  onChange={handleChange} placeholder={t('profile.farm_size_placeholder')} step="0.1" disabled={loading} />
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <><span className="spinner-sm" /> {t('profile.saving')}</> : t('profile.save_changes')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;