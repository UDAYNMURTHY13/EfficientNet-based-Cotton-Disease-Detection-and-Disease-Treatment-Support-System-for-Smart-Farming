/**
 * Dashboard Page Component
 * Main landing page for authenticated farmers
 */

import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import APIService from '../services/api';
import '../styles/dashboard.css';

function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await APIService.getAnalysisStats();
      setStats(data);
    } catch (err) {
      setError('Failed to load statistics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-page">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-content">
          <div className="navbar-logo">🌾 CottonCare AI</div>
          <div className="navbar-menu">
            <a href="#" onClick={() => navigate('/analyze')} className="nav-link">
              📸 Analyze
            </a>
            <a href="#" onClick={() => navigate('/history')} className="nav-link">
              📋 History
            </a>
            <a href="#" onClick={() => navigate('/profile')} className="nav-link">
              👤 Profile
            </a>
            <button className="nav-btn btn-secondary" onClick={logout}>
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="dashboard-container">
        {/* Welcome Section */}
        <div className="welcome-section">
          <h1>Welcome, {user?.name || 'Farmer'}! 👋</h1>
          <p>Monitor your cotton crops with AI-powered disease detection</p>
        </div>

        {/* Quick Stats */}
        {loading ? (
          <div className="loading">Loading statistics...</div>
        ) : stats ? (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-value">{stats.total_analyses || 0}</div>
              <div className="stat-label">Total Analyses</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🍃</div>
              <div className="stat-value">{stats.disease_types?.length || 0}</div>
              <div className="stat-label">Disease Types Found</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📈</div>
              <div className="stat-value">{(stats.avg_confidence * 100).toFixed(0)}%</div>
              <div className="stat-label">Avg Confidence</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">⚠️</div>
              <div className="stat-value">{stats.severity_distribution?.Moderate || 0}</div>
              <div className="stat-label">Moderate Cases</div>
            </div>
          </div>
        ) : null}

        {/* Features Grid */}
        <div className="features-section">
          <h2>🎯 Key Features</h2>
          <div className="features-grid">
            <div className="feature-card" onClick={() => navigate('/analyze')}>
              <div className="feature-icon">📸</div>
              <h3>Analyze Images</h3>
              <p>Upload or capture cotton leaf images for instant disease detection</p>
              <span className="feature-arrow">→</span>
            </div>

            <div className="feature-card" onClick={() => navigate('/history')}>
              <div className="feature-icon">📋</div>
              <h3>View History</h3>
              <p>Browse all your previous analyses and trend over time</p>
              <span className="feature-arrow">→</span>
            </div>

            <div className="feature-card" onClick={() => navigate('/profile')}>
              <div className="feature-icon">⚙️</div>
              <h3>Settings</h3>
              <p>Update your profile and farm information</p>
              <span className="feature-arrow">→</span>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📚</div>
              <h3>Learn More</h3>
              <p>Access guides on disease management and treatment options</p>
              <span className="feature-arrow">→</span>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="info-section">
          <h2>ℹ️ How It Works</h2>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <h4>Upload Image</h4>
              <p>Take a photo of your cotton leaf</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h4>AI Analysis</h4>
              <p>Deep learning model detects diseases</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h4>Get Results</h4>
              <p>View detailed diagnosis and recommendations</p>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <h4>Take Action</h4>
              <p>Follow treatment recommendations</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="cta-section">
          <h2>Ready to protect your crops?</h2>
          <button 
            className="btn btn-primary btn-large"
            onClick={() => navigate('/analyze')}
          >
            🚀 Start Analysis Now
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="dashboard-footer">
        <p>CottonCare AI v3.0 | Powered by Advanced Machine Learning</p>
      </footer>
    </div>
  );
}

export default DashboardPage;
