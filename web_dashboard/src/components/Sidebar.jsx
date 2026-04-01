import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/sidebar.css';

const Sidebar = () => {
  const { user } = useContext(AuthContext);
  const role = user?.role;

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {/* ===== FARMER NAVIGATION ===== */}
        {role === 'farmer' && (
          <>
            <div className="nav-section">
              <h3 className="nav-title">Main</h3>
              <NavLink to="/dashboard" className="nav-link">
                📊 Dashboard
              </NavLink>
              <NavLink to="/cases" className="nav-link">
                🔍 My Scans
              </NavLink>
            </div>

            <div className="nav-section">
              <h3 className="nav-title">Tracking</h3>
              <NavLink to="/analytics" className="nav-link">
                📈 History & Analytics
              </NavLink>
            </div>

            <div className="nav-section">
              <h3 className="nav-title">Account</h3>
              <NavLink to="/settings" className="nav-link">
                ⚙️ Settings
              </NavLink>
            </div>
          </>
        )}

        {/* ===== EXPERT NAVIGATION ===== */}
        {role === 'expert' && (
          <>
            <div className="nav-section">
              <h3 className="nav-title">Main</h3>
              <NavLink to="/dashboard" className="nav-link">
                📊 Dashboard
              </NavLink>
              <NavLink to="/cases" className="nav-link">
                📋 Cases
              </NavLink>
            </div>

            <div className="nav-section">
              <h3 className="nav-title">Verification</h3>
              <NavLink to="/verification" className="nav-link">
                ✓ Verify Diagnoses
              </NavLink>
            </div>

            <div className="nav-section">
              <h3 className="nav-title">Analysis</h3>
              <NavLink to="/analytics" className="nav-link">
                📈 Analytics & Reports
              </NavLink>
            </div>

            <div className="nav-section">
              <h3 className="nav-title">Account</h3>
              <NavLink to="/settings" className="nav-link">
                ⚙️ Settings
              </NavLink>
            </div>
          </>
        )}

        {/* ===== ADMIN NAVIGATION ===== */}
        {role === 'admin' && (
          <>
            <div className="nav-section">
              <h3 className="nav-title">Main</h3>
              <NavLink to="/dashboard" className="nav-link">
                📊 Dashboard
              </NavLink>
              <NavLink to="/cases" className="nav-link">
                📋 All Cases
              </NavLink>
            </div>

            <div className="nav-section">
              <h3 className="nav-title">Management</h3>
              <NavLink to="/verification" className="nav-link">
                ✓ Verification Queue
              </NavLink>
              <NavLink to="/users" className="nav-link">
                👥 User Management
              </NavLink>
            </div>

            <div className="nav-section">
              <h3 className="nav-title">Reports</h3>
              <NavLink to="/analytics" className="nav-link">
                📈 System Analytics
              </NavLink>
            </div>

            <div className="nav-section">
              <h3 className="nav-title">System</h3>
              <NavLink to="/settings" className="nav-link">
                ⚙️ Settings & Config
              </NavLink>
            </div>
          </>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;
