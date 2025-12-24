import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import '../styles/pages.css';

const AnalyticsPage = () => {
  const [diseaseData, setDiseaseData] = useState([]);
  const [regionalData, setRegionalData] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState('week');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [diseaseRes, regionalRes, trendsRes] = await Promise.all([
        apiService.getDiseaseDistribution(),
        apiService.getRegionalStats(),
        apiService.getTrends(period),
      ]);

      setDiseaseData(diseaseRes.data);
      setRegionalData(regionalRes.data);
      setTrends(trendsRes.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading analytics...</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Analytics & Reports</h1>
        <select value={period} onChange={(e) => setPeriod(e.target.value)} className="period-select">
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
        </select>
      </div>

      <div className="analytics-grid">
        <div className="section">
          <h2>Disease Distribution</h2>
          <div className="chart-placeholder">
            {diseaseData.map((item) => (
              <div key={item.disease} className="chart-item">
                <span>{item.disease}</span>
                <div className="bar">
                  <div
                    className="bar-fill"
                    style={{ width: `${(item.count / Math.max(...diseaseData.map((d) => d.count))) * 100}%` }}
                  />
                </div>
                <span>{item.count} cases</span>
              </div>
            ))}
          </div>
        </div>

        <div className="section">
          <h2>Regional Statistics</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Region</th>
                <th>Cases</th>
                <th>Success Rate</th>
              </tr>
            </thead>
            <tbody>
              {regionalData.map((item) => (
                <tr key={item.region}>
                  <td>{item.region}</td>
                  <td>{item.cases}</td>
                  <td>{item.successRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="section">
        <h2>Trends</h2>
        <div className="trends-list">
          {trends.map((trend, index) => (
            <div key={index} className="trend-item">
              <span>{trend.date}</span>
              <span>{trend.cases} cases</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
