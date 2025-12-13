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

export default router;
