import React, { useState, useRef, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthContext from '../context/AuthContext';
import Camera from '../components/Camera';
import AnalysisResults from '../components/AnalysisResults';
import APIService from '../services/api';
import '../styles/analyze.css';

function AnalyzePage() {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const { t } = useTranslation();
  const [mode, setMode] = useState('upload');
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [location, setLocation] = useState(null);      // { lat, lon, accuracy }
  const [locationStatus, setLocationStatus] = useState('pending'); // pending | granted | denied | unavailable
  const [placeName, setPlaceName] = useState('');       // reverse-geocoded name

  const reverseGeocode = async (lat, lon) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'CottonCareAI/1.0' } }
      );
      if (!res.ok) return;
      const data = await res.json();
      const a = data.address || {};

      // Build precise hierarchical location: hamlet/village → suburb/area → city/town → taluk → district → state
      const parts = [];

      // Most specific: hamlet or village
      const micro = a.hamlet || a.village;
      if (micro) parts.push(micro);

      // Local area: suburb or neighbourhood (skip if duplicate)
      const area = a.suburb || a.neighbourhood;
      if (area && area !== micro) parts.push(area);

      // City or town (skip if duplicate)
      const cityTown = a.city || a.town;
      if (cityTown && cityTown !== micro && cityTown !== area) parts.push(cityTown);

      // Taluk / subdistrict (tehsil / block / mandal)
      const taluk = a.subdistrict || a.village_district || a.municipality;
      if (taluk && taluk !== cityTown && taluk !== micro) parts.push(taluk + ' Taluk');

      // District
      const district = a.district || a.county || a.state_district;
      if (district && district !== taluk && district !== cityTown) parts.push(district + ' District');

      // State
      if (a.state) parts.push(a.state);

      if (parts.length) setPlaceName(parts.join(', '));
    } catch {
      // Silently ignore — coordinates still shown as fallback
    }
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus('unavailable');
      return;
    }
    setLocationStatus('pending');
    let lastReverseGeocodedCoords = null;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setLocation({ lat, lon, accuracy: pos.coords.accuracy });
        setLocationStatus('granted');
        // Only re-reverse-geocode if coordinates changed by more than ~50m
        if (
          !lastReverseGeocodedCoords ||
          Math.abs(lastReverseGeocodedCoords.lat - lat) > 0.0005 ||
          Math.abs(lastReverseGeocodedCoords.lon - lon) > 0.0005
        ) {
          lastReverseGeocodedCoords = { lat, lon };
          reverseGeocode(lat, lon);
        }
      },
      () => setLocationStatus('denied'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const setFile = (file) => {
    setSelectedFile(file);
    setError('');
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => { if (e.target.files[0]) setFile(e.target.files[0]); };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) setFile(f);
  };

  const handleCameraCapture = (dataUrl) => {
    fetch(dataUrl).then(r => r.blob()).then(blob => {
      setFile(new File([blob], 'capture.jpg', { type: 'image/jpeg' }));
    });
  };

  const handleAnalyze = async () => {
    if (!selectedFile) { setError(t('analyze.select_image_first')); return; }
    setLoading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', selectedFile);
      const params = new URLSearchParams();
      if (location) {
        params.set('latitude', location.lat);
        params.set('longitude', location.lon);
        params.set('location_accuracy', location.accuracy);
        if (placeName) params.set('location_name', placeName);
      }
      const url = `http://localhost:8000/api/v1/analysis/analyze${params.toString() ? '?' + params.toString() : ''}`;
      const res = await APIService.fetchWithAuth(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Analysis failed');
      }
      setAnalysisResult(await res.json());
      setTimeout(() => {
        document.getElementById('results-anchor')?.scrollIntoView({ behavior: 'smooth' });
      }, 200);
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreview(null);
    setAnalysisResult(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="analyze-page">
      <div className="page-header">
        <div>
          <h1>{t('analyze.title')}</h1>
          <p>{t('analyze.subtitle')}</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/history')}>
          📋 {t('analyze.history_btn')}
        </button>
      </div>

      {!analysisResult ? (
        <>
          {error && <div className="alert alert-error">{error}</div>}

          {/* Location status banner */}
          <div className="location-badge">
            {locationStatus === 'pending' && <span className="loc-dot loc-pending" />}
            {locationStatus === 'granted' && <span className="loc-dot loc-ok" />}
            {(locationStatus === 'denied' || locationStatus === 'unavailable') && <span className="loc-dot loc-off" />}
            <span className="loc-text">
              {locationStatus === 'pending' && t('analyze.location_pending')}
              {locationStatus === 'granted' && (
                <>
                  {placeName && <strong>{placeName}</strong>}
                  {placeName && ' '}
                  <span className="loc-coords">
                    {location?.lat?.toFixed(5)}, {location?.lon?.toFixed(5)}
                    {' '}(±{Math.round(location?.accuracy)}m)
                  </span>
                </>
              )}
              {locationStatus === 'denied' && t('analyze.location_denied')}
              {locationStatus === 'unavailable' && t('analyze.location_unavailable')}
            </span>
          </div>

          <div className="mode-tabs">
            <button className={`mode-tab ${mode === 'upload' ? 'active' : ''}`}
              onClick={() => { setMode('upload'); handleReset(); }}>
              📤 {t('analyze.upload_tab')}
            </button>
            <button className={`mode-tab ${mode === 'camera' ? 'active' : ''}`}
              onClick={() => { setMode('camera'); handleReset(); }}>
              📷 {t('analyze.camera_tab')}
            </button>
          </div>

          <div className="analyze-grid">
            {/* Left: input */}
            <div className="analyze-input-col">
              {mode === 'upload' ? (
                <div
                  className={`upload-zone ${dragOver ? 'drag-over' : ''} ${preview ? 'has-file' : ''}`}
                  onClick={() => !preview && fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                >
                  {preview ? (
                    <div className="preview-wrap">
                      <img src={preview} alt="Preview" className="preview-img" />
                      <button className="preview-remove" onClick={(e) => { e.stopPropagation(); handleReset(); }}>✕</button>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <div className="upload-icon">🖼️</div>
                      <div className="upload-main-text">{t('analyze.click_drop')}</div>
                      <div className="upload-sub-text">{t('analyze.file_types')}</div>
                    </div>
                  )}
                </div>
              ) : (
                <Camera onCapture={handleCameraCapture} />
              )}
              <input ref={fileInputRef} type="file" accept="image/*"
                onChange={handleFileChange} style={{ display: 'none' }} />
            </div>

            {/* Right: info + action */}
            <div className="analyze-info-col">
              <div className="card">
                <div className="card-body">
                  <h3 style={{ marginBottom: '16px', fontSize: '15px', color: 'var(--text)' }}>
                    📋 {t('analyze.pipeline_title')}
                  </h3>
                  {[
                    { n: '1', title: t('analyze.pipeline_1'), desc: t('analyze.pipeline_1_desc') },
                    { n: '2', title: t('analyze.pipeline_2'), desc: t('analyze.pipeline_2_desc') },
                    { n: '3', title: t('analyze.pipeline_3'), desc: t('analyze.pipeline_3_desc') },
                    { n: '4', title: t('analyze.pipeline_4'), desc: t('analyze.pipeline_4_desc') },
                  ].map(s => (
                    <div key={s.n} className="pipeline-step">
                      <div className="pipeline-num">{s.n}</div>
                      <div>
                        <div className="pipeline-title">{s.title}</div>
                        <div className="pipeline-desc">{s.desc}</div>
                      </div>
                    </div>
                  ))}

                  <button
                    className="btn btn-primary btn-block"
                    style={{ marginTop: '24px' }}
                    onClick={handleAnalyze}
                    disabled={!selectedFile || loading}
                  >
                    {loading
                      ? <><span className="spinner-sm" /> {t('analyze.analyzing')}</>
                      : `🔬 ${t('analyze.run_analysis')}`}
                  </button>

                  {selectedFile && !loading && (
                    <button className="btn btn-ghost btn-block btn-sm"
                      style={{ marginTop: '8px' }} onClick={handleReset}>
                      {t('analyze.reset')}
                    </button>
                  )}
                </div>
              </div>

              <div className="tips-card">
                <div className="tips-title">📸 {t('analyze.photo_tips')}</div>
                <ul className="tips-list">
                  <li>{t('analyze.tip_lighting')}</li>
                  <li>{t('analyze.tip_frame')}</li>
                  <li>{t('analyze.tip_focus')}</li>
                  <li>{t('analyze.tip_blur')}</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div id="results-anchor">
          <AnalysisResults result={analysisResult} originalPreview={preview} />
          <button className="btn btn-primary" style={{ marginTop: '28px' }} onClick={handleReset}>
            {t('analyze.analyze_another')}
          </button>
        </div>
      )}
    </div>
  );
}

export default AnalyzePage;
