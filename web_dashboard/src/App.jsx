/**
 * CottonCare AI – Main Application
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthContext from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import AnalyzePage from './pages/AnalyzePage';
import HistoryPage from './pages/HistoryPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import PrivateRoute from './components/PrivateRoute';
import './styles/App.css';

function AppShell({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        <div className="app-content">{children}</div>
      </main>
    </div>
  );
}

function App() {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    user: null,
    token: null,
    loading: true,
  });

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      try {
        setAuthState({
          isAuthenticated: true,
          user: JSON.parse(storedUser),
          token: storedToken,
          loading: false,
        });
      } catch {
        localStorage.clear();
        setAuthState((p) => ({ ...p, loading: false }));
      }
    } else {
      setAuthState((p) => ({ ...p, loading: false }));
    }
  }, []);

  const login = (user, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setAuthState({ isAuthenticated: true, user, token, loading: false });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuthState({ isAuthenticated: false, user: null, token: null, loading: false });
  };

  // Auto-logout when any API call returns 401 (token expired / invalid)
  useEffect(() => {
    const handleExpired = () => {
      setAuthState({ isAuthenticated: false, user: null, token: null, loading: false });
      // Navigate to login with a message flag
      window.location.replace('/login?reason=session_expired');
    };
    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, []);

  if (authState.loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading CottonCare AI…</p>
      </div>
    );
  }

  return (
    <SettingsProvider>
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/login"  element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Protected — wrapped in sidebar shell */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <AppShell><DashboardPage /></AppShell>
              </PrivateRoute>
            }
          />
          <Route
            path="/analyze"
            element={
              <PrivateRoute>
                <AppShell><AnalyzePage /></AppShell>
              </PrivateRoute>
            }
          />
          <Route
            path="/history"
            element={
              <PrivateRoute>
                <AppShell><HistoryPage /></AppShell>
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <AppShell><ProfilePage /></AppShell>
              </PrivateRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <AppShell><SettingsPage /></AppShell>
              </PrivateRoute>
            }
          />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthContext.Provider>
    </SettingsProvider>
  );
}

export default App;
