/**
 * History Page Component
 * View all analyses performed by the farmer
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import APIService from '../services/api';
import '../styles/history.css';

function HistoryPage() {
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadHistory();
  }, [page]);

  const loadHistory = async () => {
    try {
      const data = await APIService.getAnalysisHistory(page, 10);
      setAnalyses(data.items);
      setTotal(data.total);
    } catch (err) {
      setError('Failed to load history');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (analysisId) => {
    if (window.confirm('Are you sure you want to delete this analysis?')) {
      try {
        await APIService.deleteAnalysis(analysisId);
        loadHistory();
      } catch (err) {
        setError('Failed to delete analysis');
      }
    }
  };

  const getSeverityStyle = (level) => {
    const styles = {
      'Healthy': { color: '#27ae60', icon: '✓' },
      'Mild': { color: '#f39c12', icon: '⚠️' },
      'Moderate': { color: '#e74c3c', icon: '⚠️' },
      'Severe': { color: '#c0392b', icon: '🔴' },
      'Critical': { color: '#8b0000', icon: '🔴' }
    };
    return styles[level] || styles['Moderate'];
  };

  return (
    <div className="history-page">
      {/* Header */}
      <div className="history-header">
        <div>
          <h1>📋 Analysis History</h1>
          <p>View all your disease detection analyses</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/analyze')}>
          ➕ New Analysis
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading history...</p>
        </div>
      ) : analyses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No analyses yet</h3>
          <p>Start your first analysis and view your results here</p>
          <button className="btn btn-primary" onClick={() => navigate('/analyze')}>
            Start Analysis
          </button>
        </div>
      ) : (
        <>
          <div className="history-table">
            <div className="table-header">
              <div className="table-col date">Date</div>
              <div className="table-col disease">Disease</div>
              <div className="table-col severity">Severity</div>
              <div className="table-col image">Image</div>
              <div className="table-col actions">Actions</div>
            </div>

            {analyses.map((analysis) => {
              const severity = getSeverityStyle(analysis.severity_level);
              return (
                <div key={analysis.id} className="table-row">
                  <div className="table-col date">
                    {new Date(analysis.analyzed_at).toLocaleDateString()}
                  </div>
                  <div className="table-col disease">{analysis.disease_detected}</div>
                  <div className="table-col severity">
                    <span 
                      className="severity-badge"
                      style={{ borderColor: severity.color }}
                    >
                      {severity.icon} {analysis.severity_level}
                    </span>
                  </div>
                  <div className="table-col image">{analysis.image_filename}</div>
                  <div className="table-col actions">
                    <button 
                      className="btn-action btn-view"
                      onClick={() => navigate(`/analysis/${analysis.id}`)}
                      title="View details"
                    >
                      👁️
                    </button>
                    <button 
                      className="btn-action btn-delete"
                      onClick={() => handleDelete(analysis.id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {total > 10 && (
            <div className="pagination">
              <button 
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                ← Previous
              </button>
              <span className="page-info">
                Page {page} of {Math.ceil(total / 10)}
              </span>
              <button 
                disabled={page >= Math.ceil(total / 10)}
                onClick={() => setPage(page + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default HistoryPage;
