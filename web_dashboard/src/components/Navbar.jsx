import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/navbar.css';

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const getRoleIcon = () => {
    const icons = {
      farmer: '👨‍🌾',
      expert: '👨‍⚕️',
      admin: '👨‍💼',
    };
    return icons[user?.role] || '👤';
  };

  const getRoleLabel = () => {
    const labels = {
      farmer: 'Farmer',
      expert: 'Expert',
      admin: 'Administrator',
    };
    return labels[user?.role] || 'User';
  };

  const handleLogout = async () => {
    await logout();
    sessionStorage.removeItem('selectedRole');
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button className="menu-toggle" onClick={onMenuClick}>
          ☰
        </button>
        <h1 className="logo">🌾 CottonCare Dashboard</h1>
      </div>

      <div className="navbar-right">
        <div className="user-menu">
          <div className="user-info">
            <span className="user-role-icon">{getRoleIcon()}</span>
            <div className="user-details">
              <p className="user-name">{user?.name || 'User'}</p>
              <p className="user-role">{getRoleLabel()}</p>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            🚪
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
