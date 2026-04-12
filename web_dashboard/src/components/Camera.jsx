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
  const streamRef = useRef(null);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsStreaming(false);
  };

  const startCamera = async (mode) => {
    stopStream();
    setError('');

    // Try in order: exact facingMode → any facingMode → bare video:true
    const attempts = [
      { video: { facingMode: { exact: mode }, width: { ideal: 1280 }, height: { ideal: 720 } } },
      { video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } } },
      { video: { width: { ideal: 1280 }, height: { ideal: 720 } } },
      { video: true },
    ];

    for (const constraints of attempts) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setIsStreaming(true);
        return;
      } catch (e) {
        // try next fallback
      }
    }
    setError('Unable to access camera. Please allow camera permission or check that no other app is using it.');
  };

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera not supported in this browser.');
      return;
    }
    startCamera(facingMode);
    return () => stopStream();
  }, [facingMode]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !isStreaming) return;

    const context = canvasRef.current.getContext('2d');
    canvasRef.current.width = videoRef.current.videoWidth || 640;
    canvasRef.current.height = videoRef.current.videoHeight || 480;

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
