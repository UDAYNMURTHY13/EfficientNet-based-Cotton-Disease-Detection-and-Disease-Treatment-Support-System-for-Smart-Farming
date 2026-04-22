import React, { useState, useEffect } from 'react';
import api from '../services/api';
import ReviewModal from '../components/ReviewModal';

function fmtDate(s) { if (!s) return '—'; return new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }

export default function MyReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [reviewId, setReviewId] = useState(null);
  const PER = 15;

  const load = async (pg = page) => {
    setLoading(true);
    try {
      const r = await api.get('/expert/my-reviews', { params: { page: pg, per_page: PER } });
      setReviews(r.data.reviews); setTotal(r.data.total);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(page); }, [page]);

  const onReviewDone = () => { setReviewId(null); load(page); };

  const statusClass = (s) => ({ approved: 'badge bg-success', needs_attention: 'badge bg-warning text-dark', critical: 'badge bg-danger' }[s] || 'badge bg-secondary');

  return (
    <>
      <div className="cc-topbar">
        <h4><i className="bi bi-check2-square me-2 text-primary" />My Reviews</h4>
        <button className="btn btn-brand btn-sm" onClick={() => load(page)}><i className="bi bi-arrow-clockwise" /></button>
      </div>

      <div className="cc-panel">
        {loading
          ? <div className="text-center py-4"><span className="spinner-border text-primary" /></div>
          : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead><tr>
                  <th>Disease</th><th>Location</th><th>Status</th><th>AI Correct?</th>
                  <th>Override Disease</th><th>Urgency</th><th>Reviewed At</th><th>Edit</th>
                </tr></thead>
                <tbody>
                  {reviews.length === 0
                    ? <tr><td colSpan={8}><div className="cc-empty"><i className="bi bi-check2-circle" />No reviews yet</div></td></tr>
                    : reviews.map(r => (
                      <tr key={r.id}>
                        <td className="fw-semibold small">{r.disease_detected || '—'}</td>
                        <td className="small text-muted">{r.location_name || '—'}</td>
                        <td><span className={statusClass(r.status)}>{r.status}</span></td>
                        <td className="small">{r.ai_correct || '—'}</td>
                        <td className="small">{r.confirmed_disease || '—'}</td>
                        <td className="small">{r.urgency_level || '—'}</td>
                        <td className="small text-muted">{fmtDate(r.reviewed_at)}</td>
                        <td>
                          <button className="btn btn-sm btn-outline-primary" onClick={() => setReviewId(r.analysis_id)}>
                            <i className="bi bi-pencil" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

        <div className="d-flex justify-content-between align-items-center mt-2">
          <span className="text-muted small">Page {page} — {total} total</span>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
            <button className="btn btn-outline-secondary btn-sm" disabled={page * PER >= total} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </div>
      </div>

      {reviewId && <ReviewModal analysisId={reviewId} onClose={() => setReviewId(null)} onSaved={onReviewDone} />}
    </>
  );
}
