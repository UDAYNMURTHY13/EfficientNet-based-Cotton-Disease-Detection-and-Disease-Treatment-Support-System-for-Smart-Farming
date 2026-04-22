import React, { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const NAV = [
  { path: '/dashboard',  icon: 'bi-grid-fill',              label: 'Dashboard' },
  { path: '/users',      icon: 'bi-people-fill',            label: 'Users' },
  { path: '/analyses',   icon: 'bi-file-earmark-image-fill',label: 'Analyses' },
  { path: '/create-expert', icon: 'bi-person-plus-fill',    label: 'Create Expert' },
  { path: '/reviews',    icon: 'bi-check2-circle',          label: 'Expert Reviews' },
  { path: '/trends',     icon: 'bi-graph-up',               label: 'Disease Trends' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className="cc-sidebar">
      <div className="cc-brand">
        <span className="cc-brand-name"><i className="bi bi-flower2 me-2" />CottonCare</span>
        <span className="cc-brand-tag">ADMIN PANEL</span>
      </div>

      <ul className="cc-nav">
        {NAV.map((item) => (
          <li key={item.path}>
            <button
              className={`cc-nav-link ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <i className={`bi ${item.icon}`} />
              {item.label}
            </button>
          </li>
        ))}
      </ul>

      <div className="cc-sidebar-footer">
        <div className="small text-white-50 mb-2 text-truncate">
          <i className="bi bi-person-circle me-1" />{user?.email || 'Admin'}
        </div>
        <button className="btn btn-sm btn-outline-light w-100" onClick={handleLogout}>
          <i className="bi bi-box-arrow-left me-1" />Logout
        </button>
      </div>
    </aside>
  );
}
