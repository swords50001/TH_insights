import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface SidebarProps {
  onWidthChange: (width: number) => void;
  onCollapseChange: (isCollapsed: boolean) => void;
}

export function Sidebar({ onWidthChange, onCollapseChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [width, setWidth] = useState(240);
  const [isResizing, setIsResizing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Check login status on mount and when location changes
  React.useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    navigate('/login');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const menuItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/profile', label: 'Profile', icon: '👤' },
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/admin', label: 'Admin Cards', icon: '🎴' },
    { path: '/admin/filters', label: 'Admin Filters', icon: '🔍' },
    { path: '/admin/dashboard', label: 'Admin Dashboard', icon: '⚙️' },
  ];

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  React.useEffect(() => {
    onCollapseChange(isCollapsed);
  }, [isCollapsed, onCollapseChange]);

  React.useEffect(() => {
    onWidthChange(width);
  }, [width, onWidthChange]);

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const newWidth = e.clientX;
        if (newWidth >= 200 && newWidth <= 400) {
          setWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        top: 0, // Start at top of page
        height: '100vh',
        width: isCollapsed ? '60px' : `${width}px`,
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e5e7eb',
        transition: isCollapsed ? 'width 0.3s ease' : 'none',
        zIndex: 900,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '2px 0 8px rgba(0, 0, 0, 0.05)',
        fontFamily: "'Open Sans', sans-serif",
        userSelect: isResizing ? 'none' : 'auto',
      }}
    >
      {/* Resize handle */}
      {!isCollapsed && (
        <div
          onMouseDown={handleMouseDown}
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            width: '4px',
            height: '100%',
            cursor: 'col-resize',
            backgroundColor: 'transparent',
            zIndex: 1001,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#3b82f6';
          }}
          onMouseLeave={(e) => {
            if (!isResizing) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        />
      )}

      {/* Toggle button - More prominent */}
      <div style={{ 
        padding: '12px', 
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb'
      }}>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            width: '100%',
            height: '40px',
            borderRadius: '6px',
            backgroundColor: '#3b82f6',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600,
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2563eb';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#3b82f6';
          }}
          title={isCollapsed ? 'Expand menu' : 'Collapse menu'}
        >
          {isCollapsed ? (
            <>→</>
          ) : (
            <>
              ← Collapse
            </>
          )}
        </button>
      </div>

      {/* Menu items */}
      <nav style={{ flex: 1, padding: '20px 0', overflowY: 'auto' }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (location.pathname === '/' && item.path === '/dashboard');
          
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
                margin: '4px 8px',
                textDecoration: 'none',
                color: isActive ? '#1f2937' : '#6b7280',
                backgroundColor: isActive ? '#f3f4f6' : 'transparent',
                borderRadius: '6px',
                border: isActive ? '1px solid #e5e7eb' : '1px solid transparent',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                fontWeight: isActive ? 600 : 400,
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                  e.currentTarget.style.color = '#374151';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#6b7280';
                }
              }}
            >
              <span style={{ fontSize: '20px', minWidth: '24px' }}>{item.icon}</span>
              {!isCollapsed && (
                <span style={{ marginLeft: '12px', fontSize: '14px' }}>
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Login/Logout button */}
      <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb' }}>
        <button
          onClick={isLoggedIn ? handleLogout : handleLogin}
          style={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            padding: '12px 16px',
            backgroundColor: 'transparent',
            border: '1px solid transparent',
            borderRadius: '6px',
            color: '#6b7280',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            fontWeight: 400,
            fontSize: '14px',
          }}
          onMouseEnter={(e) => {
            if (isLoggedIn) {
              e.currentTarget.style.backgroundColor = '#fef2f2';
              e.currentTarget.style.color = '#dc2626';
              e.currentTarget.style.borderColor = '#fecaca';
            } else {
              e.currentTarget.style.backgroundColor = '#eff6ff';
              e.currentTarget.style.color = '#2563eb';
              e.currentTarget.style.borderColor = '#bfdbfe';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#6b7280';
            e.currentTarget.style.borderColor = 'transparent';
          }}
        >
          <span style={{ fontSize: '20px', minWidth: '24px' }}>
            {isLoggedIn ? '🚪' : '🔑'}
          </span>
          {!isCollapsed && (
            <span style={{ marginLeft: '12px' }}>
              {isLoggedIn ? 'Logout' : 'Login'}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
