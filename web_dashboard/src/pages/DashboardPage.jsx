import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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

  const name = user?.full_name || user?.name || t('sidebar.farmer');
  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('dashboard.greeting_morning')
    : hour < 17 ? t('dashboard.greeting_afternoon')
    : t('dashboard.greeting_evening');

  return (
    <div className="dashboard-page">
      {/* Hero */}
      <div className="dashboard-hero">
        <div className="hero-text">
          <h1>{greeting}, {name} 👋</h1>
          <p>{t('dashboard.subtitle')}</p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={() => navigate('/analyze')}>
          🔬 {t('dashboard.new_analysis')}
        </button>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="loading-placeholder"><div className="spinner-dark" /> {t('dashboard.loading')}</div>
      ) : (
        <div className="stats-grid">
          <StatCard icon="📊" label={t('dashboard.total_analyses')} value={stats?.total_analyses ?? 0}
            sub={t('dashboard.all_time')} color="#16a34a" />
          <StatCard icon="🦠" label={t('dashboard.diseases_found')} value={stats?.disease_types?.length ?? 0}
            sub={t('dashboard.unique_types')} color="#0ea5e9" />
          <StatCard icon="🎯" label={t('dashboard.avg_confidence')}
            value={stats?.avg_confidence ? `${(stats.avg_confidence * 100).toFixed(0)}%` : '—'}
            sub={t('dashboard.detection_accuracy')} color="#8b5cf6" />
          <StatCard icon="⚠️" label={t('dashboard.moderate_cases')}
            value={stats?.severity_distribution?.Moderate ?? 0}
            sub={t('dashboard.needs_attention')} color="#f59e0b" />
        </div>
      )}

      {/* Quick Actions */}
      <div className="section-title">{t('dashboard.quick_actions')}</div>
      <div className="quick-actions">
        {[
          { icon: '📸', title: t('dashboard.analyze_image'), desc: t('dashboard.analyze_desc'), path: '/analyze', color: '#16a34a' },
          { icon: '📋', title: t('dashboard.view_history'),  desc: t('dashboard.history_desc'),  path: '/history', color: '#0ea5e9' },
          { icon: '👤', title: t('dashboard.my_profile'),    desc: t('dashboard.profile_desc'),   path: '/profile', color: '#8b5cf6' },
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
        <span className="section-title" style={{ marginBottom: 0 }}>{t('dashboard.recent_analyses')}</span>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/history')}>{t('dashboard.view_all')}</button>
      </div>

      {recent.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🌿</div>
          <h3>{t('dashboard.no_analyses')}</h3>
          <p>{t('dashboard.no_analyses_desc')}</p>
          <button className="btn btn-primary" onClick={() => navigate('/analyze')}>{t('dashboard.start_analysis')}</button>
        </div>
      ) : (
        <div className="recent-table">
          <div className="rtable-head">
            <span>{t('dashboard.disease')}</span>
            <span>{t('dashboard.severity')}</span>
            <span>{t('dashboard.confidence')}</span>
            <span>{t('dashboard.location')}</span>
            <span>{t('dashboard.date')}</span>
          </div>
          {recent.map((r) => (
            <div key={r.id} className="rtable-row">
              <span className="rt-disease">{r.disease_detected}</span>
              <span>
                <span className={`badge badge-${r.severity_level}`}>{r.severity_level}</span>
              </span>
              <span className="rt-conf">
                {r.confidence_percentage != null
                  ? `${Number(r.confidence_percentage).toFixed(0)}%`
                  : r.confidence != null
                    ? `${(r.confidence * 100).toFixed(0)}%`
                    : '—'}
              </span>
              <span className="rt-loc" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {r.location_name || r.environment_conditions || '—'}
              </span>
              <span className="rt-date">{new Date(r.analyzed_at).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}

      {/* How it works */}
      <div className="section-title" style={{ marginTop: '40px' }}>{t('dashboard.how_it_works')}</div>
      <div className="steps-row">
        {[
          { n: '1', icon: '📷', title: t('dashboard.step_capture'),   desc: t('dashboard.step_capture_desc') },
          { n: '2', icon: '🤖', title: t('dashboard.step_ai'),        desc: t('dashboard.step_ai_desc') },
          { n: '3', icon: '📋', title: t('dashboard.step_results'),   desc: t('dashboard.step_results_desc') },
          { n: '4', icon: '💊', title: t('dashboard.step_treatment'), desc: t('dashboard.step_treatment_desc') },
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
