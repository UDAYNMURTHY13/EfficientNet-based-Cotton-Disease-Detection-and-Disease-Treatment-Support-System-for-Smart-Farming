import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';

function fmtDate(s) { if (!s) return '—'; return new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
function fmtPct(v) { return v != null ? Math.round(Number(v) * 100) + '%' : '—'; }

function DetailModal({ analysisId, onClose }) {
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.get(`/admin/analyses/${analysisId}`)
      .then(r => setD(r.data))
      .catch(() => setErr('Failed to load details.'));
  }, [analysisId]);

  const rv = d?.expert_review;
  const statusColor = rv?.status === 'critical' ? '#ef4444' : rv?.status === 'needs_attention' ? '#f59e0b' : '#16a34a';

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,.6)', zIndex: 1600 }} onClick={onClose}>
      <div className="modal-dialog modal-xl modal-dialog-scrollable" onClick={e => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header" style={{ background: '#f0fdf4', borderBottom: '2px solid #86efac' }}>
            <h5 className="modal-title fw-bold text-success">
              <i className="bi bi-search me-2" />Analysis Detail
              {d && <span className="text-muted fw-normal ms-2 small">— {d.disease_detected || 'Unknown'}</span>}
            </h5>
            <button className="btn-close" onClick={onClose} />
          </div>

          <div className="modal-body p-0">
            {err ? (
              <div className="p-4 text-danger">{err}</div>
            ) : !d ? (
              <div className="text-center py-5"><span className="spinner-border text-success" /></div>
            ) : (
              <div className="row g-0">
                {/* LEFT — image + farmer */}
                <div className="col-md-3" style={{ borderRight: '1px solid #e3e7f0', background: '#f9fafb', padding: '16px' }}>
                  {d.image_url && (
                    <img src={`/uploads/${d.image_url}`} alt="Leaf"
                      style={{ width: '100%', borderRadius: 8, objectFit: 'cover', maxHeight: 200, marginBottom: 12 }} />
                  )}
                  <div className="small fw-semibold text-muted mb-1"><i className="bi bi-person-fill me-1" />Farmer</div>
                  <div className="small fw-bold">{d.farmer?.name || '—'}</div>
                  {d.farmer?.email && <div className="small text-muted">{d.farmer.email}</div>}
                  {d.farmer?.phone && <div className="small text-muted">{d.farmer.phone}</div>}
                  {d.farmer?.district && <div className="small text-muted">{d.farmer.district}, {d.farmer.state}</div>}
                  {d.farmer?.village_town && <div className="small text-muted">{d.farmer.village_town}</div>}
                  {d.farmer?.farm_name && <div className="small text-muted mt-1">🌾 {d.farmer.farm_name} ({d.farmer.total_land_acres} acres)</div>}
                  {d.location_name && (
                    <div className="small text-muted mt-2"><i className="bi bi-geo-alt-fill me-1 text-danger" />{d.location_name}</div>
                  )}
                  <div className="small text-muted mt-1">📅 {fmtDate(d.analyzed_at)}</div>
                </div>

                {/* MIDDLE — AI output */}
                <div className="col-md-4" style={{ borderRight: '1px solid #e3e7f0', padding: '16px' }}>
                  <div className="small fw-semibold text-primary mb-2"><i className="bi bi-robot me-1" />AI Analysis</div>

                  <div className="mb-2">
                    <div className="small text-muted">Disease Detected</div>
                    <div className="fw-bold fs-6">{d.disease_detected || '—'}</div>
                  </div>
                  <div className="row g-2 mb-2">
                    <div className="col-6">
                      <div className="small text-muted">Confidence</div>
                      <div className="fw-semibold">{fmtPct(d.confidence)}</div>
                    </div>
                    <div className="col-6">
                      <div className="small text-muted">Severity</div>
                      <span className={`role-badge sev-${(d.severity_level || '').toLowerCase()}`}>{d.severity_level || '—'}</span>
                    </div>
                    <div className="col-6">
                      <div className="small text-muted">Severity Score</div>
                      <div className="fw-semibold">{d.severity_score != null ? `${Number(d.severity_score).toFixed(2)} / 4.0` : '—'}</div>
                    </div>
                    <div className="col-6">
                      <div className="small text-muted">Affected Area</div>
                      <div className="fw-semibold">{d.affected_area_percentage != null ? `${Number(d.affected_area_percentage).toFixed(1)}%` : '—'}</div>
                    </div>
                    <div className="col-6">
                      <div className="small text-muted">Lesion Count</div>
                      <div className="fw-semibold">{d.lesion_count ?? '—'}</div>
                    </div>
                  </div>

                  {d.reasoning && (
                    <div className="mb-2">
                      <div className="small text-muted fw-semibold">Reasoning</div>
                      <div className="small p-2" style={{ background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>{d.reasoning}</div>
                    </div>
                  )}
                  {d.recommendation && (
                    <div className="mb-2">
                      <div className="small text-muted fw-semibold">AI Recommendation</div>
                      <div className="small p-2" style={{ background: '#eff6ff', borderRadius: 6, border: '1px solid #bfdbfe' }}>{d.recommendation}</div>
                    </div>
                  )}
                </div>

                {/* RIGHT — Expert review */}
                <div className="col-md-5" style={{ padding: '16px' }}>
                  <div className="small fw-semibold mb-2" style={{ color: '#7c3aed' }}><i className="bi bi-person-badge-fill me-1" />Expert Review</div>
                  {!rv ? (
                    <div className="text-center py-4 text-muted">
                      <i className="bi bi-clock fs-2 d-block mb-2" />
                      <div className="small">No expert review yet</div>
                    </div>
                  ) : (
                    <>
                      <div className="mb-3 p-2 rounded" style={{ background: '#faf5ff', border: '1px solid #e9d5ff' }}>
                        <div className="d-flex gap-3 flex-wrap">
                          <div>
                            <div className="small text-muted">Status</div>
                            <strong style={{ color: statusColor }}>
                              {rv.status === 'approved' ? '✅ Approved' : rv.status === 'needs_attention' ? '⚠️ Needs Attention' : '🚨 Critical'}
                            </strong>
                          </div>
                          <div>
                            <div className="small text-muted">AI Correct?</div>
                            <div className="fw-semibold small" style={{ textTransform: 'capitalize' }}>{rv.ai_correct || '—'}</div>
                          </div>
                          <div>
                            <div className="small text-muted">Urgency</div>
                            <div className="fw-semibold small" style={{ textTransform: 'capitalize' }}>{rv.urgency_level || '—'}</div>
                          </div>
                        </div>
                      </div>

                      {rv.confirmed_disease && rv.ai_correct !== 'confirmed' && (
                        <div className="mb-2">
                          <div className="small text-muted fw-semibold">Corrected Disease</div>
                          <div className="fw-bold text-danger">{rv.confirmed_disease}</div>
                        </div>
                      )}

                      {rv.expert_notes && (
                        <div className="mb-2">
                          <div className="small text-muted fw-semibold">Expert Notes</div>
                          <div className="small p-2" style={{ background: '#f5f3ff', borderRadius: 6, border: '1px solid #ddd6fe' }}>{rv.expert_notes}</div>
                        </div>
                      )}

                      {rv.treatment_recommendation && (
                        <div className="mb-2">
                          <div className="small text-muted fw-semibold">Treatment Recommendation</div>
                          <div className="small p-2" style={{ background: '#f0fdf4', borderRadius: 6, border: '1px solid #bbf7d0' }}>{rv.treatment_recommendation}</div>
                        </div>
                      )}

                      <div className="row g-2 small mt-1">
                        {rv.follow_up_date && (
                          <div className="col-12">
                            <span className="text-muted">Follow-up Date: </span>
                            <strong>{new Date(rv.follow_up_date).toLocaleDateString()}</strong>
                          </div>
                        )}
                        <div className="col-12 text-muted">
                          Reviewed by <strong>{rv.expert_name}</strong>
                          {rv.expert_email && <span> ({rv.expert_email})</span>}
                        </div>
                        <div className="col-12 text-muted">Reviewed on: {new Date(rv.reviewed_at).toLocaleString()}</div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer py-2">
            <button className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AnalysesPage() {
  const [analyses, setAnalyses] = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [disease, setDisease]   = useState('');
  const [severity, setSeverity] = useState('');
  const [loading, setLoading]   = useState(false);
  const [preview, setPreview]   = useState(null);
  const [detailId, setDetailId] = useState(null);
  const debounceRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // Auto-open detail modal when ?id= is in URL (e.g. from ReviewsPage button)
  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      setDetailId(id);
      setSearchParams({}, { replace: true }); // clean URL after opening
    }
  }, []);  // eslint-disable-line
  const PER = 20;

  const load = useCallback(async (pg = page) => {
    setLoading(true);
    try {
      const params = { page: pg, per_page: PER };
      if (disease)  params.disease = disease;
      if (severity) params.severity = severity;
      const r = await api.get('/admin/analyses', { params });
      setAnalyses(r.data.analyses); setTotal(r.data.total);
    } finally { setLoading(false); }
  }, [page, disease, severity]);

  useEffect(() => { load(page); }, [page, severity]);

  const handleDiseaseChange = (v) => {
    setDisease(v);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setPage(1); load(1); }, 350);
  };

  const deleteAnalysis = async (id) => {
    if (!confirm('Permanently delete this analysis?')) return;
    await api.delete(`/admin/analyses/${id}`);
    load(page);
  };

  return (
    <>
      <div className="cc-topbar">
        <h4><i className="bi bi-file-earmark-image-fill me-2 text-success" />All Analyses</h4>
      </div>

      <div className="cc-panel">
        <div className="d-flex flex-wrap gap-2 mb-3">
          <input className="form-control" style={{ maxWidth: 240 }} placeholder="Filter by disease…"
            value={disease} onChange={e => handleDiseaseChange(e.target.value)} />
          <select className="form-select" style={{ maxWidth: 160 }} value={severity} onChange={e => { setSeverity(e.target.value); setPage(1); }}>
            <option value="">All Severities</option>
            {['Healthy','Mild','Moderate','Severe','Critical'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="btn btn-brand btn-sm ms-auto" onClick={() => load(page)}>
            <i className="bi bi-arrow-clockwise me-1" />Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-center py-4"><span className="spinner-border text-success" /></div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover">
              <thead><tr>
                <th>Image</th><th>Disease</th><th>Confidence</th><th>Severity</th>
                <th>Farmer</th><th>Location</th><th>Reviewed</th><th>Date</th><th>Actions</th>
              </tr></thead>
              <tbody>
                {analyses.length === 0
                  ? <tr><td colSpan={9}><div className="cc-empty"><i className="bi bi-file-earmark-image" />No analyses found</div></td></tr>
                  : analyses.map(a => (
                    <tr key={a.id} style={{ cursor: 'pointer' }} onClick={() => setDetailId(a.id)}>
                      <td onClick={e => e.stopPropagation()}>
                        {a.image_filename
                          ? <img src={`/uploads/${a.image_url || a.image_filename}`} className="thumb" onClick={() => setPreview(a.image_url || a.image_filename)} alt="" />
                          : <span className="text-muted small">—</span>}
                      </td>
                      <td className="fw-semibold small">{a.disease_detected || '—'}</td>
                      <td className="small">{a.confidence ? Math.round(a.confidence * 100) + '%' : '—'}</td>
                      <td><span className={`role-badge sev-${(a.severity_level || '').toLowerCase()}`}>{a.severity_level || '—'}</span></td>
                      <td className="small">{a.farmer_name || '—'}</td>
                      <td className="small text-muted">{a.location_name || '—'}</td>
                      <td className="text-center">
                        {a.reviewed
                          ? <i className="bi bi-check-circle-fill text-success" />
                          : <i className="bi bi-clock text-muted" />}
                      </td>
                      <td className="small text-muted">{fmtDate(a.analyzed_at)}</td>
                      <td onClick={e => e.stopPropagation()}>
                        <div className="d-flex gap-1">
                          <button className="btn btn-sm btn-outline-primary" title="View full detail" onClick={() => setDetailId(a.id)}>
                            <i className="bi bi-eye" />
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => deleteAnalysis(a.id)}>
                            <i className="bi bi-trash" />
                          </button>
                        </div>
                      </td>
                    </tr>
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

      {/* Image preview modal */}
      {preview && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,.6)' }} onClick={() => setPreview(null)}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header py-2">
                <button className="btn-close ms-auto" onClick={() => setPreview(null)} />
              </div>
              <div className="modal-body p-2 text-center">
                <img src={`/uploads/${preview}`} style={{ maxWidth: '100%', borderRadius: 8 }} alt="leaf" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full detail modal */}
      {detailId && <DetailModal analysisId={detailId} onClose={() => setDetailId(null)} />}
    </>
  );
}
