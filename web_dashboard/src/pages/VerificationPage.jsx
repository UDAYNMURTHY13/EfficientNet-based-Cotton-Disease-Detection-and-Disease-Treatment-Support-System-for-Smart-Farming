import React, { useState, useEffect, useContext } from 'react';
import { DataContext } from '../context/DataContext';
import { apiService } from '../services/api';
import '../styles/pages.css';

const VerificationPage = () => {
  const { cases, setCases, loading, setLoading } = useContext(DataContext);
  const [selectedCase, setSelectedCase] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    fetchPendingCases();
  }, []);

  const fetchPendingCases = async () => {
    setLoading(true);
    try {
      const response = await apiService.getAllCases({ filter: 'pending' });
      setCases(response.data);
    } catch (error) {
      console.error('Failed to fetch cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (caseId, approved) => {
    setVerifying(true);
    try {
      await apiService.verifyCases(caseId, {
        verified: true,
        approved,
        feedback,
      });

      setSelectedCase(null);
      setFeedback('');
      fetchPendingCases();
    } catch (error) {
      console.error('Verification failed:', error);
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading pending cases...</div>;
  }

  return (
    <div className="page-container verification-page">
      <div className="page-header">
        <h1>Expert Verification Panel</h1>
        <p>Review and verify disease predictions</p>
      </div>

      <div className="verification-layout">
        <div className="cases-list">
          {cases.map((caseItem) => (
            <div
              key={caseItem.id}
              className={`case-item ${selectedCase?.id === caseItem.id ? 'active' : ''}`}
              onClick={() => setSelectedCase(caseItem)}
            >
              <div className="case-header">
                <span className="case-id">{caseItem.id}</span>
                <span className={`severity-${caseItem.severity.toLowerCase()}`}>
                  {caseItem.severity}
                </span>
              </div>
              <div className="case-info">
                <p>{caseItem.disease}</p>
                <p className="confidence">{(caseItem.confidence * 100).toFixed(1)}% confidence</p>
              </div>
            </div>
          ))}
        </div>

        {selectedCase && (
          <div className="verification-panel">
            <h2>Case Details</h2>
            <div className="case-details">
              <div className="detail-row">
                <span>Case ID:</span>
                <strong>{selectedCase.id}</strong>
              </div>
              <div className="detail-row">
                <span>Disease:</span>
                <strong>{selectedCase.disease}</strong>
              </div>
              <div className="detail-row">
                <span>Confidence:</span>
                <strong>{(selectedCase.confidence * 100).toFixed(1)}%</strong>
              </div>
              <div className="detail-row">
                <span>Severity:</span>
                <strong className={`severity-${selectedCase.severity.toLowerCase()}`}>
                  {selectedCase.severity}
                </strong>
              </div>
              <div className="detail-row">
                <span>Farmer:</span>
                <strong>{selectedCase.farmerName}</strong>
              </div>
            </div>

            <div className="feedback-section">
              <label>Expert Feedback:</label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Add your expert feedback here..."
                rows="4"
              />
            </div>

            <div className="action-buttons">
              <button
                className="btn-approve"
                onClick={() => handleVerify(selectedCase.id, true)}
                disabled={verifying}
              >
                ✓ Approve
              </button>
              <button
                className="btn-reject"
                onClick={() => handleVerify(selectedCase.id, false)}
                disabled={verifying}
              >
                ✗ Reject
              </button>
              <button
                className="btn-cancel"
                onClick={() => setSelectedCase(null)}
                disabled={verifying}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerificationPage;
