import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.error || "Something went wrong. Please try again.");
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
            Reset your password
          </div>
        </div>

        {submitted ? (
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
              If an account exists for <strong>{email}</strong>, you'll receive a
              reset link shortly. Check your inbox (and spam folder).
            </div>
            <Link
              to="/login"
              style={{ color: "#688B2C", fontWeight: "600", fontSize: "14px" }}
            >
              ← Back to Sign In
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

            <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "24px" }}>
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "24px" }}>
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
                {isLoading ? "Sending..." : "Send Reset Link"}
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
