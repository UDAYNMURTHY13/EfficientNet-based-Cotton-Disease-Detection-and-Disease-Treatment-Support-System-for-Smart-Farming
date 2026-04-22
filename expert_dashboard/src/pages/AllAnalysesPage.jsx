import React, { useState, useEffect } from 'react';
import api from '../services/api';
import ReviewModal from '../components/ReviewModal';

function fmtDate(s) { if (!s) return '—'; return new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }

export default function AllAnalysesPage() {
  const [analyses, setAnalyses] = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [reviewed, setReviewed] = useState('');
  const [loading, setLoading]   = useState(false);
  const [reviewId, setReviewId] = useState(null);
  const PER = 15;

  const load = async (pg = page) => {
    setLoading(true);
    try {
      const params = { page: pg, per_page: PER };
      if (reviewed) params.reviewed = reviewed;
      const r = await api.get('/expert/analyses', { params });
      setAnalyses(r.data.analyses); setTotal(r.data.total);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(page); }, [page, reviewed]);

  const onReviewDone = () => { setReviewId(null); load(page); };

  return (
    <>
      <div className="cc-topbar">
        <h4><i className="bi bi-file-earmark-image me-2 text-primary" />All Analyses</h4>
        <div className="d-flex gap-2">
          <select className="form-select form-select-sm" style={{ maxWidth: 160 }} value={reviewed} onChange={e => { setReviewed(e.target.value); setPage(1); }}>
            <option value="">All</option>
            <option value="false">Unreviewed</option>
            <option value="true">Reviewed</option>
          </select>
          <button className="btn btn-brand btn-sm" onClick={() => load(page)}><i className="bi bi-arrow-clockwise" /></button>
        </div>
      </div>

      <div className="cc-panel">
        {loading
          ? <div className="text-center py-4"><span className="spinner-border text-primary" /></div>
          : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead><tr>
                  <th>Image</th><th>Disease</th><th>Severity</th><th>Farmer</th>
                  <th>District</th><th>Reviewed</th><th>Date</th><th>Action</th>
                </tr></thead>
                <tbody>
                  {analyses.length === 0
                    ? <tr><td colSpan={8}><div className="cc-empty"><i className="bi bi-file-earmark-image" />No analyses found</div></td></tr>
                    : analyses.map(a => (
                      <tr key={a.id}>
                        <td>
                          {(a.image_url || a.image_filename)
                            ? <img src={`/uploads/${a.image_url || a.image_filename}`} className="thumb" alt="" />
                            : <span className="text-muted">—</span>}
                        </td>
                        <td className="fw-semibold small">{a.disease_detected || '—'}</td>
                        <td><span className={`role-badge sev-${(a.severity_level || '').toLowerCase()}`}>{a.severity_level || '—'}</span></td>
                        <td className="small">{a.farmer?.name || '—'}</td>
                        <td className="small text-muted">{a.farmer?.district || '—'}</td>
                        <td className="text-center">
                          {a.reviewed
                            ? <span className="badge bg-success small">reviewed</span>
                            : <span className="badge bg-secondary small">pending</span>}
                        </td>
                        <td className="small text-muted">{fmtDate(a.analyzed_at)}</td>
                        <td>
                          <button className="btn btn-sm btn-brand" onClick={() => setReviewId(a.id)}>
                            <i className="bi bi-clipboard2-pulse" />
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
