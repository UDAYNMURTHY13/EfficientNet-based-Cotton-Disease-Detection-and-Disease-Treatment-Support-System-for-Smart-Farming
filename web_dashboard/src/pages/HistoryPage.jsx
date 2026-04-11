import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import APIService from '../services/api';
import '../styles/history.css';

const SEV_ORDER = ['Healthy', 'Mild', 'Moderate', 'Severe', 'Critical'];

const SEV_COLOR = {
  Healthy: '#22c55e', None: '#22c55e',
  Mild: '#84cc16', Moderate: '#f59e0b',
  Severe: '#ef4444', Critical: '#7f1d1d',
};

function LocationLabel({ lat, lon, name }) {
  if (!lat && !name) return <span className="hist-na">—</span>;
  return (
    <span className="hist-location">
      {name && <strong>{name}</strong>}
      {name && ' '}
      {lat != null && (
        <span className="hist-coords">
          {Number(lat).toFixed(4)}, {Number(lon).toFixed(4)}
        </span>
      )}
    </span>
  );
}

function IndicatorBar({ label, value, max = 4, color }) {
  if (value == null) return null;
  return (
    <div className="ind-row">
      <span className="ind-label">{label}</span>
      <div className="ind-track">
        <div className="ind-fill" style={{ width: `${(value / max) * 100}%`, background: color }} />
      </div>
      <span className="ind-val">{value}/{max}</span>
    </div>
  );
}

function HistoryPage() {
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('');
  const [expanded, setExpanded] = useState(null); // id of expanded row

  useEffect(() => { loadHistory(); }, [page]);

  const loadHistory = async () => {
    setLoading(true);
    setExpanded(null);
    try {
      const data = await APIService.getAnalysisHistory(page, 10);
      setAnalyses(data.items || []);
      setTotal(data.total || 0);
    } catch {
      setError('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this analysis?')) return;
    try {
      await APIService.deleteAnalysis(id);
      loadHistory();
    } catch {
      setError('Failed to delete');
    }
  };

  const toggleExpand = (id) => setExpanded(prev => prev === id ? null : id);

  const filtered = filter
    ? analyses.filter(a => a.severity_level === filter || (filter === 'Healthy' && a.severity_level === 'None'))
    : analyses;

  const totalPages = Math.ceil(total / 10);

  return (
    <div className="history-page">
      <div className="page-header">
        <div>
          <h1>Analysis History</h1>
          <p>{total} total analyses on record</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/analyze')}>
          + New Analysis
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Filter bar */}
      <div className="history-filters">
        <span className="filter-label">Filter by severity:</span>
        {['', ...SEV_ORDER].map(s => (
          <button key={s || 'all'}
            className={`filter-chip ${filter === s ? 'active' : ''}`}
            onClick={() => setFilter(s)}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-placeholder">
          <div className="spinner-dark" /> Loading history…
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No analyses found</h3>
          <p>{filter ? `No ${filter} severity results` : 'Start your first analysis to see results here'}</p>
          {!filter && (
            <button className="btn btn-primary" onClick={() => navigate('/analyze')}>
              Start Analysis
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="history-table">
            {/* Header */}
            <div className="ht-head">
              <span>Disease</span>
              <span>Severity</span>
              <span>Confidence</span>
              <span>Affected Area</span>
              <span>Location</span>
              <span>Date</span>
              <span>Actions</span>
            </div>

            {filtered.map((a) => {
              const isExp = expanded === a.id;
              const sevColor = SEV_COLOR[a.severity_level] || '#94a3b8';
              const confPct = a.confidence_percentage != null
                ? Number(a.confidence_percentage).toFixed(1) + '%'
                : a.confidence != null
                  ? (Number(a.confidence) * 100).toFixed(1) + '%'
                  : '—';
              const areaVal = a.affected_area_percentage != null
                ? Number(a.affected_area_percentage).toFixed(1) + '%'
                : '—';
              const indicators = a.indicators || {};
              const isHealthy = a.disease_detected === 'Healthy' || a.severity_level === 'None';

              return (
                <React.Fragment key={a.id}>
                  {/* Summary row */}
                  <div
                    className={`ht-row ${isExp ? 'ht-row-expanded' : ''}`}
                    onClick={() => toggleExpand(a.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <span className="ht-disease">{a.disease_detected}</span>
                    <span>
                      <span className={`badge badge-${a.severity_level}`}>{a.severity_level || '—'}</span>
                    </span>
                    <span className="ht-conf">{confPct}</span>
                    <span className="ht-area">{isHealthy ? '—' : areaVal}</span>
                    <span className="ht-loc-cell">
                      <LocationLabel
                        lat={a.latitude} lon={a.longitude}
                        name={a.environment_conditions}
                      />
                    </span>
                    <span className="ht-date">
                      {new Date(a.analyzed_at).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })}
                    </span>
                    <span className="ht-actions" onClick={e => e.stopPropagation()}>
                      <button className="icon-btn" title={isExp ? 'Collapse' : 'View details'}
                        onClick={() => toggleExpand(a.id)}>
                        {isExp ? '▲' : '▼'}
                      </button>
                      <button className="icon-btn icon-btn-danger" onClick={() => handleDelete(a.id)} title="Delete">
                        🗑️
                      </button>
                    </span>
                  </div>

                  {/* Expanded detail panel */}
                  {isExp && (
                    <div className="ht-detail">
                      <div className="htd-grid">

                        {/* Detection */}
                        <div className="htd-section">
                          <div className="htd-section-title">🎯 Detection</div>
                          <div className="htd-field"><span>Disease</span><strong>{a.disease_detected}</strong></div>
                          <div className="htd-field"><span>Confidence</span><strong>{confPct}</strong></div>
                          <div className="htd-field">
                            <span>Severity</span>
                            <strong style={{ color: sevColor }}>{a.severity_level}</strong>
                          </div>
                          {a.severity_score != null && (
                            <div className="htd-field">
                              <span>Severity Score</span>
                              <strong>{Number(a.severity_score).toFixed(2)} / 4.0</strong>
                            </div>
                          )}
                          {a.inference_time != null && (
                            <div className="htd-field">
                              <span>Inference Time</span>
                              <strong>{Number(a.inference_time).toFixed(2)}s</strong>
                            </div>
                          )}
                        </div>

                        {/* Area & Lesions */}
                        <div className="htd-section">
                          <div className="htd-section-title">🍃 Area &amp; Lesions</div>
                          <div className="htd-field">
                            <span>Affected Area</span>
                            <strong>{isHealthy ? '—' : areaVal}</strong>
                          </div>
                          <div className="htd-field">
                            <span>Lesion Count</span>
                            <strong>{isHealthy ? '—' : (a.lesion_count ?? '—')}</strong>
                          </div>
                          {!isHealthy && Object.keys(indicators).length > 0 && (
                            <div className="htd-indicators">
                              <div className="htd-ind-title">Severity Indicators</div>
                              <IndicatorBar label="Confidence" value={indicators.confidence} color={sevColor} />
                              <IndicatorBar label="Area" value={indicators.area} color={sevColor} />
                              <IndicatorBar label="Lesions" value={indicators.lesions} color={sevColor} />
                            </div>
                          )}
                        </div>

                        {/* Location */}
                        <div className="htd-section">
                          <div className="htd-section-title">📍 Location</div>
                          {a.environment_conditions ? (
                            <div className="htd-field">
                              <span>Place</span>
                              <strong>{a.environment_conditions}</strong>
                            </div>
                          ) : null}
                          {a.latitude != null ? (
                            <>
                              <div className="htd-field">
                                <span>Latitude</span>
                                <strong>{Number(a.latitude).toFixed(6)}</strong>
                              </div>
                              <div className="htd-field">
                                <span>Longitude</span>
                                <strong>{Number(a.longitude).toFixed(6)}</strong>
                              </div>
                              {a.location_accuracy != null && (
                                <div className="htd-field">
                                  <span>Accuracy</span>
                                  <strong>±{Math.round(a.location_accuracy)}m</strong>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="htd-field"><span>GPS</span><span className="hist-na">Not recorded</span></div>
                          )}
                          <div className="htd-field">
                            <span>Image</span>
                            <span className="htd-filename" title={a.image_filename}>{a.image_filename}</span>
                          </div>
                          <div className="htd-field">
                            <span>Analyzed</span>
                            <strong>{new Date(a.analyzed_at).toLocaleString('en-IN')}</strong>
                          </div>
                        </div>

                        {/* Reasoning */}
                        {(a.reasoning || a.recommendation) && (
                          <div className="htd-section htd-reasoning">
                            <div className="htd-section-title">💡 Analysis Notes</div>
                            {a.recommendation && (
                              <div className="htd-note htd-note-rec">{a.recommendation}</div>
                            )}
                            {a.reasoning && (
                              <div className="htd-note">{a.reasoning}</div>
                            )}
                          </div>
                        )}

                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button className="btn btn-ghost btn-sm" disabled={page === 1}
                onClick={() => setPage(p => p - 1)}>← Prev</button>
              <span className="page-info">Page {page} of {totalPages}</span>
              <button className="btn btn-ghost btn-sm" disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default HistoryPage;


const SEV_ORDER = ['Healthy', 'Mild', 'Moderate', 'Severe', 'Critical'];

function HistoryPage() {
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('');

  useEffect(() => { loadHistory(); }, [page]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await APIService.getAnalysisHistory(page, 10);
      setAnalyses(data.items || []);
      setTotal(data.total || 0);
    } catch {
      setError('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this analysis?')) return;
    try {
      await APIService.deleteAnalysis(id);
      loadHistory();
    } catch {
      setError('Failed to delete');
    }
  };

  const filtered = filter
    ? analyses.filter(a => a.severity_level === filter)
    : analyses;

  const totalPages = Math.ceil(total / 10);

  return (
    <div className="history-page">
      <div className="page-header">
        <div>
          <h1>Analysis History</h1>
          <p>{total} total analyses on record</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/analyze')}>
          + New Analysis
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Filter bar */}
      <div className="history-filters">
        <span className="filter-label">Filter by severity:</span>
        {['', ...SEV_ORDER].map(s => (
          <button key={s || 'all'}
            className={`filter-chip ${filter === s ? 'active' : ''}`}
            onClick={() => setFilter(s)}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-placeholder">
          <div className="spinner-dark" /> Loading history…
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No analyses found</h3>
          <p>{filter ? `No ${filter} severity results` : 'Start your first analysis to see results here'}</p>
          {!filter && (
            <button className="btn btn-primary" onClick={() => navigate('/analyze')}>
              Start Analysis
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="history-table">
            <div className="ht-head">
              <span>Disease</span>
              <span>Severity</span>
              <span>Confidence</span>
              <span>Date</span>
              <span>Image</span>
              <span>Actions</span>
            </div>

            {filtered.map((a) => (
              <div key={a.id} className="ht-row">
                <span className="ht-disease">{a.disease_detected}</span>
                <span>
                  <span className={`badge badge-${a.severity_level}`}>{a.severity_level}</span>
                </span>
                <span className="ht-conf">
                  {a.confidence_score ? `${(a.confidence_score * 100).toFixed(1)}%` : '—'}
                </span>
                <span className="ht-date">
                  {new Date(a.analyzed_at).toLocaleDateString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric'
                  })}
                </span>
                <span className="ht-file" title={a.image_filename}>
                  {a.image_filename?.length > 16 ? a.image_filename.slice(0, 14) + '…' : a.image_filename}
                </span>
                <span className="ht-actions">
                  <button className="icon-btn" onClick={() => handleDelete(a.id)} title="Delete">
                    🗑️
                  </button>
                </span>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button className="btn btn-ghost btn-sm" disabled={page === 1}
                onClick={() => setPage(p => p - 1)}>← Prev</button>
              <span className="page-info">Page {page} of {totalPages}</span>
              <button className="btn btn-ghost btn-sm" disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default HistoryPage;