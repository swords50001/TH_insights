import { Routes, Route } from "react-router-dom";
import { Header } from "./components/Header";
import { Dashboard } from "./pages/Dashboard";
import AdminCards from "./pages/AdminCards";
import { AdminDashboard } from "./pages/AdminDashboard";
import Login from "./pages/Login";

export default function App() {
  return (
    <div className="app">
      <Header />
      <main className="main" style={{ height: "calc(100vh - 64px)" }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<AdminCards />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>
    </div>
  );
}
