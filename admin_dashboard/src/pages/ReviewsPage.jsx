import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function fmtDate(s) { if (!s) return '—'; return new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const navigate = useNavigate();
  const PER = 20;

  const load = async (pg = page) => {
    setLoading(true);
    try {
      const r = await api.get('/admin/expert-reviews', { params: { page: pg, per_page: PER } });
      setReviews(r.data.reviews); setTotal(r.data.total);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(page); }, [page]);

  const statusColor = (s) => s === 'critical' ? '#ef4444' : s === 'needs_attention' ? '#f59e0b' : '#16a34a';
  const statusClass = (s) => ({ approved: 'status-approved', needs_attention: 'status-needs_attention', critical: 'status-critical' }[s] || 'status-approved');
  const statusLabel = (s) => s === 'approved' ? '✅ Approved' : s === 'needs_attention' ? '⚠️ Needs Attention' : s === 'critical' ? '🚨 Critical' : s;

  const toggle = (id) => setExpanded(v => v === id ? null : id);

  return (
    <>
      <div className="cc-topbar">
        <h4><i className="bi bi-check2-circle me-2 text-success" />Expert Reviews</h4>
        <button className="btn btn-brand btn-sm" onClick={() => load(page)}><i className="bi bi-arrow-clockwise me-1" />Refresh</button>
      </div>

      <div className="cc-panel">
        {loading
          ? <div className="text-center py-4"><span className="spinner-border text-success" /></div>
          : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead><tr>
                  <th style={{ width: 60 }}>Image</th>
                  <th>Disease (AI)</th>
                  <th>Expert</th>
                  <th>Farmer</th>
                  <th>Status</th>
                  <th>AI Correct?</th>
                  <th>Corrected Disease</th>
                  <th>Urgency</th>
                  <th>Reviewed At</th>
                  <th style={{ width: 40 }}></th>
                </tr></thead>
                <tbody>
                  {reviews.length === 0
                    ? <tr><td colSpan={10}><div className="cc-empty"><i className="bi bi-check2-circle" />No reviews yet</div></td></tr>
                    : reviews.map(r => (
                      <React.Fragment key={r.id}>
                        <tr style={{ cursor: 'pointer' }} onClick={() => toggle(r.id)}>
                          <td>
                            {r.image_url
                              ? <img src={`/uploads/${r.image_url}`} className="thumb" alt="" onClick={e => e.stopPropagation()} />
                              : <span className="text-muted small">—</span>}
                          </td>
                          <td className="fw-semibold small">{r.disease_detected || '—'}</td>
                          <td className="small">{r.expert_name || '—'}</td>
                          <td className="small">{r.farmer_name || '—'}</td>
                          <td><span className={`role-badge ${statusClass(r.status)}`}>{statusLabel(r.status)}</span></td>
                          <td className="small" style={{ textTransform: 'capitalize' }}>{r.ai_correct || '—'}</td>
                          <td className="small">{r.confirmed_disease || <span className="text-muted">—</span>}</td>
                          <td className="small" style={{ textTransform: 'capitalize' }}>{r.urgency_level || '—'}</td>
                          <td className="small text-muted">{fmtDate(r.reviewed_at)}</td>
                          <td className="text-center">
                            <i className={`bi bi-chevron-${expanded === r.id ? 'up' : 'down'} text-muted`} />
                          </td>
                        </tr>

                        {/* Expanded detail row */}
                        {expanded === r.id && (
                          <tr>
                            <td colSpan={10} style={{ background: '#faf5ff', borderTop: 'none', padding: '0 12px 12px' }}>
                              <div className="row g-3 pt-3">

                                {/* Expert Notes */}
                                <div className="col-md-4">
                                  <div className="small fw-semibold text-muted mb-1"><i className="bi bi-journal-text me-1" />Expert Notes</div>
                                  {r.expert_notes
                                    ? <div className="small p-2" style={{ background: '#f5f3ff', borderRadius: 6, border: '1px solid #ddd6fe' }}>{r.expert_notes}</div>
                                    : <span className="text-muted small fst-italic">No notes provided</span>}
                                </div>

                                {/* Treatment */}
                                <div className="col-md-4">
                                  <div className="small fw-semibold text-muted mb-1"><i className="bi bi-capsule me-1" />Treatment Recommendation</div>
                                  {r.treatment_recommendation
                                    ? <div className="small p-2" style={{ background: '#f0fdf4', borderRadius: 6, border: '1px solid #bbf7d0' }}>{r.treatment_recommendation}</div>
                                    : <span className="text-muted small fst-italic">No recommendation provided</span>}
                                </div>

                                {/* Meta */}
                                <div className="col-md-4">
                                  <div className="small fw-semibold text-muted mb-1"><i className="bi bi-info-circle me-1" />Details</div>
                                  <div className="small">
                                    <div><span className="text-muted">Analysis ID: </span><span className="font-monospace">{r.analysis_id?.slice(0, 12)}…</span></div>
                                    <div><span className="text-muted">Review ID: </span><span className="font-monospace">{r.id?.slice(0, 12)}…</span></div>
                                    {r.follow_up_date && <div className="mt-1"><span className="text-muted">Follow-up: </span><strong>{new Date(r.follow_up_date).toLocaleDateString()}</strong></div>}
                                    <div className="mt-1">
                                      <button className="btn btn-outline-success btn-sm" onClick={e => { e.stopPropagation(); navigate(`/analyses?id=${r.analysis_id}`); }}>
                                        <i className="bi bi-eye me-1" />View Full Analysis
                                      </button>
                                    </div>
                                  </div>
                                </div>

                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                </tbody>
              </table>
            </div>
          )}

        <div className="d-flex justify-content-between align-items-center mt-2">
          <span className="text-muted small">{(page - 1) * PER + 1}–{Math.min(page * PER, total)} of {total}</span>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
            <button className="btn btn-outline-secondary btn-sm" disabled={page * PER >= total} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </div>
      </div>
    </>
  );
}
