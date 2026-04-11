import React from 'react';
import { useSettings, THEMES, LANGUAGES } from '../context/SettingsContext';
import '../styles/settings.css';

function SettingsPage() {
  const { theme, setTheme, language, setLanguage } = useSettings();

  return (
    <div className="settings-page">
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Customize your CottonCare AI experience</p>
        </div>
      </div>

      <div className="settings-grid">

        {/* ─── Appearance ─── */}
        <div className="card settings-card">
          <div className="card-header">
            <h3>🎨 Appearance</h3>
          </div>
          <div className="card-body">
            <div className="settings-label">Theme</div>
            <div className="theme-options">
              {THEMES.map(t => (
                <button
                  key={t.id}
                  className={`theme-option ${theme === t.id ? 'active' : ''}`}
                  onClick={() => setTheme(t.id)}
                >
                  <span className="theme-icon">{t.icon}</span>
                  <span className="theme-label">{t.label}</span>
                  {theme === t.id && <span className="theme-check">✓</span>}
                </button>
              ))}
            </div>
            <p className="settings-hint">
              "System" follows your device's dark/light mode preference automatically.
            </p>
          </div>
        </div>

        {/* ─── Language ─── */}
        <div className="card settings-card">
          <div className="card-header">
            <h3>🌐 Language</h3>
          </div>
          <div className="card-body">
            <div className="settings-label">App Language</div>
            <div className="lang-options">
              {LANGUAGES.map(l => (
                <button
                  key={l.id}
                  className={`lang-option ${language === l.id ? 'active' : ''}`}
                  onClick={() => setLanguage(l.id)}
                >
                  <span className="lang-flag">{l.flag}</span>
                  <span className="lang-name">{l.label}</span>
                  {language === l.id && <span className="lang-check">✓</span>}
                </button>
              ))}
            </div>
            <p className="settings-hint">
              UI language selection — content localisation coming soon.
            </p>
          </div>
        </div>

        {/* ─── Current Settings preview ─── */}
        <div className="card settings-card settings-summary">
          <div className="card-header"><h3>✅ Active Settings</h3></div>
          <div className="card-body">
            <div className="summary-row">
              <span className="summary-key">Theme</span>
              <span className="summary-val">
                {THEMES.find(t => t.id === theme)?.icon} {THEMES.find(t => t.id === theme)?.label}
              </span>
            </div>
            <div className="summary-row">
              <span className="summary-key">Language</span>
              <span className="summary-val">
                {LANGUAGES.find(l => l.id === language)?.flag} {LANGUAGES.find(l => l.id === language)?.label}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default SettingsPage;
