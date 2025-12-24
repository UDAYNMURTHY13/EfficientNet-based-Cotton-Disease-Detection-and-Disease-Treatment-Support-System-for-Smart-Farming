import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CasesPage from './pages/CasesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import VerificationPage from './pages/VerificationPage';
import UsersPage from './pages/UsersPage';
import SettingsPage from './pages/SettingsPage';
import './styles/global.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <DataProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/*"
              element={
                <Layout>
                  <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/cases" element={<CasesPage />} />
                    <Route path="/analytics" element={<AnalyticsPage />} />
                    <Route path="/verification" element={<VerificationPage />} />
                    <Route path="/users" element={<UsersPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="*" element={<Navigate to="/" />} />
                  </Routes>
                </Layout>
              }
            />
          </Routes>
        </DataProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
