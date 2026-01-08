import { Routes, Route } from "react-router-dom";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
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
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<AdminCards />} />
          <Route path="/admin/filters" element={<AdminFilters />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>
    </div>
  );
}
