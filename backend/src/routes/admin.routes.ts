import { Router } from "express";
import { pool } from "../db";
import { auth, requireAdmin, AuthRequest } from "../middleware";

const router = Router();
// Re-enable authentication for production
router.use(auth, requireAdmin);

router.get("/cards", async (req: AuthRequest, res) => {
const tenant_id = req.user?.tenant_id || 'default';
const { rows } = await pool.query("SELECT * FROM dashboard_cards WHERE tenant_id = $1", [tenant_id]);
res.json(rows);
});

router.post("/cards", async (req: AuthRequest, res) => {
  const { title, description, sql_query, visualization_type, chart_type, drilldown_enabled, drilldown_query, hide_title, font_size, font_family, group_name, group_order, header_bg_color, header_text_color, conditional_formatting } = req.body;
  const tenant_id = req.user?.tenant_id || 'default';
  const { rows } = await pool.query(
    `INSERT INTO dashboard_cards (title, description, sql_query, visualization_type, chart_type, drilldown_enabled, drilldown_query, hide_title, font_size, font_family, group_name, group_order, header_bg_color, header_text_color, conditional_formatting, tenant_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
    [title, description, sql_query, visualization_type, chart_type || null, drilldown_enabled || false, drilldown_query || null, hide_title || false, font_size || 'medium', font_family || 'default', group_name || null, group_order || 0, header_bg_color || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', header_text_color || '#ffffff', conditional_formatting ? JSON.stringify(conditional_formatting) : '[]', tenant_id]
  );
  res.json(rows[0]);
});

router.put("/cards/:id", async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { title, description, sql_query, visualization_type, chart_type, drilldown_enabled, drilldown_query, hide_title, is_active, font_size, font_family, group_name, group_order, header_bg_color, header_text_color, conditional_formatting } = req.body;
  const tenant_id = req.user?.tenant_id || 'default';
  const { rows } = await pool.query(
    `UPDATE dashboard_cards 
     SET title = $1, description = $2, sql_query = $3, visualization_type = $4, chart_type = $5, drilldown_enabled = $6, drilldown_query = $7, hide_title = $8, is_active = $9, font_size = $10, font_family = $11, group_name = $12, group_order = $13, header_bg_color = $14, header_text_color = $15, conditional_formatting = $16
     WHERE id = $17 AND tenant_id = $18 RETURNING *`,
    [title, description, sql_query, visualization_type, chart_type || null, drilldown_enabled || false, drilldown_query || null, hide_title || false, is_active, font_size || 'medium', font_family || 'default', group_name || null, group_order || 0, header_bg_color || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', header_text_color || '#ffffff', conditional_formatting ? JSON.stringify(conditional_formatting) : '[]', id, tenant_id]
  );
  res.json(rows[0]);
});

router.delete("/cards/:id", async (req: AuthRequest, res) => {
const { id } = req.params;
const tenant_id = req.user?.tenant_id || 'default';
await pool.query("DELETE FROM dashboard_cards WHERE id = $1 AND tenant_id = $2", [id, tenant_id]);
res.json({ success: true });
});

export default router;
