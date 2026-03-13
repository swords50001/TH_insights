import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../api";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      return setError("Password must be at least 8 characters.");
    }
    if (password !== confirm) {
      return setError("Passwords do not match.");
    }

    setIsLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Reset failed. The link may have expired.");
    } finally {
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
        background: "linear-gradient(135deg, #688B2C 0%, #688B2C 100%)",
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
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div
            style={{
              fontSize: "32px",
              fontWeight: "700",
              background: "linear-gradient(135deg, #688B2C 0%, #688B2C 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              marginBottom: "8px",
            }}
          >
            Insights
          </div>
          <div style={{ fontSize: "15px", color: "#6b7280" }}>
            Choose a new password
          </div>
        </div>

        {!token ? (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#dc2626",
                padding: "16px",
                borderRadius: "8px",
                marginBottom: "24px",
                fontSize: "14px",
              }}
            >
              Invalid or missing reset link. Please request a new one.
            </div>
            <Link to="/forgot-password" style={{ color: "#688B2C", fontWeight: "600", fontSize: "14px" }}>
              Request new link
            </Link>
          </div>
        ) : success ? (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                color: "#166534",
                padding: "16px",
                borderRadius: "8px",
                marginBottom: "24px",
                fontSize: "14px",
              }}
            >
              Password updated! Redirecting you to sign in...
            </div>
            <Link to="/login" style={{ color: "#688B2C", fontWeight: "600", fontSize: "14px" }}>
              Sign In now →
            </Link>
          </div>
        ) : (
          <>
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

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "20px" }}>
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
                  New Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                  autoComplete="new-password"
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
                    e.target.style.borderColor = "#688B2C";
                    e.target.style.boxShadow = "0 0 0 3px rgba(104, 139, 44, 0.15)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e5e7eb";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label
                  htmlFor="confirm"
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "8px",
                  }}
                >
                  Confirm New Password
                </label>
                <input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
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
                    e.target.style.borderColor = "#688B2C";
                    e.target.style.boxShadow = "0 0 0 3px rgba(104, 139, 44, 0.15)";
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
                    : "linear-gradient(135deg, #688B2C 0%, #9AA882 100%)",
                  border: "none",
                  borderRadius: "8px",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  boxShadow: isLoading ? "none" : "0 4px 12px rgba(104, 139, 44, 0.4)",
                }}
              >
                {isLoading ? "Updating..." : "Set New Password"}
              </button>
            </form>

            <div
              style={{
                marginTop: "24px",
                paddingTop: "24px",
                borderTop: "1px solid #e5e7eb",
                textAlign: "center",
                fontSize: "14px",
              }}
            >
              <Link to="/login" style={{ color: "#688B2C", fontWeight: "600" }}>
                ← Back to Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
