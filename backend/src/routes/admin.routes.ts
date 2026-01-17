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
  const { title, description, sql_query, visualization_type, chart_type, drilldown_enabled, drilldown_query, hide_title, font_size, font_family, group_name, group_order, header_bg_color, header_text_color, conditional_formatting, pivot_enabled, pivot_config } = req.body;
  const tenant_id = req.user?.tenant_id || 'default';
  const { rows } = await pool.query(
    `INSERT INTO dashboard_cards (title, description, sql_query, visualization_type, chart_type, drilldown_enabled, drilldown_query, hide_title, font_size, font_family, group_name, group_order, header_bg_color, header_text_color, conditional_formatting, pivot_enabled, pivot_config, tenant_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
    [title, description, sql_query, visualization_type, chart_type || null, drilldown_enabled || false, drilldown_query || null, hide_title || false, font_size || 'medium', font_family || 'default', group_name || null, group_order || 0, header_bg_color || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', header_text_color || '#ffffff', conditional_formatting ? JSON.stringify(conditional_formatting) : '[]', pivot_enabled || false, pivot_config ? JSON.stringify(pivot_config) : null, tenant_id]
  );
  res.json(rows[0]);
});

router.put("/cards/:id", async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { title, description, sql_query, visualization_type, chart_type, drilldown_enabled, drilldown_query, hide_title, is_active, font_size, font_family, group_name, group_order, header_bg_color, header_text_color, conditional_formatting, pivot_enabled, pivot_config } = req.body;
  const tenant_id = req.user?.tenant_id || 'default';
  const { rows } = await pool.query(
    `UPDATE dashboard_cards 
     SET title = $1, description = $2, sql_query = $3, visualization_type = $4, chart_type = $5, drilldown_enabled = $6, drilldown_query = $7, hide_title = $8, is_active = $9, font_size = $10, font_family = $11, group_name = $12, group_order = $13, header_bg_color = $14, header_text_color = $15, conditional_formatting = $16, pivot_enabled = $17, pivot_config = $18
     WHERE id = $19 AND tenant_id = $20 RETURNING *`,
    [title, description, sql_query, visualization_type, chart_type || null, drilldown_enabled || false, drilldown_query || null, hide_title || false, is_active, font_size || 'medium', font_family || 'default', group_name || null, group_order || 0, header_bg_color || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', header_text_color || '#ffffff', conditional_formatting ? JSON.stringify(conditional_formatting) : '[]', pivot_enabled || false, pivot_config ? JSON.stringify(pivot_config) : null, id, tenant_id]
  );
  res.json(rows[0]);
});

router.delete("/cards/:id", async (req: AuthRequest, res) => {
const { id } = req.params;
const tenant_id = req.user?.tenant_id || 'default';
await pool.query("DELETE FROM dashboard_cards WHERE id = $1 AND tenant_id = $2", [id, tenant_id]);
res.json({ success: true });
});

// Export all cards for current tenant (admin only)
router.get("/cards/export", async (req: AuthRequest, res) => {
  const tenant_id = req.user?.tenant_id || 'default';
  const { rows } = await pool.query(
    "SELECT * FROM dashboard_cards WHERE tenant_id = $1 ORDER BY group_order, id",
    [tenant_id]
  );
  res.json(rows);
});

// Import cards for current tenant (admin only)
// Accepts either an array of card objects or { cards: [...] }
router.post("/cards/import", async (req: AuthRequest, res) => {
  const tenant_id = req.user?.tenant_id || 'default';
  const payload = Array.isArray(req.body) ? req.body : req.body?.cards;

  if (!payload || !Array.isArray(payload)) {
    return res.status(400).json({ error: "Invalid payload. Provide an array of cards or { cards: [...] }." });
  }

  const client = await pool.connect();
  let inserted = 0;
  let updated = 0;
  const results: any[] = [];

  try {
    await client.query('BEGIN');

    for (const card of payload) {
      // Basic required fields
      if (!card.title || !card.sql_query || !card.visualization_type) {
        continue; // skip invalid entries
      }

      // Try to find existing by title within tenant
      const existing = await client.query(
        'SELECT id FROM dashboard_cards WHERE tenant_id = $1 AND title = $2 LIMIT 1',
        [tenant_id, card.title]
      );

      const params = [
        card.title,
        card.description || null,
        card.sql_query,
        card.visualization_type,
        card.chart_type || null,
        card.drilldown_enabled || false,
        card.drilldown_query || null,
        card.hide_title || false,
        card.is_active !== undefined ? !!card.is_active : true,
        card.font_size || 'medium',
        card.font_family || 'default',
        card.group_name || null,
        typeof card.group_order === 'number' ? card.group_order : 0,
        card.header_bg_color || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        card.header_text_color || '#ffffff',
        card.conditional_formatting ? JSON.stringify(card.conditional_formatting) : '[]',
        card.pivot_enabled || false,
        card.pivot_config ? JSON.stringify(card.pivot_config) : null,
      ];

      if (existing.rows.length) {
        const id = existing.rows[0].id;
        const { rows } = await client.query(
          `UPDATE dashboard_cards 
           SET title = $1, description = $2, sql_query = $3, visualization_type = $4, chart_type = $5, drilldown_enabled = $6, drilldown_query = $7, hide_title = $8, is_active = $9, font_size = $10, font_family = $11, group_name = $12, group_order = $13, header_bg_color = $14, header_text_color = $15, conditional_formatting = $16, pivot_enabled = $17, pivot_config = $18
           WHERE id = $19 AND tenant_id = $20 RETURNING *`,
          [...params, id, tenant_id]
        );
        updated += 1;
        results.push(rows[0]);
      } else {
        const { rows } = await client.query(
          `INSERT INTO dashboard_cards (title, description, sql_query, visualization_type, chart_type, drilldown_enabled, drilldown_query, hide_title, is_active, font_size, font_family, group_name, group_order, header_bg_color, header_text_color, conditional_formatting, pivot_enabled, pivot_config, tenant_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) RETURNING *`,
          [...params, tenant_id]
        );
        inserted += 1;
        results.push(rows[0]);
      }
    }

    await client.query('COMMIT');
    res.json({ inserted, updated, total: inserted + updated, items: results });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Error importing cards:', err);
    res.status(500).json({ error: err.message || 'Failed to import cards' });
  } finally {
    client.release();
  }
});

export default router;
