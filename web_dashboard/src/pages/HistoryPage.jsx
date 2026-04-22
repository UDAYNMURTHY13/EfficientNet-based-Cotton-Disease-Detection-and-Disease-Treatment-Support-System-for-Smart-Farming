import React, { useState, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';

import { useTranslation } from 'react-i18next';

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

      {name && lat != null && ' '}

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

  const { t } = useTranslation();

  const [analyses, setAnalyses] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');

  const [page, setPage] = useState(1);

  const [total, setTotal] = useState(0);

  const [filter, setFilter] = useState('');

  const [expanded, setExpanded] = useState(null);



  useEffect(() => { loadHistory(); }, [page]);



  const loadHistory = async () => {

    setLoading(true);

    setExpanded(null);

    try {

      const data = await APIService.getAnalysisHistory(page, 10);

      setAnalyses(data.items || []);

      setTotal(data.total || 0);

    } catch {

      setError(t('history.load_failed'));

    } finally {

      setLoading(false);

    }

  };



  const handleDelete = async (id) => {

    if (!window.confirm(t('history.delete_confirm'))) return;

    try {

      await APIService.deleteAnalysis(id);

      loadHistory();

    } catch {

      setError(t('history.delete_failed'));

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

          <h1>{t('history.title')}</h1>

          <p>{t('history.total_record', { count: total })}</p>

        </div>

        <button className="btn btn-primary btn-sm" onClick={() => navigate('/analyze')}>

          {t('history.new_analysis')}

        </button>

      </div>



      {error && <div className="alert alert-error">{error}</div>}



      {/* Filter bar */}

      <div className="history-filters">

        <span className="filter-label">{t('history.filter_severity')}</span>

        {['', ...SEV_ORDER].map(s => (

          <button key={s || 'all'}

            className={`filter-chip ${filter === s ? 'active' : ''}`}

            onClick={() => setFilter(s)}>

            {s || t('history.all')}

          </button>

        ))}

      </div>



      {loading ? (

        <div className="loading-placeholder">

          <div className="spinner-dark" /> {t('history.loading')}

        </div>

      ) : filtered.length === 0 ? (

        <div className="empty-state">

          <div className="empty-icon">📭</div>

          <h3>{t('history.no_analyses')}</h3>

          <p>{filter ? t('history.filter_desc', { filter }) : t('history.no_filter_desc')}</p>

          {!filter && (

            <button className="btn btn-primary" onClick={() => navigate('/analyze')}>

              {t('history.start_analysis')}

            </button>

          )}

        </div>

      ) : (

        <>

          <div className="history-table">

            {/* Header */}

            <div className="ht-head">

              <span>{t('history.disease')}</span>

              <span>{t('history.severity')}</span>

              <span>{t('history.confidence')}</span>

              <span>{t('history.affected_area')}</span>

              <span>{t('history.location')}</span>

              <span>{t('history.date')}</span>

              <span>{t('history.actions')}</span>

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

                        name={a.location_name || a.environment_conditions}

                      />

                    </span>

                    <span className="ht-date">

                      {new Date(a.analyzed_at).toLocaleDateString('en-IN', {

                        day: '2-digit', month: 'short', year: 'numeric'

                      })}

                    </span>

                    <span className="ht-actions" onClick={e => e.stopPropagation()}>

                      <button className="icon-btn" title={isExp ? t('history.collapse') : t('history.view_details')}

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

                          <div className="htd-section-title">🎯 {t('history.detection')}</div>

                          <div className="htd-field"><span>{t('history.disease_label')}</span><strong>{a.disease_detected}</strong></div>

                          <div className="htd-field"><span>{t('history.confidence')}</span><strong>{confPct}</strong></div>

                          <div className="htd-field">

                            <span>{t('history.severity_label')}</span>

                            <strong style={{ color: sevColor }}>{a.severity_level}</strong>

                          </div>

                          {a.severity_score != null && (

                            <div className="htd-field">

                              <span>{t('history.severity_score')}</span>

                              <strong>{Number(a.severity_score).toFixed(2)} / 4.0</strong>

                            </div>

                          )}

                          {a.inference_time != null && (

                            <div className="htd-field">

                              <span>{t('history.inference_time')}</span>

                              <strong>{Number(a.inference_time).toFixed(2)}s</strong>

                            </div>

                          )}

                        </div>



                        {/* Area & Lesions */}

                        <div className="htd-section">

                          <div className="htd-section-title">🍃 {t('history.area_lesions')}</div>

                          <div className="htd-field">

                            <span>{t('history.affected_area_label')}</span>

                            <strong>{isHealthy ? '—' : areaVal}</strong>

                          </div>

                          <div className="htd-field">

                            <span>{t('history.lesion_count')}</span>

                            <strong>{isHealthy ? '—' : (a.lesion_count ?? '—')}</strong>

                          </div>

                          {!isHealthy && Object.keys(indicators).length > 0 && (

                            <div className="htd-indicators">

                              <div className="htd-ind-title">{t('history.severity_indicators')}</div>

                              <IndicatorBar label={t('history.confidence')} value={indicators.confidence} color={sevColor} />

                              <IndicatorBar label={t('history.affected_area_label')} value={indicators.area} color={sevColor} />

                              <IndicatorBar label={t('history.lesion_count')} value={indicators.lesions} color={sevColor} />

                            </div>

                          )}

                        </div>



                        {/* Location */}

                        <div className="htd-section">

                          <div className="htd-section-title">📍 {t('history.location')}</div>

                          {(a.location_name || a.environment_conditions) ? (

                            <div className="htd-field">

                              <span>{t('history.place')}</span>

                              <strong>{a.location_name || a.environment_conditions}</strong>

                            </div>

                          ) : null}

                          {a.latitude != null ? (

                            <>

                              <div className="htd-field">

                                <span>{t('history.latitude')}</span>

                                <strong>{Number(a.latitude).toFixed(6)}</strong>

                              </div>

                              <div className="htd-field">

                                <span>{t('history.longitude')}</span>

                                <strong>{Number(a.longitude).toFixed(6)}</strong>

                              </div>

                              {a.location_accuracy != null && (

                                <div className="htd-field">

                                  <span>{t('history.accuracy')}</span>

                                  <strong>±{Math.round(a.location_accuracy)}m</strong>

                                </div>

                              )}

                            </>

                          ) : (

                            <div className="htd-field"><span>{t('history.gps')}</span><span className="hist-na">{t('history.not_recorded')}</span></div>

                          )}

                          <div className="htd-field">

                            <span>{t('history.image')}</span>

                            <span className="htd-filename" title={a.image_filename}>{a.image_filename}</span>

                          </div>

                          <div className="htd-field">

                            <span>{t('history.analyzed')}</span>

                            <strong>{new Date(a.analyzed_at).toLocaleString()}</strong>

                          </div>

                        </div>



                        {/* Reasoning */}

                        {(a.reasoning || a.recommendation) && (

                          <div className="htd-section htd-reasoning">

                            <div className="htd-section-title">💡 {t('history.analysis_notes')}</div>

                            {a.recommendation && (

                              <div className="htd-note htd-note-rec">{a.recommendation}</div>

                            )}

                            {a.reasoning && (

                              <div className="htd-note">{a.reasoning}</div>

                            )}

                          </div>

                        )}

                        {/* Expert Review */}
                        {a.expert_review && (
                          <div className="htd-section htd-expert-review" style={{gridColumn:'1/-1',marginTop:8,background:'#f0fdf4',borderRadius:8,padding:'10px 14px',border:'1px solid #bbf7d0'}}>
                            <div className="htd-section-title" style={{color:'#15803d'}}>🔬 Expert Review</div>
                            <div className="htd-field">
                              <span>Status</span>
                              <strong style={{color:a.expert_review.status==='critical'?'#ef4444':a.expert_review.status==='needs_attention'?'#f59e0b':'#16a34a'}}>
                                {a.expert_review.status==='approved'?'✅ Approved':a.expert_review.status==='needs_attention'?'⚠️ Needs Attention':a.expert_review.status==='critical'?'🚨 Critical':a.expert_review.status}
                              </strong>
                            </div>
                            {a.expert_review.confirmed_disease&&a.expert_review.ai_correct!=='confirmed'&&(
                              <div className="htd-field"><span>Corrected Disease</span><strong>{a.expert_review.confirmed_disease}</strong></div>
                            )}
                            {a.expert_review.urgency_level&&(
                              <div className="htd-field"><span>Urgency</span><strong style={{textTransform:'capitalize'}}>{a.expert_review.urgency_level}</strong></div>
                            )}
                            {a.expert_review.expert_notes&&(
                              <div className="htd-note" style={{marginTop:6,background:'#dcfce7',borderRadius:6,padding:'6px 10px'}}>
                                <strong>Expert Notes:</strong> {a.expert_review.expert_notes}
                              </div>
                            )}
                            {a.expert_review.treatment_recommendation&&(
                              <div className="htd-note htd-note-rec" style={{marginTop:6}}>
                                <strong>Treatment:</strong> {a.expert_review.treatment_recommendation}
                              </div>
                            )}
                            {a.expert_review.follow_up_date&&(
                              <div className="htd-field"><span>Follow-up Date</span><strong>{new Date(a.expert_review.follow_up_date).toLocaleDateString()}</strong></div>
                            )}
                            <div style={{fontSize:11,color:'#64748b',marginTop:4}}>Reviewed on {new Date(a.expert_review.reviewed_at).toLocaleString()}</div>
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

                onClick={() => setPage(p => p - 1)}>{t('history.prev')}</button>

              <span className="page-info">{t('history.page_of', { page, total: totalPages })}</span>

              <button className="btn btn-ghost btn-sm" disabled={page >= totalPages}

                onClick={() => setPage(p => p + 1)}>{t('history.next')}</button>

            </div>

          )}

        </>

      )}

    </div>

  );

}



export default HistoryPage;

