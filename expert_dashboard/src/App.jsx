import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthContext from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import OverviewPage from './pages/OverviewPage';
import QueuePage from './pages/QueuePage';
import AllAnalysesPage from './pages/AllAnalysesPage';
import MyReviewsPage from './pages/MyReviewsPage';
import MessagesPage from './pages/MessagesPage';

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
    const token = localStorage.getItem('cc_expert_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        if (['expert', 'admin'].includes(payload.role)) {
          setAuthState({ user: payload, token, isAuthenticated: true });
        } else {
          localStorage.removeItem('cc_expert_token');
        }
      } catch {
        localStorage.removeItem('cc_expert_token');
      }
    }
  }, []);

  const login = (token) => {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    localStorage.setItem('cc_expert_token', token);
    setAuthState({ user: payload, token, isAuthenticated: true });
  };

  const logout = () => {
    localStorage.removeItem('cc_expert_token');
    setAuthState({ user: null, token: null, isAuthenticated: false });
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/overview"   element={<PrivateRoute><AppShell><OverviewPage /></AppShell></PrivateRoute>} />
          <Route path="/queue"      element={<PrivateRoute><AppShell><QueuePage /></AppShell></PrivateRoute>} />
          <Route path="/analyses"   element={<PrivateRoute><AppShell><AllAnalysesPage /></AppShell></PrivateRoute>} />
          <Route path="/my-reviews" element={<PrivateRoute><AppShell><MyReviewsPage /></AppShell></PrivateRoute>} />
          <Route path="/messages"   element={<PrivateRoute><AppShell><MessagesPage /></AppShell></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
