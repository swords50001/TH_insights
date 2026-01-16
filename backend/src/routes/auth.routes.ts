import { Router } from "express";
import bcrypt from "bcrypt";
import { pool } from "../db";
import { signToken } from "../auth";

const router = Router();

router.post("/login", async (req, res) => {
const { email, password } = req.body;
const { rows } = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
if (!rows.length) return res.sendStatus(401);

const valid = await bcrypt.compare(password, rows[0].password_hash);
if (!valid) return res.sendStatus(401);

res.json({ token: signToken(rows[0]) });
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

export default router;
