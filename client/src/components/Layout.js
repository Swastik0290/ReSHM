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

  // Auto-collapse sidebar on small / compact screens (≤ 1100 px wide)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1100px)');
    const handler = (e) => setSidebarCollapsed(e.matches);
    // Set initial state
    setSidebarCollapsed(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

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
