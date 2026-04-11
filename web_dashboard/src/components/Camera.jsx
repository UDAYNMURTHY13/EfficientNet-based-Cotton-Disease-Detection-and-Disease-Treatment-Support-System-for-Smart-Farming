/**
 * Camera Component
 * Real-time camera capture for image analysis
 */

import React, { useRef, useEffect, useState } from 'react';
import '../styles/camera.css';

function Camera({ onCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [error, setError] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // environment for back camera

  useEffect(() => {
    // Request camera access
    const constraints = {
      video: {
        facingMode: facingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    };

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(stream => {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
        setError('');
      })
      .catch(err => {
        setError('Unable to access camera. ' + err.message);
        console.error('Camera error:', err);
      });

    return () => {
      // Stop camera on unmount
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const context = canvasRef.current.getContext('2d');
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;

    context.drawImage(videoRef.current, 0, 0);
    const photoUrl = canvasRef.current.toDataURL('image/jpeg');

    onCapture(photoUrl);
  };

  const toggleCamera = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  return (
    <div className="camera-container">
      {error && <div className="alert alert-error">{error}</div>}

      <div className="camera-view">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="video-stream"
        />
      </div>

      <div className="camera-controls">
        <button
          className="btn btn-primary"
          onClick={capturePhoto}
          disabled={!isStreaming}
        >
          📸 Capture Photo
        </button>
        <button
          className="btn btn-secondary"
          onClick={toggleCamera}
          disabled={!isStreaming}
        >
          🔄 Switch Camera
        </button>
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}

export default Camera;
