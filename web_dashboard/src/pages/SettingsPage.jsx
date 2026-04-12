import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings, THEMES, LANGUAGES } from '../context/SettingsContext';
import '../styles/settings.css';

function SettingsPage() {
  const { theme, setTheme, language, setLanguage } = useSettings();
  const { t } = useTranslation();

  return (
    <div className="settings-page">
      <div className="page-header">
        <div>
          <h1>{t('settings.title')}</h1>
          <p>{t('settings.subtitle')}</p>
        </div>
      </div>

      <div className="settings-grid">

        {/* ─── Appearance ─── */}
        <div className="card settings-card">
          <div className="card-header">
            <h3>🎨 {t('settings.appearance')}</h3>
          </div>
          <div className="card-body">
            <div className="settings-label">{t('settings.theme')}</div>
            <div className="theme-options">
              {THEMES.map(th => (
                <button
                  key={th.id}
                  className={`theme-option ${theme === th.id ? 'active' : ''}`}
                  onClick={() => setTheme(th.id)}
                >
                  <span className="theme-icon">{th.icon}</span>
                  <span className="theme-label">{t(`settings.${th.id}`)}</span>
                  {theme === th.id && <span className="theme-check">✓</span>}
                </button>
              ))}
            </div>
            <p className="settings-hint">{t('settings.system_hint')}</p>
          </div>
        </div>

        {/* ─── Language ─── */}
        <div className="card settings-card">
          <div className="card-header">
            <h3>🌐 {t('settings.language')}</h3>
          </div>
          <div className="card-body">
            <div className="settings-label">{t('settings.app_language')}</div>
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
            <p className="settings-hint">{t('settings.language_hint')}</p>
          </div>
        </div>

        {/* ─── Current Settings preview ─── */}
        <div className="card settings-card settings-summary">
          <div className="card-header"><h3>✅ {t('settings.active_settings')}</h3></div>
          <div className="card-body">
            <div className="summary-row">
              <span className="summary-key">{t('settings.active_theme')}</span>
              <span className="summary-val">
                {THEMES.find(th => th.id === theme)?.icon} {t(`settings.${theme}`)}
              </span>
            </div>
            <div className="summary-row">
              <span className="summary-key">{t('settings.active_language')}</span>
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
