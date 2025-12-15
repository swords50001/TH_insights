import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { Pool } from "pg";
import dotenv from "dotenv";
import { auth } from "./middleware";

dotenv.config();

const app = express();
const PORT = 8080;

/* ---------------- MIDDLEWARE ---------------- */

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

/* ---------------- DATABASE ---------------- */

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false }
});

pool.connect()
  .then(() => console.log("Connected to database"))
  .catch(err => console.error("DB connection error", err));

/* ---------------- AUTH HELPERS ---------------- */

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET not set");
}

interface AuthRequest extends Request {
  user?: any;
}

/* ---------------- AUTH ROUTES ---------------- */

app.post("/auth/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const result = await pool.query(
    "SELECT id, password_hash, role FROM users WHERE email = $1",
    [email]
  );

  if (!result.rows.length) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const user = result.rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);

  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: "8h" }
  );

  res.json({ token });
});

/* ---------------- DASHBOARD ROUTES ---------------- */

app.get("/dashboard/cards", auth, async (_req, res) => {
  const result = await pool.query(
    "SELECT id, title, visualization_type FROM dashboard_cards ORDER BY id"
  );
  res.json(result.rows);
});

app.post("/dashboard/cards/:id/data", auth, async (req, res) => {
  const { id } = req.params;

  const cardResult = await pool.query(
    "SELECT sql_query FROM dashboard_cards WHERE id = $1",
    [id]
  );

  if (!cardResult.rows.length) {
    return res.status(404).json({ error: "Card not found" });
  }

  const sql = cardResult.rows[0].sql_query;
  const data = await pool.query(sql);

  res.json(data.rows);
});

/* ---------------- HEALTH ---------------- */

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

/* ---------------- START SERVER ---------------- */

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
