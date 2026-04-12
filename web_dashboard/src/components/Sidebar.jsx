import React, { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthContext from '../context/AuthContext';
import './Sidebar.css';

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);
  const { t } = useTranslation();

  const NAV_ITEMS = [
    { path: '/dashboard', icon: '⬡',  label: t('sidebar.dashboard') },
    { path: '/analyze',   icon: '🔬', label: t('sidebar.analyze') },
    { path: '/history',   icon: '📋', label: t('sidebar.history') },
    { path: '/profile',   icon: '👤', label: t('sidebar.profile') },
    { path: '/settings',  icon: '⚙️', label: t('sidebar.settings') },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">🌿</div>
        <div className="sidebar-brand-text">
          <span className="sidebar-brand-name">CottonCare</span>
          <span className="sidebar-brand-tag">AI Platform</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const active = location.pathname.startsWith(item.path);
          return (
            <button
              key={item.path}
              className={`sidebar-nav-item ${active ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {active && <span className="nav-active-bar" />}
            </button>
          );
        })}
      </nav>

      {/* Bottom User Section */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="user-avatar">
            {(user?.name || user?.full_name || 'U')[0].toUpperCase()}
          </div>
          <div className="user-info">
            <span className="user-name">{user?.name || user?.full_name || t('sidebar.farmer')}</span>
            <span className="user-role">{t('sidebar.farmer')}</span>
          </div>
        </div>
        <button className="sidebar-logout" onClick={handleLogout} title="Logout">
          ⏻
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
