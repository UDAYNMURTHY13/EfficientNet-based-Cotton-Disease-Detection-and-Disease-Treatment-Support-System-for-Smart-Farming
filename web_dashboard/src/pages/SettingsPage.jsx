import React, { useState } from 'react';
import '../styles/pages.css';

const SettingsPage = () => {
  const [settings, setSettings] = useState({
    appName: 'CottonCare AI',
    apiUrl: 'http://localhost:8000',
    enableNotifications: true,
    enableAnalytics: true,
    theme: 'light',
  });

  const [saved, setSaved] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSave = () => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="page-container">
      <h1>Settings</h1>

      {saved && <div className="success-message">✓ Settings saved successfully</div>}

      <div className="settings-form">
        <div className="form-section">
          <h2>General Settings</h2>

          <div className="form-group">
            <label>Application Name</label>
            <input
              type="text"
              name="appName"
              value={settings.appName}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>API Base URL</label>
            <input
              type="text"
              name="apiUrl"
              value={settings.apiUrl}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Theme</label>
            <select name="theme" value={settings.theme} onChange={handleChange}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          </div>
        </div>

        <div className="form-section">
          <h2>Features</h2>

          <div className="form-group checkbox">
            <input
              type="checkbox"
              name="enableNotifications"
              checked={settings.enableNotifications}
              onChange={handleChange}
              id="notifications"
            />
            <label htmlFor="notifications">Enable Notifications</label>
          </div>

          <div className="form-group checkbox">
            <input
              type="checkbox"
              name="enableAnalytics"
              checked={settings.enableAnalytics}
              onChange={handleChange}
              id="analytics"
            />
            <label htmlFor="analytics">Enable Analytics</label>
          </div>
        </div>

        <button className="btn-save" onClick={handleSave}>
          Save Settings
        </button>
      </div>

      <div className="settings-section">
        <h2>System Information</h2>
        <div className="system-info">
          <div className="info-row">
            <span>Version:</span>
            <strong>2.0.0</strong>
          </div>
          <div className="info-row">
            <span>Environment:</span>
            <strong>Production</strong>
          </div>
          <div className="info-row">
            <span>Last Updated:</span>
            <strong>{new Date().toLocaleDateString()}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
