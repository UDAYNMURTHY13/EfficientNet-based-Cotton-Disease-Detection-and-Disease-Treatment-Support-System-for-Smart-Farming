import React, { useState, useRef, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import Camera from '../components/Camera';
import AnalysisResults from '../components/AnalysisResults';
import APIService from '../services/api';
import '../styles/analyze.css';

function AnalyzePage() {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
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
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10&addressdetails=1`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'CottonCareAI/1.0' } }
      );
      if (!res.ok) return;
      const data = await res.json();
      const a = data.address || {};
      // Build a short readable label: neighbourhood/suburb, city/town/village, state
      const parts = [
        a.suburb || a.neighbourhood || a.village || a.hamlet,
        a.city || a.town || a.county || a.district,
        a.state,
      ].filter(Boolean);
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
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setLocation({ lat, lon, accuracy: pos.coords.accuracy });
        setLocationStatus('granted');
        reverseGeocode(lat, lon);
      },
      () => setLocationStatus('denied'),
      { enableHighAccuracy: true, timeout: 8000 }
    );
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
    if (!selectedFile) { setError('Please select or capture an image first'); return; }
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
        if (placeName) params.set('environment_conditions', placeName);
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
          <h1>Disease Analysis</h1>
          <p>Upload or capture a cotton leaf image for instant AI analysis</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/history')}>
          📋 History
        </button>
      </div>

      {!analysisResult ? (
        <>
          {error && <div className="alert alert-error">{error}</div>}

          {/* Mode Toggle */}
          {/* Location status banner */}
          <div className="location-badge">
            {locationStatus === 'pending' && <span className="loc-dot loc-pending" />}
            {locationStatus === 'granted' && <span className="loc-dot loc-ok" />}
            {(locationStatus === 'denied' || locationStatus === 'unavailable') && <span className="loc-dot loc-off" />}
            <span className="loc-text">
              {locationStatus === 'pending' && 'Getting location…'}
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
              {locationStatus === 'denied' && '📍 Location access denied — analysis will proceed without GPS'}
              {locationStatus === 'unavailable' && '📍 Geolocation not supported by this browser'}
            </span>
          </div>

          <div className="mode-tabs">
            <button className={`mode-tab ${mode === 'upload' ? 'active' : ''}`}
              onClick={() => { setMode('upload'); handleReset(); }}>
              📤 Upload
            </button>
            <button className={`mode-tab ${mode === 'camera' ? 'active' : ''}`}
              onClick={() => { setMode('camera'); handleReset(); }}>
              📷 Camera
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
                      <div className="upload-main-text">Click or drag & drop</div>
                      <div className="upload-sub-text">PNG, JPG, WebP · max 10 MB</div>
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
                    📋 Analysis Pipeline
                  </h3>
                  {[
                    { n: '1', t: 'Disease Detection', d: 'CNN classification model' },
                    { n: '2', t: 'Area Analysis', d: 'Affected region estimation' },
                    { n: '3', t: 'Lesion Mapping', d: 'Spot-level detection' },
                    { n: '4', t: 'Severity Scoring', d: 'Clinical severity grade' },
                  ].map(s => (
                    <div key={s.n} className="pipeline-step">
                      <div className="pipeline-num">{s.n}</div>
                      <div>
                        <div className="pipeline-title">{s.t}</div>
                        <div className="pipeline-desc">{s.d}</div>
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
                      ? <><span className="spinner-sm" /> Analyzing…</>
                      : '🔬 Run Analysis'}
                  </button>

                  {selectedFile && !loading && (
                    <button className="btn btn-ghost btn-block btn-sm"
                      style={{ marginTop: '8px' }} onClick={handleReset}>
                      Reset
                    </button>
                  )}
                </div>
              </div>

              <div className="tips-card">
                <div className="tips-title">📸 Photo Tips</div>
                <ul className="tips-list">
                  <li>Good natural lighting</li>
                  <li>Leaf fills most of frame</li>
                  <li>Focus on affected area</li>
                  <li>Avoid blurry images</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div id="results-anchor">
          <AnalysisResults result={analysisResult} originalPreview={preview} />
          <button className="btn btn-primary" style={{ marginTop: '28px' }} onClick={handleReset}>
            ← Analyze Another Image
          </button>
        </div>
      )}
    </div>
  );
}

export default AnalyzePage;