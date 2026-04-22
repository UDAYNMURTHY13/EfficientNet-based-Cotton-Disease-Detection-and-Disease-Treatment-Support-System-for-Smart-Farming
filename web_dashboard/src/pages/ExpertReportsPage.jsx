/**
 * Expert Reports Page — Farmer's full-detail view
 * Left panel: list of analyses  |  Right panel: AI + Expert + Messages for selected analysis
 */
import React, { useState, useEffect, useCallback } from 'react';
import APIService from '../services/api';
import '../styles/expert-reports.css';

/* ── helpers ── */
const SEV_COLOR = {
  Healthy: '#22c55e', None: '#22c55e',
  Mild: '#84cc16', Moderate: '#f59e0b',
  Severe: '#ef4444', Critical: '#7f1d1d',
};

function pct(v) {
  if (v == null) return '—';
  const n = Number(v);
  return n <= 1 ? (n * 100).toFixed(1) + '%' : n.toFixed(1) + '%';
}

function fmtDate(s) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateTime(s) {
  if (!s) return '—';
  return new Date(s).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function StatusBadge({ status }) {
  const map = {
    approved:         { label: '✅ Approved',         color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
    needs_attention:  { label: '⚠️ Needs Attention',  color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
    critical:         { label: '🚨 Critical',          color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  };
  const s = map[status] || { label: status, color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' };
  return (
    <span style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color, borderRadius: 20, padding: '3px 12px', fontWeight: 600, fontSize: 13 }}>
      {s.label}
    </span>
  );
}

function UrgencyBadge({ level }) {
  const colors = { routine: '#16a34a', moderate: '#f59e0b', urgent: '#ef4444', emergency: '#7f1d1d' };
  const color = colors[level] || '#64748b';
  return (
    <span style={{ color, fontWeight: 600, textTransform: 'capitalize', fontSize: 13 }}>{level || '—'}</span>
  );
}

/* ─────────────────────────────────────────────────────── */
/*  Left panel — analysis list card                        */
/* ─────────────────────────────────────────────────────── */
function AnalysisCard({ a, selected, onClick }) {
  const sevColor = SEV_COLOR[a.severity_level] || '#94a3b8';
  const hasReview = !!a.expert_review;
  const hasMsg = a.message_count > 0;
  return (
    <button
      className={`er-card ${selected ? 'er-card-active' : ''}`}
      onClick={() => onClick(a)}
    >
      <div className="er-card-top">
        {a.image_url
          ? <img src={`/uploads/${a.image_url}`} alt="" className="er-card-img" />
          : <div className="er-card-img er-card-img-placeholder">🌿</div>}
        <div className="er-card-info">
          <div className="er-card-disease">{a.disease_detected || 'Unknown'}</div>
          <div className="er-card-meta">
            <span style={{ color: sevColor, fontWeight: 600 }}>{a.severity_level || '—'}</span>
            <span className="er-card-dot">·</span>
            <span className="er-card-date">{fmtDate(a.analyzed_at)}</span>
          </div>
          <div className="er-card-badges">
            {hasReview && <span className="er-badge er-badge-expert">👨‍🔬 Expert</span>}
            {hasMsg   && <span className="er-badge er-badge-msg">💬 Message</span>}
          </div>
        </div>
      </div>
    </button>
  );
}

/* ─────────────────────────────────────────────────────── */
/*  Right panel — full detail                              */
/* ─────────────────────────────────────────────────────── */
function DetailPanel({ analysisId, onClose }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [imgExpanded, setImgExpanded] = useState(false);

  useEffect(() => {
    if (!analysisId) return;
    setLoading(true); setError(''); setData(null);
    APIService.getAnalysisFullDetail(analysisId)
      .then(d => { if (d.detail) setError(d.detail); else setData(d); })
      .catch(() => setError('Failed to load analysis details.'))
      .finally(() => setLoading(false));
  }, [analysisId]);

  if (loading) return (
    <div className="er-detail er-detail-center">
      <div className="er-spinner" /><p>Loading full report…</p>
    </div>
  );
  if (error) return (
    <div className="er-detail er-detail-center">
      <div style={{ fontSize: 40 }}>⚠️</div><p style={{ color: '#ef4444' }}>{error}</p>
    </div>
  );
  if (!data) return null;

  const sevColor = SEV_COLOR[data.severity_level] || '#94a3b8';
  const isHealthy = data.disease_detected === 'Healthy' || data.severity_level === 'None' || data.severity_level === 'Healthy';
  const confPct = pct(data.confidence_percentage ?? data.confidence);
  const areaPct = pct(data.affected_area_percentage);

  return (
    <div className="er-detail">
      {/* ── Header ── */}
      <div className="er-detail-header">
        <div>
          <div className="er-detail-title">{data.disease_detected}</div>
          <div className="er-detail-sub">Analyzed {fmtDateTime(data.analyzed_at)}</div>
        </div>
        <button className="er-close-btn" onClick={onClose} title="Close">✕</button>
      </div>

      <div className="er-detail-body">

        {/* ── Image ── */}
        {data.image_url && (
          <div className="er-section er-section-image">
            <img
              src={`/uploads/${data.image_url}`}
              alt="Cotton leaf"
              className={`er-main-img ${imgExpanded ? 'er-main-img-expanded' : ''}`}
              onClick={() => setImgExpanded(v => !v)}
              title="Click to zoom"
            />
            {data.location_name && (
              <div className="er-location-tag">📍 {data.location_name}</div>
            )}
          </div>
        )}

        {/* ── AI Analysis ── */}
        <div className="er-section">
          <div className="er-section-heading er-heading-ai">
            <span className="er-heading-icon">🤖</span>
            <span>What AI Detected</span>
          </div>
          <div className="er-grid">
            <div className="er-field">
              <span className="er-field-label">Disease</span>
              <strong className="er-field-value">{data.disease_detected}</strong>
            </div>
            <div className="er-field">
              <span className="er-field-label">Confidence</span>
              <strong className="er-field-value" style={{ color: '#0ea5e9' }}>{confPct}</strong>
            </div>
            <div className="er-field">
              <span className="er-field-label">Severity</span>
              <strong className="er-field-value" style={{ color: sevColor }}>{data.severity_level || '—'}</strong>
            </div>
            {data.severity_score != null && (
              <div className="er-field">
                <span className="er-field-label">Severity Score</span>
                <strong className="er-field-value">{Number(data.severity_score).toFixed(2)} / 4.0</strong>
              </div>
            )}
            <div className="er-field">
              <span className="er-field-label">Affected Area</span>
              <strong className="er-field-value">{isHealthy ? '—' : areaPct}</strong>
            </div>
            <div className="er-field">
              <span className="er-field-label">Lesion Count</span>
              <strong className="er-field-value">{isHealthy ? '—' : (data.lesion_count ?? '—')}</strong>
            </div>
            {data.inference_time != null && (
              <div className="er-field">
                <span className="er-field-label">Inference Time</span>
                <strong className="er-field-value">{Number(data.inference_time).toFixed(2)}s</strong>
              </div>
            )}
          </div>

          {/* Severity indicator bars */}
          {!isHealthy && data.indicators && Object.keys(data.indicators).length > 0 && (
            <div className="er-indicators">
              {data.indicators.confidence != null && (
                <IndicatorBar label="Confidence" value={data.indicators.confidence} color={sevColor} />
              )}
              {data.indicators.area != null && (
                <IndicatorBar label="Affected Area" value={data.indicators.area} color={sevColor} />
              )}
              {data.indicators.lesions != null && (
                <IndicatorBar label="Lesion Count" value={data.indicators.lesions} color={sevColor} />
              )}
            </div>
          )}

          {/* AI Recommendation */}
          {data.recommendation && (
            <div className="er-note er-note-rec">
              <div className="er-note-label">💡 AI Recommendation</div>
              <p>{data.recommendation}</p>
            </div>
          )}

          {/* AI Reasoning */}
          {data.reasoning && (
            <div className="er-note er-note-reason">
              <div className="er-note-label">🧠 AI Reasoning</div>
              <p>{data.reasoning}</p>
            </div>
          )}
        </div>

        {/* ── Expert Review ── */}
        {data.expert_review ? (
          <div className="er-section">
            <div className="er-section-heading er-heading-expert">
              <span className="er-heading-icon">👨‍🔬</span>
              <span>Expert Review</span>
              <span className="er-heading-sub">by our agricultural expert</span>
            </div>
            <div className="er-grid">
              <div className="er-field er-field-wide">
                <span className="er-field-label">Status</span>
                <StatusBadge status={data.expert_review.status} />
              </div>
              <div className="er-field">
                <span className="er-field-label">AI Was Correct?</span>
                <strong className="er-field-value" style={{ textTransform: 'capitalize' }}>
                  {data.expert_review.ai_correct === 'confirmed' ? '✅ Yes' :
                   data.expert_review.ai_correct === 'corrected'  ? '❌ No — Corrected' :
                   data.expert_review.ai_correct === 'partial'    ? '⚠️ Partially' :
                   data.expert_review.ai_correct || '—'}
                </strong>
              </div>
              {data.expert_review.confirmed_disease && data.expert_review.ai_correct !== 'confirmed' && (
                <div className="er-field">
                  <span className="er-field-label">Correct Disease</span>
                  <strong className="er-field-value" style={{ color: '#ef4444' }}>{data.expert_review.confirmed_disease}</strong>
                </div>
              )}
              <div className="er-field">
                <span className="er-field-label">Urgency</span>
                <UrgencyBadge level={data.expert_review.urgency_level} />
              </div>
              {data.expert_review.follow_up_date && (
                <div className="er-field">
                  <span className="er-field-label">Follow-up Date</span>
                  <strong className="er-field-value">📅 {new Date(data.expert_review.follow_up_date).toLocaleDateString()}</strong>
                </div>
              )}
              <div className="er-field">
                <span className="er-field-label">Reviewed On</span>
                <span className="er-field-value er-muted">{fmtDateTime(data.expert_review.reviewed_at)}</span>
              </div>
            </div>

            {data.expert_review.expert_notes && (
              <div className="er-note er-note-expert-notes">
                <div className="er-note-label">📋 Expert Notes</div>
                <p>{data.expert_review.expert_notes}</p>
              </div>
            )}

            {data.expert_review.treatment_recommendation && (
              <div className="er-note er-note-treatment">
                <div className="er-note-label">💊 Treatment Recommendation</div>
                <p>{data.expert_review.treatment_recommendation}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="er-section er-pending-review">
            <div className="er-section-heading er-heading-expert">
              <span className="er-heading-icon">👨‍🔬</span>
              <span>Expert Review</span>
            </div>
            <div className="er-pending-box">
              <div style={{ fontSize: 32 }}>⏳</div>
              <div className="er-pending-text">
                <strong>Pending Expert Review</strong>
                <p>Our agricultural expert will review this analysis and provide feedback soon.</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Expert Messages ── */}
        <div className="er-section">
          <div className="er-section-heading er-heading-messages">
            <span className="er-heading-icon">💬</span>
            <span>Expert Messages</span>
            {data.expert_messages?.length > 0 && (
              <span className="er-msg-count">{data.expert_messages.length}</span>
            )}
          </div>

          {data.expert_messages && data.expert_messages.length > 0 ? (
            <div className="er-messages-list">
              {data.expert_messages.map(m => (
                <div key={m.id} className="er-message-card">
                  <div className="er-msg-header">
                    <div className="er-msg-avatar">{(m.from_expert || 'E')[0].toUpperCase()}</div>
                    <div>
                      <div className="er-msg-from">Dr. {m.from_expert}</div>
                      <div className="er-msg-time">{fmtDateTime(m.created_at)}</div>
                    </div>
                  </div>
                  <div className="er-msg-subject">{m.subject}</div>
                  <div className="er-msg-body">{m.message}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="er-no-msgs">
              <span>No messages for this analysis yet.</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function IndicatorBar({ label, value, color }) {
  if (value == null) return null;
  return (
    <div className="er-ind-row">
      <span className="er-ind-label">{label}</span>
      <div className="er-ind-track">
        <div className="er-ind-fill" style={{ width: `${(value / 4) * 100}%`, background: color }} />
      </div>
      <span className="er-ind-val">{value}/4</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */
/*  Main page                                              */
/* ─────────────────────────────────────────────────────── */
export default function ExpertReportsPage() {
  const [analyses, setAnalyses] = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch]     = useState('');
  const PER = 20;

  const load = useCallback(async (pg) => {
    setLoading(true);
    try {
      const data = await APIService.getReviewedAnalyses(pg, PER);
      setAnalyses(data.items || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(page); }, [page, load]);

  const filtered = search.trim()
    ? analyses.filter(a =>
        (a.disease_detected || '').toLowerCase().includes(search.toLowerCase()) ||
        (a.severity_level || '').toLowerCase().includes(search.toLowerCase()) ||
        (a.location_name || '').toLowerCase().includes(search.toLowerCase())
      )
    : analyses;

  const totalPages = Math.ceil(total / PER);

  const handleSelect = (a) => {
    setSelectedId(prev => prev === a.id ? null : a.id);
  };

  return (
    <div className="er-page">
      {/* Left panel */}
      <div className={`er-list-panel ${selectedId ? 'er-list-panel-narrow' : ''}`}>
        <div className="er-list-header">
          <div>
            <h2 className="er-list-title">🔬 Expert Reports</h2>
            <p className="er-list-sub">{total} expert-reviewed record{total !== 1 ? 's' : ''}</p>
          </div>
          <button className="er-refresh-btn" onClick={() => load(page)} title="Refresh">↻</button>
        </div>

        <div className="er-search-wrap">
          <span className="er-search-icon">🔍</span>
          <input
            className="er-search"
            placeholder="Search disease, severity…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="er-search-clear" onClick={() => setSearch('')}>✕</button>
          )}
        </div>

        {loading ? (
          <div className="er-list-loading"><div className="er-spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="er-list-empty">
            <div style={{ fontSize: 40 }}>�</div>
            <p>{search ? 'No results for this search.' : 'No expert-reviewed analyses yet.'}</p>
          </div>
        ) : (
          <div className="er-cards-scroll">
            {filtered.map(a => (
              <AnalysisCard
                key={a.id}
                a={a}
                selected={selectedId === a.id}
                onClick={handleSelect}
              />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="er-pagination">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <span>{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </div>

      {/* Right detail panel */}
      {selectedId ? (
        <div className="er-detail-panel">
          <DetailPanel
            analysisId={selectedId}
            onClose={() => setSelectedId(null)}
          />
        </div>
      ) : (
        <div className="er-placeholder">
          <div className="er-placeholder-inner">
            <div style={{ fontSize: 64 }}>🌱</div>
            <h3>Select an Analysis</h3>
            <p>Click any analysis on the left to see the complete AI output, expert review, and messages — all in one place.</p>
          </div>
        </div>
      )}
    </div>
  );
}
