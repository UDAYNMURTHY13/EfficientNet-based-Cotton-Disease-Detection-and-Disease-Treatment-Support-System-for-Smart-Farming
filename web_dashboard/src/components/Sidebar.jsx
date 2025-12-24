import React from 'react';
import { NavLink } from 'react-router-dom';
import '../styles/sidebar.css';

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <div className="nav-section">
          <h3 className="nav-title">Main</h3>
          <NavLink to="/" className="nav-link">
            📊 Dashboard
          </NavLink>
          <NavLink to="/cases" className="nav-link">
            📋 Cases
          </NavLink>
        </div>

        <div className="nav-section">
          <h3 className="nav-title">Management</h3>
          <NavLink to="/verification" className="nav-link">
            ✓ Verification
          </NavLink>
          <NavLink to="/analytics" className="nav-link">
            📈 Analytics
          </NavLink>
          <NavLink to="/users" className="nav-link">
            👥 Users
          </NavLink>
        </div>

        <div className="nav-section">
          <h3 className="nav-title">System</h3>
          <NavLink to="/settings" className="nav-link">
            ⚙️ Settings
          </NavLink>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
