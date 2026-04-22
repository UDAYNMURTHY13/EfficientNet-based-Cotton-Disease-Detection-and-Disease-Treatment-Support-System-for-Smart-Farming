import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthContext from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import AnalysesPage from './pages/AnalysesPage';
import CreateExpertPage from './pages/CreateExpertPage';
import ReviewsPage from './pages/ReviewsPage';
import TrendsPage from './pages/TrendsPage';

function AppShell({ children }) {
  return (
    <div>
      <Sidebar />
      <main className="cc-main">{children}</main>
    </div>
  );
}

export default function App() {
  const [authState, setAuthState] = useState({ user: null, token: null, isAuthenticated: false });

  useEffect(() => {
    const token = localStorage.getItem('cc_admin_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        if (payload.role === 'admin') {
          setAuthState({ user: payload, token, isAuthenticated: true });
        } else {
          localStorage.removeItem('cc_admin_token');
        }
      } catch {
        localStorage.removeItem('cc_admin_token');
      }
    }
  }, []);

  const login = (token) => {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    localStorage.setItem('cc_admin_token', token);
    setAuthState({ user: payload, token, isAuthenticated: true });
  };

  const logout = () => {
    localStorage.removeItem('cc_admin_token');
    setAuthState({ user: null, token: null, isAuthenticated: false });
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<PrivateRoute><AppShell><DashboardPage /></AppShell></PrivateRoute>} />
          <Route path="/users" element={<PrivateRoute><AppShell><UsersPage /></AppShell></PrivateRoute>} />
          <Route path="/analyses" element={<PrivateRoute><AppShell><AnalysesPage /></AppShell></PrivateRoute>} />
          <Route path="/create-expert" element={<PrivateRoute><AppShell><CreateExpertPage /></AppShell></PrivateRoute>} />
          <Route path="/reviews" element={<PrivateRoute><AppShell><ReviewsPage /></AppShell></PrivateRoute>} />
          <Route path="/trends" element={<PrivateRoute><AppShell><TrendsPage /></AppShell></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
