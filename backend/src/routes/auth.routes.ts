import { Router } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { pool } from "../db";
import { signToken } from "../auth";

const router = Router();

function getMailTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const { rows } = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (!rows.length) return res.sendStatus(401);

    const valid = await bcrypt.compare(password, rows[0].password_hash);
    if (!valid) return res.sendStatus(401);

    res.json({ token: signToken(rows[0]) });
  } catch (err: any) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Login failed" });
  }
});

// Temporary signup endpoint - remove after creating users
router.post("/signup", async (req, res) => {
try {
const { email, password, name } = req.body;
const passwordHash = await bcrypt.hash(password, 10);
const { rows } = await pool.query(
"INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name",
[email, passwordHash, name || email]
);
res.json({ success: true, user: rows[0] });
} catch (error: any) {
res.status(400).json({ error: error.message });
}
});

// Forgot password - generates a reset token and sends email
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const { rows } = await pool.query(
      "SELECT id, name FROM users WHERE email = $1 AND is_active = true",
      [email]
    );

    // Always respond 200 to avoid leaking whether an account exists
    if (!rows.length) return res.json({ message: "If that email exists, a reset link has been sent." });

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await pool.query(
      "UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3",
      [token, expires, rows[0].id]
    );

    const appUrl = process.env.APP_URL || "https://insights.curametrix.com";
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    const transporter = getMailTransport();
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: "Insights – Password Reset Request",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #688B2C;">Reset your password</h2>
          <p>Hi ${rows[0].name || email},</p>
          <p>We received a request to reset your Insights password. Click the button below to choose a new one.</p>
          <p style="margin: 32px 0;">
            <a href="${resetUrl}"
               style="background: #688B2C; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
              Reset Password
            </a>
          </p>
          <p style="color: #6b7280; font-size: 13px;">This link expires in 1 hour. If you didn't request a reset, you can safely ignore this email.</p>
          <p style="color: #6b7280; font-size: 12px;">Or copy this link: ${resetUrl}</p>
        </div>
      `,
    });

    res.json({ message: "If that email exists, a reset link has been sent." });
  } catch (err: any) {
    console.error("Forgot password error:", err.message);
    res.status(500).json({ error: "Failed to send reset email" });
  }
});

// Reset password - validates token and updates password
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: "Token and password are required" });
    if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });

    const { rows } = await pool.query(
      "SELECT id FROM users WHERE password_reset_token = $1 AND password_reset_expires > NOW() AND is_active = true",
      [token]
    );

    if (!rows.length) return res.status(400).json({ error: "Reset link is invalid or has expired" });

    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      "UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL, updated_at = NOW() WHERE id = $2",
      [hash, rows[0].id]
    );

    res.json({ message: "Password updated successfully" });
  } catch (err: any) {
    console.error("Reset password error:", err.message);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

export default router;
