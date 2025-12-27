import { Router } from "express";
import { pool } from "../db";
// import { auth, requireAdmin } from "../middleware";

const router = Router();
// Temporarily disabled for testing
// router.use(auth, requireAdmin);

router.get("/cards", async (_, res) => {
const { rows } = await pool.query("SELECT * FROM dashboard_cards");
res.json(rows);
});

router.post("/cards", async (req, res) => {
  const { title, description, sql_query, visualization_type, chart_type, drilldown_enabled, drilldown_query } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO dashboard_cards (title, description, sql_query, visualization_type, chart_type, drilldown_enabled, drilldown_query)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [title, description, sql_query, visualization_type, chart_type || null, drilldown_enabled || false, drilldown_query || null]
  );
  res.json(rows[0]);
});

router.put("/cards/:id", async (req, res) => {
  const { id } = req.params;
  const { title, description, sql_query, visualization_type, chart_type, drilldown_enabled, drilldown_query, is_active } = req.body;
  const { rows } = await pool.query(
    `UPDATE dashboard_cards 
     SET title = $1, description = $2, sql_query = $3, visualization_type = $4, chart_type = $5, drilldown_enabled = $6, drilldown_query = $7, is_active = $8
     WHERE id = $9 RETURNING *`,
    [title, description, sql_query, visualization_type, chart_type || null, drilldown_enabled || false, drilldown_query || null, is_active, id]
  );
  res.json(rows[0]);
});

router.delete("/cards/:id", async (req, res) => {
const { id } = req.params;
await pool.query("DELETE FROM dashboard_cards WHERE id = $1", [id]);
res.json({ success: true });
});

export default router;
