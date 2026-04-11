import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import APIService from '../services/api';
import '../styles/dashboard.css';

const SEV_COLORS = {
  Healthy:  '#22c55e',
  Mild:     '#84cc16',
  Moderate: '#f59e0b',
  Severe:   '#ef4444',
  Critical: '#7f1d1d',
};

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className="stat-card" style={{ borderTop: `3px solid ${color}` }}>
      <div className="stat-icon" style={{ background: color + '18', color }}>{icon}</div>
      <div className="stat-body">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
    </div>
  );
}

function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      APIService.getAnalysisStats().catch(() => null),
      APIService.getAnalysisHistory(1, 5).catch(() => ({ items: [] })),
    ]).then(([s, h]) => {
      setStats(s);
      setRecent(h?.items || []);
      setLoading(false);
    });
  }, []);

  const name = user?.full_name || user?.name || 'Farmer';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="dashboard-page">
      {/* Hero */}
      <div className="dashboard-hero">
        <div className="hero-text">
          <h1>{greeting}, {name} 👋</h1>
          <p>Monitor your cotton crops with AI-powered disease detection</p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={() => navigate('/analyze')}>
          🔬 New Analysis
        </button>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="loading-placeholder"><div className="spinner-dark" /> Loading statistics…</div>
      ) : (
        <div className="stats-grid">
          <StatCard icon="📊" label="Total Analyses" value={stats?.total_analyses ?? 0}
            sub="All time" color="#16a34a" />
          <StatCard icon="🦠" label="Diseases Found" value={stats?.disease_types?.length ?? 0}
            sub="Unique types" color="#0ea5e9" />
          <StatCard icon="🎯" label="Avg Confidence"
            value={stats?.avg_confidence ? `${(stats.avg_confidence * 100).toFixed(0)}%` : '—'}
            sub="Detection accuracy" color="#8b5cf6" />
          <StatCard icon="⚠️" label="Moderate Cases"
            value={stats?.severity_distribution?.Moderate ?? 0}
            sub="Needs attention" color="#f59e0b" />
        </div>
      )}

      {/* Quick Actions */}
      <div className="section-title">Quick Actions</div>
      <div className="quick-actions">
        {[
          { icon: '📸', title: 'Analyze Image', desc: 'Upload or capture a leaf photo', path: '/analyze', color: '#16a34a' },
          { icon: '📋', title: 'View History', desc: 'Browse all past analyses', path: '/history', color: '#0ea5e9' },
          { icon: '👤', title: 'My Profile', desc: 'Update farm information', path: '/profile', color: '#8b5cf6' },
        ].map((a) => (
          <div key={a.path} className="action-card" onClick={() => navigate(a.path)}
            style={{ '--accent': a.color }}>
            <div className="action-icon" style={{ background: a.color + '18', color: a.color }}>{a.icon}</div>
            <div>
              <div className="action-title">{a.title}</div>
              <div className="action-desc">{a.desc}</div>
            </div>
            <span className="action-arrow">→</span>
          </div>
        ))}
      </div>

      {/* Recent Analyses */}
      <div className="section-header">
        <span className="section-title" style={{ marginBottom: 0 }}>Recent Analyses</span>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/history')}>View all →</button>
      </div>

      {recent.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🌿</div>
          <h3>No analyses yet</h3>
          <p>Upload your first cotton leaf image to get started</p>
          <button className="btn btn-primary" onClick={() => navigate('/analyze')}>Start Analysis</button>
        </div>
      ) : (
        <div className="recent-table">
          <div className="rtable-head">
            <span>Disease</span><span>Severity</span><span>Confidence</span><span>Date</span>
          </div>
          {recent.map((r) => (
            <div key={r.id} className="rtable-row">
              <span className="rt-disease">{r.disease_detected}</span>
              <span>
                <span className={`badge badge-${r.severity_level}`}>{r.severity_level}</span>
              </span>
              <span className="rt-conf">
                {r.confidence_score ? `${(r.confidence_score * 100).toFixed(0)}%` : '—'}
              </span>
              <span className="rt-date">{new Date(r.analyzed_at).toLocaleDateString('en-IN')}</span>
            </div>
          ))}
        </div>
      )}

      {/* How it works */}
      <div className="section-title" style={{ marginTop: '40px' }}>How It Works</div>
      <div className="steps-row">
        {[
          { n: '1', icon: '📷', title: 'Capture', desc: 'Take a photo of your cotton leaf' },
          { n: '2', icon: '🤖', title: 'AI Analysis', desc: 'Deep learning detects diseases instantly' },
          { n: '3', icon: '📋', title: 'Results', desc: 'Detailed diagnosis with severity score' },
          { n: '4', icon: '💊', title: 'Treatment', desc: 'Expert treatment recommendations' },
        ].map((s) => (
          <div key={s.n} className="step-card">
            <div className="step-num">{s.n}</div>
            <div className="step-icon">{s.icon}</div>
            <div className="step-title">{s.title}</div>
            <div className="step-desc">{s.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DashboardPage;