import { Router } from "express";
import { pool } from "../db";
import { auth, AuthRequest } from "../middleware";

const router = Router();
router.use(auth);

// Get published layout for current tenant and dashboard
router.get("/layout", async (req: AuthRequest, res) => {
  const tenant_id = req.user?.tenant_id || 'default';
  const dashboard_id = req.query.dashboard_id;
  
  try {
    let query, params;
    
    if (dashboard_id) {
      // Get layout for specific dashboard
      query = "SELECT layout_data, published_at, published_by, dashboard_id FROM dashboard_layouts WHERE tenant_id = $1 AND dashboard_id = $2";
      params = [tenant_id, dashboard_id];
    } else {
      // Get layout for first/default dashboard
      query = `SELECT dl.layout_data, dl.published_at, dl.published_by, dl.dashboard_id 
               FROM dashboard_layouts dl
               JOIN dashboards d ON dl.dashboard_id = d.id
               WHERE dl.tenant_id = $1 AND d.is_active = true
               ORDER BY d.tab_order, d.id
               LIMIT 1`;
      params = [tenant_id];
    }
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.json(null);
    }
    
    res.json(result.rows[0]);
  } catch (err: any) {
    console.error("Error fetching layout:", err);
    res.status(500).json({ error: "Failed to fetch layout" });
  }
});

// Publish layout for current tenant and dashboard (admin only)
router.post("/layout", async (req: AuthRequest, res) => {
  const tenant_id = req.user?.tenant_id || 'default';
  const user_id = req.user?.id;
  const { cards, groupPositions, dashboard_id } = req.body;
  
  if (!cards || !Array.isArray(cards)) {
    return res.status(400).json({ error: "Invalid layout data" });
  }
  
  // Verify user is admin
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: "Admin access required" });
  }
  
  try {
    // If dashboard_id not provided, use the first dashboard
    let targetDashboardId = dashboard_id;
    
    if (!targetDashboardId) {
      const dashResult = await pool.query(
        'SELECT id FROM dashboards WHERE tenant_id = $1 AND is_active = true ORDER BY tab_order, id LIMIT 1',
        [tenant_id]
      );
      
      if (dashResult.rows.length === 0) {
        return res.status(404).json({ error: "No dashboard found" });
      }
      
      targetDashboardId = dashResult.rows[0].id;
    }
    
    const layout_data = { 
      cards, 
      groupPositions: groupPositions || [],
      publishedAt: new Date().toISOString(), 
      publishedBy: user_id 
    };
    
    // Upsert the layout
    const result = await pool.query(
      `INSERT INTO dashboard_layouts (tenant_id, dashboard_id, layout_data, published_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (tenant_id, dashboard_id) 
       DO UPDATE SET layout_data = $3, published_by = $4, published_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [tenant_id, targetDashboardId, JSON.stringify(layout_data), user_id]
    );
    
    res.json(result.rows[0]);
  } catch (err: any) {
    console.error("Error publishing layout:", err);
    res.status(500).json({ error: "Failed to publish layout" });
  }
});

// Delete published layout for current tenant (admin only)
router.delete("/layout", async (req: AuthRequest, res) => {
  const tenant_id = req.user?.tenant_id || 'default';
  
  // Verify user is admin
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: "Admin access required" });
  }
  
  try {
    await pool.query(
      "DELETE FROM dashboard_layouts WHERE tenant_id = $1",
      [tenant_id]
    );
    
    res.json({ success: true });
  } catch (err: any) {
    console.error("Error deleting layout:", err);
    res.status(500).json({ error: "Failed to delete layout" });
  }
});

export default router;
