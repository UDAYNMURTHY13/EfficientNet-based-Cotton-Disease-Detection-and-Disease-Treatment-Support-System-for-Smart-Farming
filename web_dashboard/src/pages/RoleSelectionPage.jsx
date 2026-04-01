import React, { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/role-selection.css';

const RoleSelectionPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(AuthContext);

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleRoleSelect = (role) => {
    // Store role in sessionStorage
    sessionStorage.setItem('selectedRole', role);
    // Navigate to login with role param
    navigate('/login');
  };

  return (
    <div className="role-selection-container">
      <div className="role-selection-box">
        <div className="role-logo">
          <h1>🌾 CottonCare AI</h1>
          <p>Intelligent Cotton Disease Detection</p>
        </div>

        <div className="role-question">
          <h2>Who are you?</h2>
          <p>Select your role to get started</p>
        </div>

        <div className="role-cards">
          {/* Farmer Role */}
          <div 
            className="role-card farmer-card"
            onClick={() => handleRoleSelect('farmer')}
          >
            <div className="role-icon">👨‍🌾</div>
            <h3>Farmer</h3>
            <p>Scan leaves and get instant AI diagnosis</p>
            <div className="role-features">
              <ul>
                <li>📸 Quick leaf scanning</li>
                <li>🤖 Instant AI diagnosis</li>
                <li>💊 Treatment recommendations</li>
                <li>📊 Scan history & tracking</li>
              </ul>
            </div>
          </div>

          {/* Expert Role */}
          <div 
            className="role-card expert-card"
            onClick={() => handleRoleSelect('expert')}
          >
            <div className="role-icon">👨‍⚕️</div>
            <h3>Expert</h3>
            <p>Verify diagnoses and manage cases</p>
            <div className="role-features">
              <ul>
                <li>✅ Verify predictions</li>
                <li>👥 Manage farmer cases</li>
                <li>📈 View analytics</li>
                <li>💬 Provide expert feedback</li>
              </ul>
            </div>
          </div>

          {/* Admin Role */}
          <div 
            className="role-card admin-card"
            onClick={() => handleRoleSelect('admin')}
          >
            <div className="role-icon">👨‍💼</div>
            <h3>Administrator</h3>
            <p>Manage system and all users</p>
            <div className="role-features">
              <ul>
                <li>⚙️ System configuration</li>
                <li>👥 User management</li>
                <li>📊 Full analytics</li>
                <li>🔒 Security settings</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="role-footer">
          <p>Already registered? You can change your role anytime in settings.</p>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionPage;
