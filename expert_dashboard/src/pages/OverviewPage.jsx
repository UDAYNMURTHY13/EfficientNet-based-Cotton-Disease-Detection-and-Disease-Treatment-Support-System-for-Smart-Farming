import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function OverviewPage() {
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/expert/stats').then(r => setStats(r.data));
  }, []);

  const cards = stats ? [
    { label: 'Reviewed by Me',  val: stats.total_reviewed,  cls: 'success', icon: 'bi-check-circle-fill' },
    { label: 'Pending Queue',   val: stats.pending_queue,   cls: 'warn',    icon: 'bi-inbox-fill' },
    { label: 'Critical Flagged',val: stats.critical_flagged,cls: 'danger',  icon: 'bi-exclamation-triangle-fill' },
    { label: 'Messages Sent',   val: stats.messages_sent,   cls: '',        icon: 'bi-chat-dots-fill' },
  ] : [];

  return (
    <>
      <div className="cc-topbar">
        <h4><i className="bi bi-grid-fill me-2 text-primary" />Overview</h4>
      </div>

      <div className="row g-3 mb-4">
        {cards.map(c => (
          <div key={c.label} className="col-md-3">
            <div className={`cc-stat ${c.cls}`}>
              <div className="cc-stat-label"><i className={`bi ${c.icon} me-1`} />{c.label}</div>
              <div className="cc-stat-val">{stats ? c.val : '—'}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="cc-panel">
        <div className="cc-panel-title"><i className="bi bi-lightning-charge-fill me-2 text-warning" />Quick Actions</div>
        <div className="d-flex flex-wrap gap-3">
          <button className="btn btn-brand" onClick={() => navigate('/queue')}>
            <i className="bi bi-inbox me-2" />Open Review Queue
            {stats?.pending_queue > 0 && <span className="badge bg-warning text-dark ms-2">{stats.pending_queue}</span>}
          </button>
          <button className="btn btn-outline-primary" onClick={() => navigate('/analyses')}>
            <i className="bi bi-file-earmark-image me-2" />Browse All Analyses
          </button>
          <button className="btn btn-outline-secondary" onClick={() => navigate('/my-reviews')}>
            <i className="bi bi-check2-square me-2" />My Reviews
          </button>
          <button className="btn btn-outline-secondary" onClick={() => navigate('/messages')}>
            <i className="bi bi-chat me-2" />Messages
          </button>
        </div>
      </div>
    </>
  );
}
