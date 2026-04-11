import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const THEMES = [
  { id: 'light',  label: 'Light',  icon: '☀️' },
  { id: 'dark',   label: 'Dark',   icon: '🌙' },
  { id: 'system', label: 'System', icon: '💻' },
];

export const LANGUAGES = [
  { id: 'en',    label: 'English',    flag: '🇬🇧' },
  { id: 'hi',    label: 'हिन्दी',      flag: '🇮🇳' },
  { id: 'te',    label: 'తెలుగు',     flag: '🇮🇳' },
  { id: 'ta',    label: 'தமிழ்',      flag: '🇮🇳' },
  { id: 'kn',    label: 'ಕನ್ನಡ',      flag: '🇮🇳' },
  { id: 'mr',    label: 'मराठी',      flag: '🇮🇳' },
  { id: 'gu',    label: 'ગુજરાતી',    flag: '🇮🇳' },
  { id: 'pa',    label: 'ਪੰਜਾਬੀ',     flag: '🇮🇳' },
];

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  const resolved = theme === 'system' ? getSystemTheme() : theme;
  document.documentElement.setAttribute('data-theme', resolved);
}

function applyLanguage(lang) {
  document.documentElement.setAttribute('lang', lang);
}

export function SettingsProvider({ children }) {
  const [theme, setThemeState] = useState(
    () => localStorage.getItem('cc_theme') || 'light'
  );
  const [language, setLanguageState] = useState(
    () => localStorage.getItem('cc_language') || 'en'
  );

  // Apply on mount
  useEffect(() => {
    applyTheme(theme);
    applyLanguage(language);
  }, []);

  // Listen for system theme changes when theme == 'system'
  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = (t) => {
    setThemeState(t);
    localStorage.setItem('cc_theme', t);
    applyTheme(t);
  };

  const setLanguage = (l) => {
    setLanguageState(l);
    localStorage.setItem('cc_language', l);
    applyLanguage(l);
  };

  return (
    <SettingsContext.Provider value={{ theme, setTheme, language, setLanguage }}>
      {children}
    </SettingsContext.Provider>
  );
}

export default SettingsContext;
export const useSettings = () => useContext(SettingsContext);
