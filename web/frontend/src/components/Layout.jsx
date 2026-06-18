import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { clearStuckOverlays } from '../utils/cleanupOverlays';

const primaryMenuItems = [
  { path: '/dashboard',     icon: 'bi-speedometer2',       label: 'Dashboard' },
  { path: '/applications',  icon: 'bi-file-earmark-text',  label: 'Applications' },
  { path: '/projects',      icon: 'bi-building',           label: 'Projects' },
  { path: '/roles',         icon: 'bi-people',             label: 'Users' },
  { path: '/reports',       icon: 'bi-graph-up',           label: 'Reports' },
  { path: '/notifications', icon: 'bi-bell',               label: 'Notifications' },
];

const secondaryMenuItems = [
  { path: '/audit', icon: 'bi-shield-check', label: 'Audit Log' },
];

const Layout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    clearStuckOverlays();
    setUserMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const pageTitles = {
    '/dashboard':     'Dashboard',
    '/applications':  'Applications',
    '/projects':      'Projects',
    '/roles':         'Users',
    '/audit':         'Audit Log',
    '/reports':       'Reports',
    '/notifications': 'Notifications',
    '/profile':       'Profile',
  };

  const pageTitle = pageTitles[location.pathname] || 'Findoor';
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AD';

  const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

  const renderNavItem = (item) => {
    const isActive = location.pathname === item.path ||
      (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
    return (
      <button
        key={item.path}
        className={`sidebar-item${isActive ? ' active' : ''}`}
        onClick={() => navigate(item.path)}
        title={collapsed ? item.label : undefined}
      >
        <i className={`bi ${item.icon} sidebar-item-icon`}></i>
        {!collapsed && (
          <span className="sidebar-item-label">{item.label}</span>
        )}
      </button>
    );
  };

  return (
    <div className="d-flex" style={{ height: '100vh', overflow: 'hidden' }}>
      {/* ── Sidebar ── */}
      <nav className={`sidebar${collapsed ? ' collapsed' : ''}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <i className="bi bi-building-fill"></i>
          </div>
          {!collapsed && (
            <div className="sidebar-brand-text">
              Findoor
              <span>Admin Portal</span>
            </div>
          )}
        </div>

        {/* Primary Navigation */}
        <div className="sidebar-nav">
          {!collapsed && (
            <div className="sidebar-section-label">Main Menu</div>
          )}
          {primaryMenuItems.map(renderNavItem)}

          {/* Separator before compliance section */}
          <div style={{
            margin: collapsed ? '12px 8px' : '12px 16px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }} />

          {!collapsed && (
            <div className="sidebar-section-label">Compliance</div>
          )}
          {secondaryMenuItems.map(renderNavItem)}
        </div>

        {/* Collapse button */}
        <div className="sidebar-footer">
          <button
            className="sidebar-collapse-btn"
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <i className={`bi ${collapsed ? 'bi-chevron-double-right' : 'bi-chevron-double-left'}`}></i>
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </nav>

      {/* ── Main area ── */}
      <div className="d-flex flex-column flex-grow-1" style={{ overflow: 'hidden' }}>
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-title">
            <span className="text-muted me-2" style={{ fontWeight: 400 }}>
              Findoor
            </span>
            <span className="text-muted mx-1">/</span>
            <span style={{ color: 'var(--gray-900)' }}>{pageTitle}</span>
          </div>

          {/* User menu */}
          <div ref={userMenuRef} className="position-relative">
            <button
              className="btn btn-sm d-flex align-items-center gap-2"
              style={{
                background: 'var(--gray-100)',
                border: '1px solid var(--gray-200)',
                borderRadius: '8px',
                padding: '6px 12px',
              }}
              onClick={() => setUserMenuOpen(o => !o)}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {initials}
              </div>
              <span style={{ fontWeight: 500, fontSize: 13, color: 'var(--gray-700)' }}>
                {user?.name || 'Admin User'}
              </span>
              <i className="bi bi-chevron-down" style={{ fontSize: 11, color: 'var(--gray-400)' }}></i>
            </button>

            {userMenuOpen && (
              <div
                className="dropdown-menu dropdown-menu-end show"
                style={{
                  top: 'calc(100% + 6px)',
                  right: 0,
                  left: 'auto',
                  minWidth: 180,
                  borderRadius: 10,
                  border: '1px solid var(--gray-200)',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '6px',
                }}
              >
                <div style={{ padding: '8px 12px 10px', borderBottom: '1px solid var(--gray-100)' }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--gray-900)' }}>
                    {user?.name || 'Admin User'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>
                    {capitalize(user?.role || 'admin')}
                  </div>
                </div>
                <div style={{ marginTop: 4 }}>
                  <Link
                    className="dropdown-item"
                    to="/profile"
                    style={{ borderRadius: 6, fontSize: 13 }}
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <i className="bi bi-person me-2"></i>My Profile
                  </Link>
                  <hr className="dropdown-divider my-1" />
                  <button
                    className="dropdown-item text-danger"
                    style={{ borderRadius: 6, fontSize: 13 }}
                    onClick={() => { setUserMenuOpen(false); handleLogout(); }}
                  >
                    <i className="bi bi-box-arrow-right me-2"></i>Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
