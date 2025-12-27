import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const links = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/admin', label: 'Admin Cards' },
  { path: '/admin/dashboard', label: 'Admin Dashboard' },
  { path: '/login', label: 'Login' },
];

export function Header() {
  const location = useLocation();

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4" style={{ padding: "16px 24px" }}>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">TH Insights</h1>
          <nav className="flex items-center gap-4">
            {links.map((l) => {
              const active = location.pathname === l.path || (location.pathname === '/' && l.path === '/dashboard');
              return (
                <Link
                  key={l.path}
                  to={l.path}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 6,
                    textDecoration: 'none',
                    color: active ? '#111827' : '#374151',
                    background: active ? '#f3f4f6' : 'transparent',
                    border: active ? '1px solid #e5e7eb' : '1px solid transparent',
                  }}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}