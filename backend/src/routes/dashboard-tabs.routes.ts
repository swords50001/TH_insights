import { Router } from "express";
import { pool } from "../db";
import { auth, requireAdmin, AuthRequest } from "../middleware";

const router = Router();

// Get the most recently published dashboard for the tenant
router.get("/most-recent-published", auth, async (req: AuthRequest, res) => {
  try {
    const tenant_id = req.user?.tenant_id || 'default';
    const { rows } = await pool.query(
      `SELECT dl.dashboard_id, dl.published_at
       FROM dashboard_layouts dl
       JOIN dashboards d ON dl.dashboard_id = d.id
       WHERE dl.tenant_id = $1 AND d.is_active = true AND dl.published_at IS NOT NULL
       ORDER BY dl.published_at DESC
       LIMIT 1`,
      [tenant_id]
    );
    
    if (rows.length === 0) {
      return res.json(null);
    }
    
    res.json(rows[0]);
  } catch (err: any) {
    console.error('Error fetching most recent dashboard:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get all dashboards for the tenant
router.get("/", auth, async (req: AuthRequest, res) => {
  try {
    const tenant_id = req.user?.tenant_id || 'default';
    const { rows } = await pool.query(
      `SELECT id, name, description, tab_order, icon, color, is_active, created_at, updated_at 
       FROM dashboards 
       WHERE tenant_id = $1 AND is_active = true
       ORDER BY tab_order, id`,
      [tenant_id]
    );
    res.json(rows);
  } catch (err: any) {
    console.error('Error fetching dashboards:', err);
    res.status(500).json({ error: err.message });
  }
});

// Create a new dashboard (admin only)
router.post("/", auth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { name, description, tab_order, icon, color } = req.body;
    const tenant_id = req.user?.tenant_id || 'default';
    
    const { rows } = await pool.query(
      `INSERT INTO dashboards (tenant_id, name, description, tab_order, icon, color, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true) RETURNING *`,
      [tenant_id, name, description || null, tab_order || 0, icon || null, color || '#3b82f6']
    );
    res.json(rows[0]);
  } catch (err: any) {
    console.error('Error creating dashboard:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update dashboard (admin only)
router.put("/:id", auth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, description, tab_order, icon, color, is_active } = req.body;
    const tenant_id = req.user?.tenant_id || 'default';
    
    const { rows } = await pool.query(
      `UPDATE dashboards 
       SET name = $1, description = $2, tab_order = $3, icon = $4, color = $5, is_active = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 AND tenant_id = $8 RETURNING *`,
      [name, description, tab_order, icon, color, is_active, id, tenant_id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }
    
    res.json(rows[0]);
  } catch (err: any) {
    console.error('Error updating dashboard:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete dashboard (admin only)
router.delete("/:id", auth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const tenant_id = req.user?.tenant_id || 'default';
    
    // Check if this is the last dashboard
    const countResult = await pool.query(
      'SELECT COUNT(*) as count FROM dashboards WHERE tenant_id = $1 AND is_active = true',
      [tenant_id]
    );
    
    if (parseInt(countResult.rows[0].count) <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last dashboard' });
    }
    
    await pool.query(
      'DELETE FROM dashboards WHERE id = $1 AND tenant_id = $2',
      [id, tenant_id]
    );
    
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting dashboard:', err);
    res.status(500).json({ error: err.message });
  }
});

// Duplicate dashboard layout (admin only)
router.post("/:id/duplicate", auth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { target_dashboard_id } = req.body;
    const tenant_id = req.user?.tenant_id || 'default';
    const user_id = req.user?.id;
    
    // Get source layout
    const sourceResult = await pool.query(
      'SELECT layout_data FROM dashboard_layouts WHERE tenant_id = $1 AND dashboard_id = $2',
      [tenant_id, id]
    );
    
    if (sourceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Source layout not found' });
    }
    
    const layout_data = sourceResult.rows[0].layout_data;
    
    // Insert/update target layout
    const result = await pool.query(
      `INSERT INTO dashboard_layouts (tenant_id, dashboard_id, layout_data, published_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (tenant_id, dashboard_id) 
       DO UPDATE SET layout_data = $3, published_by = $4, published_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [tenant_id, target_dashboard_id, layout_data, user_id]
    );
    
    res.json(result.rows[0]);
  } catch (err: any) {
    console.error('Error duplicating layout:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
