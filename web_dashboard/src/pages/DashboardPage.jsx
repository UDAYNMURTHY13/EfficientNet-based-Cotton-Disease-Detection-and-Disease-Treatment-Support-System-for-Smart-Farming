import React, { useState, useEffect, useContext, useCallback } from 'react';
import { DataContext } from '../context/DataContext';
import { AuthContext } from '../context/AuthContext';
import { apiService } from '../services/api';
import ScanService from '../services/ScanService';
import '../styles/pages.css';

const DashboardPage = () => {
  const { setLoading } = useContext(DataContext);
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [recentCases, setRecentCases] = useState([]);
  const [showScanModal, setShowScanModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, casesRes] = await Promise.all([
        apiService.getDashboardStats(),
        apiService.getRecentCases(),
      ]);

      setStats(statsRes.data);
      setRecentCases(casesRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Image size must be less than 10MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScanSubmit = async () => {
    if (!selectedImage) {
      alert('Please select an image first');
      return;
    }

    setScanning(true);
    try {
      // Complete scan processing workflow
      const result = await ScanService.processScan(selectedImage, {
        id: user?.id || 'farmer-001',
        name: user?.name || 'Farmer',
        email: user?.email || 'farmer@example.com',
      });

      setScanResult(result);
      setShowResultModal(true);
      setShowScanModal(false);
      setSelectedImage(null);
      
      // Add to recent cases
      const formattedScan = ScanService.formatScanForDisplay(result);
      setRecentCases([formattedScan, ...recentCases.slice(0, 9)]);
    } catch (error) {
      console.error('Scan processing failed:', error);
      alert('Failed to process scan. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  // ===== FARMER DASHBOARD =====
  if (user?.role === 'farmer') {

    return (
      <div className="page-container">
        <div className="welcome-section">
          <h1>👨‍🌾 Welcome, {user?.name}</h1>
          <p>Monitor your cotton crop health and get instant AI diagnoses</p>
          <button 
            className="btn-scan-large"
            onClick={() => setShowScanModal(true)}
          >
            📸 Scan New Leaf Now
          </button>
        </div>

        {/* Scan Modal */}
        {showScanModal && (
          <div className="modal-overlay" onClick={() => setShowScanModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>📸 Scan Cotton Leaf</h2>
                <button className="modal-close" onClick={() => setShowScanModal(false)}>✕</button>
              </div>

              <div className="modal-body">
                <div className="upload-section">
                  {selectedImage ? (
                    <div className="image-preview">
                      <img src={selectedImage} alt="Selected leaf" />
                      <button 
                        className="btn-change-image"
                        onClick={() => document.getElementById('imageInput').click()}
                      >
                        📷 Change Image
                      </button>
                    </div>
                  ) : (
                    <div className="upload-area" onClick={() => document.getElementById('imageInput').click()}>
                      <div className="upload-icon">📸</div>
                      <h3>Click to upload or drag and drop</h3>
                      <p>PNG, JPG, GIF up to 10MB</p>
                    </div>
                  )}

                  <input
                    id="imageInput"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                </div>

                <div className="scan-tips">
                  <h4>💡 Tips for Best Results</h4>
                  <ul>
                    <li>📸 Take clear photos of affected leaves</li>
                    <li>💡 Use natural light for better clarity</li>
                    <li>🎯 Focus on the diseased area</li>
                    <li>📐 Include the full leaf in frame</li>
                  </ul>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  className="btn-secondary"
                  onClick={() => setShowScanModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn-primary"
                  onClick={handleScanSubmit}
                  disabled={!selectedImage || scanning}
                >
                  {scanning ? '⏳ Processing...' : '✓ Scan & Analyze'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scan Result Modal */}
        {showResultModal && scanResult && (
          <div className="modal-overlay" onClick={() => setShowResultModal(false)}>
            <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>📊 AI Analysis Report</h2>
                <button className="modal-close" onClick={() => setShowResultModal(false)}>✕</button>
              </div>

              <div className="modal-body">
                {/* Disease Detection */}
                <div className={`disease-card severity-${scanResult.report.diseaseDetection.severity.toLowerCase()}`}>
                  <h3>Detected Disease</h3>
                  <p className="disease-name">{scanResult.report.diseaseDetection.primaryDisease}</p>
                  <div className="disease-details">
                    <span className="confidence">Confidence: <strong>{scanResult.report.diseaseDetection.confidence}</strong></span>
                    <span className="severity">Severity: <strong>{scanResult.report.diseaseDetection.severity}</strong></span>
                  </div>
                  <p className="description">{scanResult.report.diseaseDetection.description}</p>
                </div>

                {/* Location & Timestamp */}
                <div className="scan-metadata">
                  <h4>📍 Scan Information</h4>
                  <div className="metadata-grid">
                    <div>
                      <strong>Scan ID:</strong> {scanResult.scan.scanId}
                    </div>
                    <div>
                      <strong>Timestamp:</strong> {new Date(scanResult.scan.timestamp).toLocaleString()}
                    </div>
                    {scanResult.scan.location.latitude && (
                      <div>
                        <strong>Location:</strong> {scanResult.scan.location.latitude.toFixed(4)}, {scanResult.scan.location.longitude.toFixed(4)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Immediate Actions */}
                <div className="actions-section">
                  <h4>⚠️ Immediate Actions Required</h4>
                  <ul className="actions-list">
                    {scanResult.report.immediateActions.map((action, idx) => (
                      <li key={idx}>{action}</li>
                    ))}
                  </ul>
                </div>

                {/* Treatment Recommendations */}
                <div className="treatments-section">
                  <h4>💊 Treatment Recommendations</h4>
                  <div className="treatments-grid">
                    {scanResult.report.treatmentRecommendations.map((treatment, idx) => (
                      <div key={idx} className="treatment-card">
                        <h5>{treatment.type}</h5>
                        <p><strong>Product:</strong> {treatment.product}</p>
                        <p><strong>Concentration:</strong> {treatment.concentration}</p>
                        <p><strong>Rate:</strong> {treatment.applicationRate}</p>
                        <p><strong>Interval:</strong> {treatment.interval}</p>
                        <p className="effectiveness">Effectiveness: {treatment.effectiveness}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preventive Measures */}
                <div className="preventive-section">
                  <h4>🛡️ Preventive Measures</h4>
                  <ul className="preventive-list">
                    {scanResult.report.preventiveMeasures.map((measure, idx) => (
                      <li key={idx}>{measure}</li>
                    ))}
                  </ul>
                </div>

                {/* Status */}
                <div className="status-box">
                  <p>📋 <strong>Status:</strong> {scanResult.verification.status}</p>
                  <p>This report has been automatically submitted to our expert panel for verification and additional recommendations.</p>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  className="btn-secondary"
                  onClick={() => setShowResultModal(false)}
                >
                  Close
                </button>
                <button 
                  className="btn-primary"
                  onClick={() => {
                    setShowResultModal(false);
                    fetchDashboardData();
                  }}
                >
                  View All Scans
                </button>
              </div>
            </div>
          </div>
        )}
        

        {/* Farmer Stats */}
        <div className="stats-grid">
          <div className="stat-card farmer-stat">
            <h3>📸 Total Scans</h3>
            <p className="stat-value">{stats?.totalCases || 0}</p>
            <p className="stat-label">Scans performed</p>
          </div>
          <div className="stat-card farmer-stat">
            <h3>💊 Diseases Detected</h3>
            <p className="stat-value">{stats?.diseasesFound || 0}</p>
            <p className="stat-label">Different diseases found</p>
          </div>
          <div className="stat-card farmer-stat">
            <h3>✓ Verified Scans</h3>
            <p className="stat-value">{stats?.verifiedCases || 0}</p>
            <p className="stat-label">Expert confirmed</p>
          </div>
          <div className="stat-card farmer-stat">
            <h3>⚠️ Critical Cases</h3>
            <p className="stat-value severity-high">{stats?.criticalCases || 0}</p>
            <p className="stat-label">Need immediate attention</p>
          </div>
        </div>

        {/* Recent Scans */}
        <div className="section">
          <h2>📋 Your Recent Scans</h2>
          {recentCases.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Scan Date</th>
                  <th>Disease Detected</th>
                  <th>Severity</th>
                  <th>Confidence</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentCases.map((caseItem) => (
                  <tr key={caseItem.id}>
                    <td>{new Date(caseItem.createdAt).toLocaleDateString()}</td>
                    <td>{caseItem.disease}</td>
                    <td>
                      <span className={`severity-${caseItem.severity.toLowerCase()}`}>
                        {caseItem.severity}
                      </span>
                    </td>
                    <td>{(caseItem.confidence * 100).toFixed(1)}%</td>
                    <td>{caseItem.verified ? '✓ Verified' : '⏳ Pending'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="empty-state">No scans yet. Start by taking a photo of a cotton leaf!</p>
          )}
        </div>

        {/* Tips */}
        <div className="info-section">
          <h3>💡 Quick Tips</h3>
          <ul>
            <li>📸 Take clear photos of affected leaves in natural light</li>
            <li>🎯 Focus on the diseased area for better diagnosis</li>
            <li>📊 View your history to track disease patterns</li>
            <li>💬 Get expert feedback on your scans</li>
          </ul>
        </div>
      </div>
    );
  }

  // ===== EXPERT DASHBOARD =====
  if (user?.role === 'expert') {
    return (
      <div className="page-container">
        <div className="welcome-section">
          <h1>👨‍⚕️ Expert Dashboard</h1>
          <p>Verify diagnoses and provide expert feedback to farmers</p>
        </div>

        {/* Expert Stats */}
        <div className="stats-grid">
          <div className="stat-card expert-stat">
            <h3>⏳ Pending Verification</h3>
            <p className="stat-value">{stats?.pendingVerification || 0}</p>
            <p className="stat-label">Awaiting your review</p>
          </div>
          <div className="stat-card expert-stat">
            <h3>✓ Verified Cases</h3>
            <p className="stat-value">{stats?.verifiedCases || 0}</p>
            <p className="stat-label">Cases reviewed</p>
          </div>
          <div className="stat-card expert-stat">
            <h3>📊 Accuracy Rate</h3>
            <p className="stat-value">{stats?.successRate || 0}%</p>
            <p className="stat-label">AI model accuracy</p>
          </div>
          <div className="stat-card expert-stat">
            <h3>⚠️ Critical Cases</h3>
            <p className="stat-value severity-high">{stats?.criticalCases || 0}</p>
            <p className="stat-label">High severity cases</p>
          </div>
        </div>

        {/* Cases Needing Verification */}
        <div className="section">
          <h2>🔍 Cases Pending Your Review</h2>
          {recentCases.filter(c => !c.verified).length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Farmer</th>
                  <th>Disease</th>
                  <th>AI Confidence</th>
                  <th>Severity</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentCases.filter(c => !c.verified).map((caseItem) => (
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
                    <td><a href="/verification" className="btn-small">Review</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="empty-state">All cases have been reviewed! ✓</p>
          )}
        </div>

        {/* Your Verification History */}
        <div className="section">
          <h2>✓ Your Recent Verifications</h2>
          {recentCases.filter(c => c.verified).length > 0 ? (
            <table className="table compact">
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Disease</th>
                  <th>Verified</th>
                  <th>Your Decision</th>
                </tr>
              </thead>
              <tbody>
                {recentCases.filter(c => c.verified).slice(0, 5).map((caseItem) => (
                  <tr key={caseItem.id}>
                    <td>{caseItem.id}</td>
                    <td>{caseItem.disease}</td>
                    <td>{new Date(caseItem.verifiedAt).toLocaleDateString()}</td>
                    <td><span className="verified-badge">✓ Approved</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="empty-state">No verified cases yet</p>
          )}
        </div>
      </div>
    );
  }

  // ===== ADMIN DASHBOARD =====
  if (user?.role === 'admin') {
    return (
      <div className="page-container">
        <div className="welcome-section">
          <h1>👨‍💼 System Administration Dashboard</h1>
          <p>Monitor and manage the entire CottonCare system</p>
        </div>

        {/* Admin Stats */}
        <div className="stats-grid">
          <div className="stat-card admin-stat">
            <h3>📊 Total Cases</h3>
            <p className="stat-value">{stats?.totalCases || 0}</p>
            <p className="stat-label">System-wide scans</p>
          </div>
          <div className="stat-card admin-stat">
            <h3>⏳ Pending Verification</h3>
            <p className="stat-value">{stats?.pendingVerification || 0}</p>
            <p className="stat-label">Awaiting expert review</p>
          </div>
          <div className="stat-card admin-stat">
            <h3>👥 Active Users</h3>
            <p className="stat-value">{stats?.activeUsers || 0}</p>
            <p className="stat-label">Farmers, experts & admins</p>
          </div>
          <div className="stat-card admin-stat">
            <h3>📈 System Accuracy</h3>
            <p className="stat-value">{stats?.successRate || 0}%</p>
            <p className="stat-label">Overall model performance</p>
          </div>
        </div>

        {/* System Overview */}
        <div className="stats-grid">
          <div className="stat-card admin-stat">
            <h3>🌾 Farmers</h3>
            <p className="stat-value">{stats?.farmerCount || 0}</p>
            <p className="stat-label">Registered farmers</p>
          </div>
          <div className="stat-card admin-stat">
            <h3>👨‍⚕️ Experts</h3>
            <p className="stat-value">{stats?.expertCount || 0}</p>
            <p className="stat-label">Active experts</p>
          </div>
          <div className="stat-card admin-stat">
            <h3>⚠️ Critical Cases</h3>
            <p className="stat-value severity-high">{stats?.criticalCases || 0}</p>
            <p className="stat-label">High severity alerts</p>
          </div>
          <div className="stat-card admin-stat">
            <h3>🔒 Security</h3>
            <p className="stat-value">Active</p>
            <p className="stat-label">System secure</p>
          </div>
        </div>

        {/* Recent System Activity */}
        <div className="section">
          <h2>📋 All Recent Cases</h2>
          {recentCases.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Farmer</th>
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
                    <td>{caseItem.farmerName}</td>
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
          ) : (
            <p className="empty-state">No cases in the system yet</p>
          )}
        </div>

        {/* Quick Management Links */}
        <div className="info-section admin-quick-links">
          <h3>⚙️ Quick Actions</h3>
          <ul>
            <li><a href="/users">Manage Users</a> - Add, edit, or remove users</li>
            <li><a href="/verification">Verify Cases</a> - Review pending cases</li>
            <li><a href="/analytics">View Analytics</a> - System performance metrics</li>
            <li><a href="/settings">System Settings</a> - Configure the system</li>
          </ul>
        </div>
      </div>
    );
  }

  // Default fallback
  return (
    <div className="page-container">
      <h1>Dashboard</h1>
      <p>Loading...</p>
    </div>
  );
};

export default DashboardPage;
