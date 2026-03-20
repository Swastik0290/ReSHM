import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useSettings } from '../hooks/useSettings';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import PendingVerification from './PendingVerification';
import './Layout.css';

const Layout = ({ children }) => {
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const settings = useSettings();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.darkMode ? 'dark' : 'light');
  }, [settings.darkMode]);



  const showPending = user && user.role !== 'admin' && user.verified === false;

  return (
    <div className="layout">
      <button
        className="mobile-menu-btn"
        onClick={() => setMobileMenuOpen(true)}
        aria-label="Open menu"
      >
        ☰
      </button>
      <div className={`sidebar-overlay ${mobileMenuOpen ? 'open' : ''}`} onClick={() => setMobileMenuOpen(false)} />
      <Sidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />
      <main className={`layout-main ${sidebarCollapsed ? 'collapsed' : ''} ${mobileMenuOpen ? 'menu-open' : ''}`}>
        {showPending ? <PendingVerification /> : (children || <Outlet />)}
      </main>
    </div>
  );
};

export default Layout;
