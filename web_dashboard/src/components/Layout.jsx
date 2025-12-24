import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import '../styles/layout.css';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="layout">
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="layout-container">
        {(sidebarOpen || !isMobile) && <Sidebar />}
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
