import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface HeaderProps {
  sidebarWidth: number;
  isCollapsed: boolean;
}

export function Header({ sidebarWidth, isCollapsed }: HeaderProps) {
  const location = useLocation();

  return (
    <header className="bg-white shadow-sm" style={{ 
      position: "fixed", 
      top: 0, 
      left: isCollapsed ? '60px' : `${sidebarWidth}px`,
      right: 0,
      zIndex: 900, 
      backgroundColor: "white", 
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
      transition: "left 0.3s ease"
    }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4" style={{ padding: "12px 24px", height: "40px", display: "flex", alignItems: "center" }}>
        <div className="flex items-center justify-between" style={{ width: "100%" }}>
          <h1 className="text-lg font-bold text-gray-900">Insights</h1>
        </div>
      </div>
    </header>
  );
}