import { Routes, Route, Navigate } from "react-router-dom";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Dashboard } from "./pages/Dashboard";
import { Profile } from "./pages/Profile";
import AdminCards from "./pages/AdminCards";
import AdminFilters from "./pages/AdminFilters";
import { AdminDashboard } from "./pages/AdminDashboard";
import Login from "./pages/Login";
import React from "react";

export default function App() {
  const [sidebarWidth, setSidebarWidth] = React.useState(240);
  const [isCollapsed, setIsCollapsed] = React.useState(false);

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
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminCards /></ProtectedRoute>} />
          <Route path="/admin/filters" element={<ProtectedRoute><AdminFilters /></ProtectedRoute>} />
          <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
