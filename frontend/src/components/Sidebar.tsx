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
    { 
      path: '/', 
      label: 'Home', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '20px', height: '20px' }}><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
    },
    { 
      path: '/profile', 
      label: 'Profile', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '20px', height: '20px' }}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
    },
    { 
      path: '/dashboard', 
      label: 'Dashboard', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '20px', height: '20px' }}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>
    },
    { 
      path: '/admin', 
      label: 'Admin Cards', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '20px', height: '20px' }}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 0 1-1.125-1.125v-3.75ZM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 0 1-1.125-1.125v-8.25ZM3.75 16.125c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 0 1-1.125-1.125v-2.25Z" /></svg>
    },
    { 
      path: '/admin/filters', 
      label: 'Admin Filters', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '20px', height: '20px' }}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" /></svg>
    },
    { 
      path: '/admin/dashboard', 
      label: 'Admin Dashboard', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '20px', height: '20px' }}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
    },
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
              <span style={{ fontSize: '20px', minWidth: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.icon}</span>
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
          <span style={{ fontSize: '20px', minWidth: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isLoggedIn ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
              </svg>
            )}
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
