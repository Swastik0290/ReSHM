import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiLayout,
  FiCpu,
  FiTable,
  FiSettings,
  FiUser,
  FiMenu,
  FiLogOut
} from 'react-icons/fi';
import './Sidebar.css';

const Sidebar = ({ collapsed, setCollapsed, mobileOpen, onMobileClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard', icon: FiLayout, label: 'Dashboard' },
    { path: '/devices', icon: FiCpu, label: 'Devices' },
    { path: '/tabular-view', icon: FiTable, label: 'Tabular View' },
    { path: '/settings', icon: FiSettings, label: 'Settings' },
    { path: '/profile', icon: FiUser, label: 'Profile' }
  ];

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-header">
        {!collapsed && <h2 className="sidebar-title">Svasa Metric</h2>}
        <button className="toggle-btn" onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar">
          <FiMenu />
        </button>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
              title={collapsed ? item.label : ''}
              onClick={() => onMobileClose?.()}
            >
              <Icon className="nav-icon" />
              {!collapsed && <span className="nav-label">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        {mobileOpen && (
          <button className="close-mobile-btn" onClick={() => onMobileClose?.()} aria-label="Close menu">
            ✕ Close
          </button>
        )}
        {!collapsed && user && (
          <div className="user-info">
            <div className="user-name">{user.username}</div>
            <div className="user-role">{user.role === 'admin' ? 'Admin' : 'Limited User'}</div>
          </div>
        )}
        <button className="logout-btn" onClick={handleLogout} title={collapsed ? 'Logout' : ''}>
          <FiLogOut />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
