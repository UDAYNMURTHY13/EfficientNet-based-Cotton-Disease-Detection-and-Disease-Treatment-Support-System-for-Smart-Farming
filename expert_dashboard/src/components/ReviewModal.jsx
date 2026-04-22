import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import api from '../services/api';

// Fix default Leaflet marker icons broken by Vite bundling
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function fmtPct(v) { return v != null ? Math.round(v * 100) + '%' : '—'; }

const AI_CORRECT_OPTS = [
  { v: 'confirmed',  l: 'Confirmed — AI was correct' },
  { v: 'partial',    l: 'Partial — AI partially correct' },
  { v: 'incorrect',  l: 'Incorrect — AI was wrong' },
];
const URGENCY_OPTS = [
  { v: 'routine',   l: 'Routine' },
  { v: 'urgent',    l: 'Urgent (1 week)' },
  { v: 'critical',  l: 'Critical (immediate)' },
];
const STATUS_OPTS = [
  { v: 'approved',         l: 'Approved — treatment recommended' },
  { v: 'needs_attention',  l: 'Needs Attention — follow-up required' },
  { v: 'critical',         l: 'Critical — immediate action' },
];

export default function ReviewModal({ analysisId, onClose, onSaved }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  const [form, setForm] = useState({
    ai_correct: 'confirmed',
    confirmed_disease: '',
    urgency_level: 'routine',
    status: 'approved',
    expert_notes: '',
    treatment_recommendation: '',
    follow_up_date: '',
  });
  const [msgSubject, setMsgSubject] = useState('');
  const [msgBody, setMsgBody]       = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    api.get(`/expert/analyses/${analysisId}`)
      .then(r => {
        setAnalysis(r.data);
        if (r.data.expert_review) {
          const rv = r.data.expert_review;
          setForm({
            ai_correct:               rv.ai_correct || 'confirmed',
            confirmed_disease:        rv.confirmed_disease || '',
            urgency_level:            rv.urgency_level || 'routine',
            status:                   rv.status || 'approved',
            expert_notes:             rv.expert_notes || '',
            treatment_recommendation: rv.treatment_recommendation || '',
            follow_up_date:           rv.follow_up_date ? rv.follow_up_date.slice(0, 10) : '',
          });
        } else {
          // Pre-fill confirmed_disease with AI result
          setForm(f => ({ ...f, confirmed_disease: r.data.disease_detected || '' }));
        }
      })
      .catch(() => setError('Failed to load analysis.'))
      .finally(() => setLoading(false));
  }, [analysisId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError(''); setSuccess('');
    try {
      const payload = { ...form };
      if (!payload.follow_up_date) delete payload.follow_up_date;
      await api.post(`/expert/analyses/${analysisId}/review`, payload);

      if (msgBody.trim()) {
        await api.post('/expert/messages', {
          to_farmer_id: analysis?.farmer?.id,
          analysis_id: analysisId,
          subject: msgSubject || 'Expert Review Feedback',
          message: msgBody,
        });
      }

      setSuccess('Review saved!');
      setTimeout(() => { onSaved?.(); }, 900);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save review');
    } finally {
      setSubmitting(false);
    }
  };

  const ai = analysis;
  const lat = ai?.latitude;
  const lng = ai?.longitude;
  const hasMap = lat && lng;

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,.55)', zIndex: 1500 }}>
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
        <div className="modal-content" style={{ minHeight: '80vh' }}>
          {/* Header */}
          <div className="modal-header" style={{ background: '#e3f2fd', borderBottom: '2px solid #90caf9' }}>
            <h5 className="modal-title text-primary fw-bold">
              <i className="bi bi-clipboard2-pulse-fill me-2" />Expert Review
              {ai && <span className="text-muted fw-normal ms-2 small">— {ai.disease_detected || 'Unknown Disease'}</span>}
            </h5>
            <button className="btn-close" onClick={onClose} />
          </div>

          <div className="modal-body p-0">
            {loading ? (
              <div className="text-center py-5"><span className="spinner-border text-primary" style={{ width: 40, height: 40 }} /></div>
            ) : !ai ? (
              <div className="p-4 text-danger">{error || 'Analysis not found.'}</div>
            ) : (
              <div className="row g-0" style={{ minHeight: '70vh' }}>
                {/* LEFT PANEL — image, map, farmer */}
                <div className="col-md-4" style={{ borderRight: '1px solid #e3e7f0', background: '#f9fafb' }}>
                  <div className="p-3">
                    {/* Leaf image */}
                    {(ai.image_url || ai.image_filename) && (
                      <img src={`/uploads/${ai.image_url || ai.image_filename}`} alt="Leaf" style={{ width: '100%', borderRadius: 10, objectFit: 'cover', maxHeight: 220 }} />
                    )}

                    {/* Leaflet Map */}
                    {hasMap && (
                      <div className="mt-3">
                        <div className="small fw-semibold mb-1 text-muted"><i className="bi bi-geo-alt-fill me-1 text-danger" />Farm Location</div>
                        <MapContainer center={[lat, lng]} zoom={13} style={{ height: 180, borderRadius: 8 }} scrollWheelZoom={false}>
                          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                          <Marker position={[lat, lng]} />
                        </MapContainer>
                        <div className="text-muted small mt-1">
                          {lat.toFixed(5)}, {lng.toFixed(5)}
                          {ai.accuracy && <span className="ms-2">±{Math.round(ai.accuracy)}m</span>}
                        </div>
                      </div>
                    )}

                    {/* Farmer Info */}
                    <div className="mt-3">
                      <div className="small fw-semibold mb-1 text-muted"><i className="bi bi-person-fill me-1" />Farmer</div>
                      <div className="small">
                        <div className="fw-semibold">{ai.farmer?.name || '—'}</div>
                        <div className="text-muted">{ai.farmer?.email || ''}</div>
                        <div className="text-muted">{ai.farmer?.phone || ''}</div>
                        <div className="text-muted">{ai.farmer?.district || ''}</div>
                      </div>
                    </div>

                    {/* Coords text fallback */}
                    {ai.location_name && (
                      <div className="mt-2 small text-muted">
                        <i className="bi bi-pin-map me-1" />{ai.location_name}
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT PANEL — AI output + review form */}
                <div className="col-md-8">
                  <form onSubmit={handleSubmit}>
                    <div className="p-3">
                      {/* AI Output Block */}
                      <div className="ai-block mb-3">
                        <div className="small fw-semibold mb-2 text-primary"><i className="bi bi-robot me-1" />AI Analysis Output</div>
                        <div className="row g-2">
                          <div className="col-sm-4">
                            <div className="small text-muted">Disease</div>
                            <div className="fw-bold">{ai.disease_detected || '—'}</div>
                          </div>
                          <div className="col-sm-4">
                            <div className="small text-muted">Confidence</div>
                            <div className="fw-bold">{fmtPct(ai.confidence)}</div>
                          </div>
                          <div className="col-sm-4">
                            <div className="small text-muted">Severity</div>
                            <div className={`fw-bold sev-text-${(ai.severity_level || '').toLowerCase()}`}>{ai.severity_level || '—'}</div>
                          </div>
                          {ai.affected_area_pct != null && (
                            <div className="col-sm-4">
                              <div className="small text-muted">Affected Area</div>
                              <div className="fw-bold">{ai.affected_area_pct}%</div>
                            </div>
                          )}
                          {ai.reasoning && (
                            <div className="col-12">
                              <div className="small text-muted">Reasoning</div>
                              <div className="small">{ai.reasoning}</div>
                            </div>
                          )}
                          {ai.recommendation && (
                            <div className="col-12">
                              <div className="small text-muted">AI Recommendation</div>
                              <div className="small">{ai.recommendation}</div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Review Verdict Form */}
                      <div className="farmer-block mb-3">
                        <div className="small fw-semibold mb-2 text-dark"><i className="bi bi-journal-check me-1" />Expert Verdict</div>
                        <div className="row g-2">
                          <div className="col-md-6">
                            <label className="form-label small fw-semibold">AI Correct?</label>
                            <select className="form-select form-select-sm" value={form.ai_correct} onChange={e => set('ai_correct', e.target.value)}>
                              {AI_CORRECT_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                            </select>
                          </div>
                          <div className="col-md-6">
                            <label className="form-label small fw-semibold">Confirmed Disease</label>
                            <input className="form-control form-control-sm" value={form.confirmed_disease} onChange={e => set('confirmed_disease', e.target.value)} placeholder="Override AI if needed" />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label small fw-semibold">Urgency Level</label>
                            <select className="form-select form-select-sm" value={form.urgency_level} onChange={e => set('urgency_level', e.target.value)}>
                              {URGENCY_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                            </select>
                          </div>
                          <div className="col-md-6">
                            <label className="form-label small fw-semibold">Review Status <span className="text-danger">*</span></label>
                            <select className="form-select form-select-sm" value={form.status} onChange={e => set('status', e.target.value)} required>
                              {STATUS_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                            </select>
                          </div>
                          <div className="col-12">
                            <label className="form-label small fw-semibold">Expert Notes</label>
                            <textarea className="form-control form-control-sm" rows={3} value={form.expert_notes} onChange={e => set('expert_notes', e.target.value)} placeholder="Observations, field context, corrections…" />
                          </div>
                          <div className="col-12">
                            <label className="form-label small fw-semibold">Treatment Recommendation</label>
                            <textarea className="form-control form-control-sm" rows={3} value={form.treatment_recommendation} onChange={e => set('treatment_recommendation', e.target.value)} placeholder="Recommended treatment / pesticide / action plan…" />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label small fw-semibold">Follow-up Date</label>
                            <input type="date" className="form-control form-control-sm" value={form.follow_up_date} onChange={e => set('follow_up_date', e.target.value)} />
                          </div>
                        </div>
                      </div>

                      {/* Message to Farmer */}
                      <div className="farmer-block mb-3">
                        <div className="small fw-semibold mb-2 text-dark"><i className="bi bi-envelope-fill me-1" />Message to Farmer <span className="text-muted fw-normal">(optional)</span></div>
                        <div className="row g-2">
                          <div className="col-12">
                            <input className="form-control form-control-sm" placeholder="Subject" value={msgSubject} onChange={e => setMsgSubject(e.target.value)} />
                          </div>
                          <div className="col-12">
                            <textarea className="form-control form-control-sm" rows={3} placeholder="Write a message to the farmer about this analysis…" value={msgBody} onChange={e => setMsgBody(e.target.value)} />
                          </div>
                        </div>
                      </div>

                      {error   && <div className="alert alert-danger py-2 small">{error}</div>}
                      {success && <div className="alert alert-success py-2 small">{success}</div>}
                    </div>

                    <div className="modal-footer">
                      <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
                      <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                        {submitting && <span className="spinner-border spinner-border-sm me-1" />}
                        Save Review
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
