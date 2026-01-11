import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { Pool } from "pg";
import dotenv from "dotenv";
import { auth } from "./middleware";
import { tenantResolver, getTenantConfig } from "./tenant";
import { signToken } from "./auth";
import adminRoutes from "./routes/admin.routes";
import layoutRoutes from "./routes/layout.routes";
import filterRoutes from "./routes/filter.routes";
import dashboardTabsRoutes from "./routes/dashboard-tabs.routes";

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
    "SELECT id, password_hash, role, tenant_id FROM users WHERE email = $1",
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

  const token = signToken(user);

  res.json({ token });
});

/* ---------------- DASHBOARD ROUTES ---------------- */

app.get("/dashboard/cards", auth, async (req: AuthRequest, res) => {
  const tenant_id = req.user?.tenant_id || 'default';
  const result = await pool.query(
    "SELECT id, title, visualization_type, chart_type, drilldown_enabled, drilldown_query, hide_title, font_size, font_family, group_name, group_order, header_bg_color, header_text_color, conditional_formatting, pivot_enabled, pivot_config FROM dashboard_cards WHERE tenant_id = $1 ORDER BY group_order, id",
    [tenant_id]
  );
  res.json(result.rows);
});

// Preview endpoint for testing queries before saving (must be BEFORE /:id route)
app.post("/dashboard/cards/preview/data", auth, async (req: AuthRequest, res) => {
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

app.post("/dashboard/cards/:id/data", auth, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const tenant_id = req.user?.tenant_id || 'default';

  const cardResult = await pool.query(
    "SELECT sql_query, pivot_enabled, pivot_config FROM dashboard_cards WHERE id = $1 AND tenant_id = $2",
    [id, tenant_id]
  );

  if (!cardResult.rows.length) {
    return res.status(404).json({ error: "Card not found" });
  }

  let sql = cardResult.rows[0].sql_query as string;
  const pivotEnabled = cardResult.rows[0].pivot_enabled;
  const pivotConfig = cardResult.rows[0].pivot_config;

  console.log('=== CARD DATA REQUEST ===');
  console.log('Card ID:', id);
  console.log('Pivot enabled:', pivotEnabled);
  console.log('Pivot config:', pivotConfig);

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
    
    // Apply pivot transformation if enabled
    if (pivotEnabled && pivotConfig) {
      console.log('Applying pivot transformation...');
      const pivotedData = transformToPivot(data.rows, pivotConfig);
      console.log('Pivot result:', pivotedData.length, 'rows');
      
      // Return both pivoted data and raw data for drill-down
      return res.json({
        data: pivotedData,
        rawData: data.rows,
        pivotConfig: pivotConfig
      });
    }
    
    res.json(data.rows);
  } catch (err: any) {
    console.error("Error executing card SQL", err);
    return res.status(500).json({ error: "Error executing card query" });
  }
});

// Helper function to transform data into pivot table format
function transformToPivot(
  data: any[], 
  config: { 
    rowFields: string[]; 
    columnFields: string[]; 
    valueField: string; 
    aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max' 
  }
): any[] {
  if (!data.length) return [];
  
  const { rowFields, columnFields, valueField, aggregation } = config;
  
  // Group data by row and column combinations
  const pivotMap = new Map<string, Map<string, number[]>>();
  
  data.forEach(row => {
    const rowKey = rowFields.map(f => row[f] || '').join('|||');
    const colKey = columnFields.map(f => row[f] || '').join('|||');
    const value = parseFloat(row[valueField]) || 0;
    
    if (!pivotMap.has(rowKey)) {
      pivotMap.set(rowKey, new Map());
    }
    
    const colMap = pivotMap.get(rowKey)!;
    if (!colMap.has(colKey)) {
      colMap.set(colKey, []);
    }
    
    colMap.get(colKey)!.push(value);
  });
  
  // Get all unique column values
  const allColumns = new Set<string>();
  pivotMap.forEach(colMap => {
    colMap.forEach((_, colKey) => allColumns.add(colKey));
  });
  
  // Aggregate function
  const aggregate = (values: number[]): number => {
    if (!values.length) return 0;
    switch (aggregation) {
      case 'sum': return values.reduce((a, b) => a + b, 0);
      case 'avg': return values.reduce((a, b) => a + b, 0) / values.length;
      case 'count': return values.length;
      case 'min': return Math.min(...values);
      case 'max': return Math.max(...values);
      default: return 0;
    }
  };
  
  // Build result array
  const result: any[] = [];
  
  pivotMap.forEach((colMap, rowKey) => {
    const rowParts = rowKey.split('|||');
    const resultRow: any = {};
    
    // Add row field values
    rowFields.forEach((field, i) => {
      resultRow[field] = rowParts[i];
    });
    
    // Add aggregated values for each column
    allColumns.forEach(colKey => {
      const values = colMap.get(colKey) || [];
      const colParts = colKey.split('|||');
      const colLabel = columnFields.map((f, i) => `${f}:${colParts[i]}`).join(' ');
      resultRow[colLabel] = aggregate(values);
    });
    
    result.push(resultRow);
  });
  
  return result;
}

/* ---------------- ADMIN ROUTES ---------------- */

app.use('/admin', adminRoutes);
app.use('/admin', filterRoutes);
app.use('/admin/dashboards', dashboardTabsRoutes);

/* ---------------- LAYOUT ROUTES ---------------- */

app.use('/dashboard/layout', layoutRoutes);

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

/* ---------------- HEALTH CHECK ENDPOINTS ---------------- */

// Basic health check for ALB
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Detailed health check with database connection
app.get("/health/detailed", async (_req, res) => {
  try {
    // Check database connection
    const dbCheck = await pool.query("SELECT NOW()");
    
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected",
      uptime: process.uptime(),
      dbTime: dbCheck.rows[0].now,
    });
  } catch (err) {
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      database: "disconnected",
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
});

// Readiness check for Kubernetes/ECS
app.get("/ready", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({ ready: true });
  } catch (err) {
    res.status(503).json({ ready: false });
  }
});

/* ---------------- START SERVER ---------------- */

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
