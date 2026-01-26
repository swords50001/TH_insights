import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Dashboard } from "./pages/Dashboard";
import { Profile } from "./pages/Profile";
import AdminCards from "./pages/AdminCards";
import AdminFilters from "./pages/AdminFilters";
import { AdminDashboard } from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import Login from "./pages/Login";
import React from "react";

export default function App() {
  const [sidebarWidth, setSidebarWidth] = React.useState(240);
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isAuthenticated, setIsAuthenticated] = React.useState(!!localStorage.getItem('token'));
  const location = useLocation();
  const navigate = useNavigate();

  React.useEffect(() => {
    // Check token on mount and whenever storage changes
    const checkAuth = () => {
      const hasToken = !!localStorage.getItem('token');
      setIsAuthenticated(hasToken);
      
      // Redirect to login if not authenticated and not already on login page
      if (!hasToken && location.pathname !== '/login') {
        navigate('/login', { replace: true });
      }
    };
    
    checkAuth();
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, [location.pathname, navigate]);

  // If not authenticated, show login without sidebar/header
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Authenticated: show full layout with sidebar and header
  return (
    <div className="app">
      <Sidebar onWidthChange={setSidebarWidth} onCollapseChange={setIsCollapsed} />
      <Header sidebarWidth={sidebarWidth} isCollapsed={isCollapsed} />
      <main className="main" style={{ 
        marginTop: "64px",
        minHeight: "calc(100vh - 64px)", 
        marginLeft: isCollapsed ? '60px' : `${sidebarWidth}px`, 
        transition: "margin-left 0.3s ease" 
      }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<AdminCards />} />
          <Route path="/admin/filters" element={<AdminFilters />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
