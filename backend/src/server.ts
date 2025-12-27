import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { Pool } from "pg";
import dotenv from "dotenv";
import { auth } from "./middleware";
import { tenantResolver, getTenantConfig } from "./tenant";
import adminRoutes from "./routes/admin.routes";

dotenv.config();

const app = express();
const PORT = 8080;

/* ---------------- MIDDLEWARE ---------------- */

app.use(cors({ origin: ["http://localhost:5173", "http://localhost:3000"] }));
app.use(express.json());
app.use(tenantResolver);

/* ---------------- DATABASE ---------------- */

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: false // local dev
});

pool.connect()
  .then(() => console.log("Connected to database"))
  .catch((err: any) => console.error("DB connection error", err));

/* ---------------- AUTH HELPERS ---------------- */

const JWT_SECRET = process.env.JWT_SECRET;
const MAX_ROWS = parseInt(process.env.MAX_ROWS || "1000", 10);
const PROHIBITED_SQL = /(;|\b(insert|update|delete|drop|alter|create|truncate|grant|revoke|--|\/\*)\b)/i;
const ALLOWLIST_ENABLED = process.env.ALLOWLIST_ENABLED === "true";
const ALLOWED_CARD_IDS = new Set(
  (process.env.ALLOWED_CARD_IDS || "").split(",").map(s => s.trim()).filter(Boolean)
);
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

app.get("/dashboard/cards", async (_req, res) => {
  const result = await pool.query(
    "SELECT id, title, visualization_type, chart_type, drilldown_enabled, drilldown_query FROM dashboard_cards ORDER BY id"
  );
  res.json(result.rows);
});

// Preview endpoint for testing queries before saving (must be BEFORE /:id route)
app.post("/dashboard/cards/preview/data", async (req, res) => {
  const { sql_query } = req.body;

  if (!sql_query || typeof sql_query !== "string") {
    return res.status(400).json({ error: "SQL query is required" });
  }

  let sql = sql_query.trim();
  // Strip trailing semicolon if present
  sql = sql.replace(/;\s*$/, "");

  if (!/^\s*select\b/i.test(sql)) {
    return res.status(400).json({ error: "Only SELECT queries are allowed" });
  }

  if (PROHIBITED_SQL.test(sql)) {
    return res.status(400).json({ error: "Query contains prohibited keywords or multiple statements" });
  }

  try {
    // Execute the query but cap returned rows
    const wrapped = `SELECT * FROM (${sql}) AS subquery LIMIT ${MAX_ROWS}`;
    const data = await pool.query(wrapped);
    res.json(data.rows);
  } catch (err: any) {
    console.error("Error executing preview SQL", err);
    return res.status(400).json({ error: err.message || "Error executing query" });
  }
});

app.post("/dashboard/cards/:id/data", async (req, res) => {
  const { id } = req.params;

  const cardResult = await pool.query(
    "SELECT sql_query FROM dashboard_cards WHERE id = $1",
    [id]
  );

  if (!cardResult.rows.length) {
    return res.status(404).json({ error: "Card not found" });
  }

  let sql = cardResult.rows[0].sql_query as string;

  if (!sql || typeof sql !== "string") {
    return res.status(500).json({ error: "Invalid SQL for card" });
  }

  // If allowlist is enabled, only allow requests for cards in the allowlist.
  if (ALLOWLIST_ENABLED) {
    if (!ALLOWED_CARD_IDS.has(String(id))) {
      return res.status(403).json({ error: "This card is not allowed to run queries" });
    }
  }

  // Basic safety checks: only allow SELECT queries and disallow dangerous keywords/constructs.
  sql = sql.trim();
  // Strip trailing semicolon if present
  sql = sql.replace(/;\s*$/, "");

  if (!/^\s*select\b/i.test(sql)) {
    return res.status(400).json({ error: "Only SELECT queries are allowed for dashboard cards" });
  }

  if (PROHIBITED_SQL.test(sql)) {
    return res.status(400).json({ error: "Query contains prohibited keywords or multiple statements" });
  }

  try {
    // Execute the query but cap returned rows by wrapping in a subselect with LIMIT to avoid huge responses.
    const wrapped = `SELECT * FROM (${sql}) AS subquery LIMIT ${MAX_ROWS}`;
    const data = await pool.query(wrapped);
    res.json(data.rows);
  } catch (err: any) {
    console.error("Error executing card SQL", err);
    return res.status(500).json({ error: "Error executing card query" });
  }
});

/* ---------------- ADMIN ROUTES ---------------- */

app.use('/admin', adminRoutes);

/* ---------------- TENANT / WHITELABEL ---------------- */

app.get('/tenant/config', (_req, res) => {
  // tenantResolver attaches tenant config to the request
  // cast to any to avoid import cycles in types
  // @ts-ignore
  const cfg = getTenantConfig(_req as any);
  if (!cfg) return res.status(404).json({ error: 'Tenant not found' });
  return res.json(cfg);
});

/* ---------------- HEALTH ---------------- */

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

/* ---------------- START SERVER ---------------- */

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
