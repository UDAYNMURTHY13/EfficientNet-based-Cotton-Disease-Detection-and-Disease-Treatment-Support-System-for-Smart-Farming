import React, { useState, useEffect, useContext } from 'react';
import { DataContext } from '../context/DataContext';
import { apiService } from '../services/api';
import '../styles/pages.css';

const CasesPage = () => {
  const { cases, setCases, loading, setLoading } = useContext(DataContext);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetchCases();
  }, [filter, page]);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const response = await apiService.getAllCases({
        filter,
        page,
        pageSize,
      });
      setCases(response.data);
    } catch (error) {
      console.error('Failed to fetch cases:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading cases...</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Disease Cases</h1>
        <div className="filters">
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={filter === 'verified' ? 'active' : ''}
            onClick={() => setFilter('verified')}
          >
            Verified
          </button>
          <button
            className={filter === 'pending' ? 'active' : ''}
            onClick={() => setFilter('pending')}
          >
            Pending
          </button>
          <button
            className={filter === 'critical' ? 'active' : ''}
            onClick={() => setFilter('critical')}
          >
            Critical
          </button>
        </div>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Case ID</th>
            <th>Farmer</th>
            <th>Disease</th>
            <th>Confidence</th>
            <th>Severity</th>
            <th>Date</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {cases.map((caseItem) => (
            <tr key={caseItem.id}>
              <td>{caseItem.id}</td>
              <td>{caseItem.farmerName}</td>
              <td>{caseItem.disease}</td>
              <td>{(caseItem.confidence * 100).toFixed(1)}%</td>
              <td>
                <span className={`severity-${caseItem.severity.toLowerCase()}`}>
                  {caseItem.severity}
                </span>
              </td>
              <td>{new Date(caseItem.createdAt).toLocaleDateString()}</td>
              <td>{caseItem.verified ? '✓' : '⏳'}</td>
              <td>
                <button className="action-btn">View</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        <button onClick={() => setPage(page - 1)} disabled={page === 1}>
          ← Previous
        </button>
        <span>Page {page}</span>
        <button onClick={() => setPage(page + 1)}>Next →</button>
      </div>
    </div>
  );
};

export default CasesPage;
