import React, { useState, useEffect, useContext } from 'react';
import { DataContext } from '../context/DataContext';
import { apiService } from '../services/api';
import '../styles/pages.css';

const DashboardPage = () => {
  const { analytics, setAnalytics, loading, setLoading } = useContext(DataContext);
  const [stats, setStats] = useState(null);
  const [recentCases, setRecentCases] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, casesRes] = await Promise.all([
        apiService.getDashboardStats(),
        apiService.getRecentCases(),
      ]);

      setStats(statsRes.data);
      setRecentCases(casesRes.data);
      setAnalytics(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="page-container">
      <h1>Dashboard</h1>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Cases</h3>
          <p className="stat-value">{stats?.totalCases || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Pending Verification</h3>
          <p className="stat-value">{stats?.pendingVerification || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Critical Cases</h3>
          <p className="stat-value severity-high">{stats?.criticalCases || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Success Rate</h3>
          <p className="stat-value">{stats?.successRate || 0}%</p>
        </div>
      </div>

      {/* Recent Cases */}
      <div className="section">
        <h2>Recent Cases</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Case ID</th>
              <th>Disease</th>
              <th>Severity</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recentCases.map((caseItem) => (
              <tr key={caseItem.id}>
                <td>{caseItem.id}</td>
                <td>{caseItem.disease}</td>
                <td>
                  <span className={`severity-${caseItem.severity.toLowerCase()}`}>
                    {caseItem.severity}
                  </span>
                </td>
                <td>{new Date(caseItem.createdAt).toLocaleDateString()}</td>
                <td>{caseItem.verified ? '✓ Verified' : '⏳ Pending'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DashboardPage;
