/**
 * Analyze Page Component
 * Image upload and disease analysis interface
 * Supports both file upload and real-time camera capture
 */

import React, { useState, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import Camera from '../components/Camera';
import AnalysisResults from '../components/AnalysisResults';
import APIService from '../services/api';
import '../styles/analyze.css';

function AnalyzePage() {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const [mode, setMode] = useState('upload'); // upload or camera
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const fileInputRef = useRef(null);
  const cameraRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError('');
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = (imagePath) => {
    // Convert canvas to blob and create file
    fetch(imagePath)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], 'camera_capture.jpg', { type: 'image/jpeg' });
        setSelectedFile(file);
        setPreview(imagePath);
        setError('');
      });
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError('Please select or capture an image');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Upload with token in header
      const response = await fetch('http://localhost:8000/analysis/analyze', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Analysis failed');
      }

      const data = await response.json();
      setAnalysisResult(data);
      
      // Scroll to results
      setTimeout(() => {
        const resultsSection = document.getElementById('results-section');
        if (resultsSection) {
          resultsSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 300);
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.');
      console.error('Analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreview(null);
    setAnalysisResult(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="analyze-page">
      <div className="analyze-container">
        {/* Header */}
        <div className="analyze-header">
          <div>
            <h1>🔬 Disease Analysis</h1>
            <p>Upload or capture a cotton leaf image for disease detection</p>
          </div>
          <button className="btn btn-secondary" onClick={() => navigate('/history')}>
            📋 View History
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {!analysisResult ? (
          <>
            {/* Mode Toggle */}
            <div className="mode-toggle">
              <button
                className={`mode-btn ${mode === 'upload' ? 'active' : ''}`}
                onClick={() => {
                  setMode('upload');
                  handleReset();
                }}
              >
                📤 Upload Image
              </button>
              <button
                className={`mode-btn ${mode === 'camera' ? 'active' : ''}`}
                onClick={() => {
                  setMode('camera');
                  handleReset();
                }}
              >
                📷 Camera
              </button>
            </div>

            {/* Upload Mode */}
            {mode === 'upload' && (
              <div className="upload-section">
                <div
                  className="upload-area"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add('dragover');
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.classList.remove('dragover');
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('dragover');
                    if (e.dataTransfer.files.length > 0) {
                      handleFileSelect({
                        target: { files: e.dataTransfer.files }
                      });
                    }
                  }}
                >
                  <div className="upload-icon">🖼️</div>
                  <div className="upload-text">
                    {preview ? 'Image selected! Ready to analyze.' : 'Click to upload or drag & drop'}
                  </div>
                  <div className="upload-subtext">
                    PNG, JPG, WebP (Max 10MB)
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </div>
            )}

            {/* Camera Mode */}
            {mode === 'camera' && (
              <div className="camera-section">
                <Camera onCapture={handleCameraCapture} />
              </div>
            )}

            {/* Preview */}
            {preview && (
              <div className="preview-section">
                <h3>Preview</h3>
                <div className="preview-image">
                  <img src={preview} alt="Preview" />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {preview && (
              <div className="action-buttons">
                <button
                  className="btn btn-primary"
                  onClick={handleAnalyze}
                  disabled={loading}
                >
                  {loading ? '⏳ Analyzing...' : '🚀 Analyze Image'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleReset}
                  disabled={loading}
                >
                  Reset
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Results Section */}
            <div id="results-section">
              <AnalysisResults result={analysisResult} />
              <button
                className="btn btn-primary"
                onClick={handleReset}
                style={{ marginTop: '30px' }}
              >
                ← Analyze Another Image
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AnalyzePage;
