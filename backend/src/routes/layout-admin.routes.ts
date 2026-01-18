import { Router } from "express";
import { pool } from "../db";
import { auth, requireAdmin, AuthRequest } from "../middleware";

const router = Router();
router.use(auth, requireAdmin);

// Export all published layouts for current tenant, with dashboard names
router.get("/export", async (req: AuthRequest, res) => {
  const tenant_id = req.user?.tenant_id || 'default';
  try {
    const { rows } = await pool.query(
      `SELECT dl.dashboard_id, dl.layout_data, dl.published_at, dl.published_by, d.name as dashboard_name
       FROM dashboard_layouts dl
       JOIN dashboards d ON dl.dashboard_id = d.id
       WHERE dl.tenant_id = $1
       ORDER BY d.tab_order, d.id`,
      [tenant_id]
    );
    res.json(rows);
  } catch (err: any) {
    console.error("Error exporting layouts:", err);
    res.status(500).json({ error: err.message || "Failed to export layouts" });
  }
});

// Import layouts for current tenant (admin only)
// Accepts either an array of {dashboard_id?, dashboard_name?, layout_data}
// or { layouts: [...] }
router.post("/import", async (req: AuthRequest, res) => {
  const tenant_id = req.user?.tenant_id || 'default';
  const user_id = req.user?.id;
  const payload = Array.isArray(req.body) ? req.body : req.body?.layouts;

  if (!payload || !Array.isArray(payload)) {
    return res.status(400).json({ error: "Invalid payload. Provide an array of layouts or { layouts: [...] }." });
  }

  const client = await pool.connect();
  const results: any[] = [];
  let upserts = 0;

  try {
    await client.query('BEGIN');

    for (const item of payload) {
      let targetDashboardId = item.dashboard_id;

      // Resolve dashboard by name if id not provided
      if (!targetDashboardId && item.dashboard_name) {
        const dash = await client.query(
          'SELECT id FROM dashboards WHERE tenant_id = $1 AND name = $2 LIMIT 1',
          [tenant_id, item.dashboard_name]
        );
        if (dash.rows.length) {
          targetDashboardId = dash.rows[0].id;
        }
      }

      // Fallback to first active dashboard if still not resolved
      if (!targetDashboardId) {
        const dash = await client.query(
          'SELECT id FROM dashboards WHERE tenant_id = $1 AND is_active = true ORDER BY tab_order, id LIMIT 1',
          [tenant_id]
        );
        if (!dash.rows.length) {
          // skip if no dashboard exists
          continue;
        }
        targetDashboardId = dash.rows[0].id;
      }

      const layout_data = typeof item.layout_data === 'string' ? item.layout_data : JSON.stringify(item.layout_data || {});

      const { rows } = await client.query(
        `INSERT INTO dashboard_layouts (tenant_id, dashboard_id, layout_data, published_by)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (tenant_id, dashboard_id)
         DO UPDATE SET layout_data = $3, published_by = $4, published_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [tenant_id, targetDashboardId, layout_data, user_id]
      );
      upserts += 1;
      results.push(rows[0]);
    }

    await client.query('COMMIT');
    res.json({ upserts, items: results });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Error importing layouts:', err);
    res.status(500).json({ error: err.message || 'Failed to import layouts' });
  } finally {
    client.release();
  }
});

export default router;
