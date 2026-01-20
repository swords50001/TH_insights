import { Router } from "express";
import bcrypt from "bcrypt";
import { pool } from "../db";
import { auth, requireAdmin, AuthRequest } from "../middleware";

const router = Router();
router.use(auth, requireAdmin);

// List users for current tenant
router.get("/", async (req: AuthRequest, res) => {
  try {
    const tenant_id = req.user?.tenant_id || "default";
    const { rows } = await pool.query(
      `SELECT id, email, name, role, is_active, created_at, updated_at
       FROM users
       WHERE tenant_id = $1
       ORDER BY created_at ASC`,
      [tenant_id]
    );
    res.json(rows);
  } catch (err: any) {
    console.error("Error fetching users:", err.message);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Create user
router.post("/", async (req: AuthRequest, res) => {
  try {
    const tenant_id = req.user?.tenant_id || "default";
    const { email, name, password, role = "user" } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    if (!["admin", "user"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      `INSERT INTO users (email, name, password_hash, role, tenant_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, name, role, is_active, created_at, updated_at`,
      [email, name || email, passwordHash, role, tenant_id]
    );

    res.status(201).json(rows[0]);
  } catch (err: any) {
    console.error("Error creating user:", err.message);
    if (err.code === "23505") {
      return res.status(409).json({ error: "Email already exists for this tenant" });
    }
    res.status(500).json({ error: "Failed to create user" });
  }
});

// Helper to ensure we do not remove the last admin
async function ensureNotLastAdmin(tenant_id: string, removeAdmin: boolean) {
  if (!removeAdmin) return;
  const { rows } = await pool.query(
    `SELECT COUNT(*) AS count FROM users WHERE tenant_id = $1 AND role = 'admin' AND is_active = true`,
    [tenant_id]
  );
  const adminCount = parseInt(rows[0].count, 10) || 0;
  if (adminCount <= 1) {
    throw new Error("last_admin");
  }
}

// Update user (name/role/status/password)
router.put("/:id", async (req: AuthRequest, res) => {
  try {
    const tenant_id = req.user?.tenant_id || "default";
    const userId = parseInt(req.params.id, 10);
    const { name, role, is_active, password } = req.body;

    if (role && !["admin", "user"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const existing = await pool.query(
      `SELECT id, role, is_active FROM users WHERE id = $1 AND tenant_id = $2`,
      [userId, tenant_id]
    );
    if (!existing.rows.length) {
      return res.status(404).json({ error: "User not found" });
    }
    const current = existing.rows[0];

    const removingAdmin =
      current.role === "admin" && current.is_active === true &&
      ((role && role !== "admin") || (is_active === false));

    await ensureNotLastAdmin(tenant_id, removingAdmin);

    const updates: string[] = ["updated_at = NOW()"];
    const values: any[] = [];

    if (name !== undefined) {
      updates.push(`name = $${updates.length + 1}`);
      values.push(name || null);
    }
    if (role !== undefined) {
      updates.push(`role = $${updates.length + 1}`);
      values.push(role);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${updates.length + 1}`);
      values.push(!!is_active);
    }
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      updates.push(`password_hash = $${updates.length + 1}`);
      values.push(hash);
    }

    if (updates.length === 1) {
      return res.status(400).json({ error: "No changes provided" });
    }

    const sql = `UPDATE users SET ${updates.join(", ")} WHERE id = $${updates.length + 1} AND tenant_id = $${updates.length + 2} RETURNING id, email, name, role, is_active, created_at, updated_at`;
    values.push(userId, tenant_id);
    const { rows } = await pool.query(sql, values);
    res.json(rows[0]);
  } catch (err: any) {
    if (err.message === "last_admin") {
      return res.status(400).json({ error: "Cannot remove the last active admin" });
    }
    console.error("Error updating user:", err.message);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// Soft delete (deactivate) user
router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const tenant_id = req.user?.tenant_id || "default";
    const userId = parseInt(req.params.id, 10);

    const existing = await pool.query(
      `SELECT id, role, is_active FROM users WHERE id = $1 AND tenant_id = $2`,
      [userId, tenant_id]
    );
    if (!existing.rows.length) {
      return res.status(404).json({ error: "User not found" });
    }
    const current = existing.rows[0];

    const removingAdmin = current.role === "admin" && current.is_active === true;
    await ensureNotLastAdmin(tenant_id, removingAdmin);

    const { rows } = await pool.query(
      `UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING id, email, name, role, is_active, created_at, updated_at`,
      [userId, tenant_id]
    );

    res.json(rows[0]);
  } catch (err: any) {
    if (err.message === "last_admin") {
      return res.status(400).json({ error: "Cannot remove the last active admin" });
    }
    console.error("Error deleting user:", err.message);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

export default router;
