import { useState } from "react";
import { api } from "../api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      location.href = "/";
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
          padding: "48px",
          width: "100%",
          maxWidth: "440px",
        }}
      >
        {/* Logo/Header */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div
            style={{
              fontSize: "32px",
              fontWeight: "700",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              marginBottom: "8px",
            }}
          >
            Insights
          </div>
          <div style={{ fontSize: "15px", color: "#6b7280" }}>
            Sign in to your account
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#dc2626",
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "24px",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={login}>
          <div style={{ marginBottom: "20px" }}>
            <label
              htmlFor="email"
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                color: "#374151",
                marginBottom: "8px",
              }}
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              style={{
                width: "100%",
                padding: "12px 16px",
                fontSize: "15px",
                border: "2px solid #e5e7eb",
                borderRadius: "8px",
                outline: "none",
                transition: "all 0.2s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#667eea";
                e.target.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e5e7eb";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label
              htmlFor="password"
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                color: "#374151",
                marginBottom: "8px",
              }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              style={{
                width: "100%",
                padding: "12px 16px",
                fontSize: "15px",
                border: "2px solid #e5e7eb",
                borderRadius: "8px",
                outline: "none",
                transition: "all 0.2s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#667eea";
                e.target.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e5e7eb";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "14px",
              fontSize: "16px",
              fontWeight: "600",
              color: "#ffffff",
              background: isLoading
                ? "#9ca3af"
                : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              border: "none",
              borderRadius: "8px",
              cursor: isLoading ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              boxShadow: isLoading
                ? "none"
                : "0 4px 12px rgba(102, 126, 234, 0.4)",
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 6px 20px rgba(102, 126, 234, 0.5)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 4px 12px rgba(102, 126, 234, 0.4)";
              }
            }}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Footer */}
        <div
          style={{
            marginTop: "24px",
            paddingTop: "24px",
            borderTop: "1px solid #e5e7eb",
            textAlign: "center",
            fontSize: "14px",
            color: "#6b7280",
          }}
        >
          Need help? Contact your administrator
        </div>
      </div>
    </div>
  );
}
