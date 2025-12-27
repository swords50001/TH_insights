import { Router } from "express";
import { pool } from "../db";
import { auth, AuthRequest } from "../middleware";

const router = Router();
router.use(auth);

// Get published layout for current tenant
router.get("/layout", async (req: AuthRequest, res) => {
  const tenant_id = req.user?.tenant_id || 'default';
  
  try {
    const result = await pool.query(
      "SELECT layout_data, published_at, published_by FROM dashboard_layouts WHERE tenant_id = $1",
      [tenant_id]
    );
    
    if (result.rows.length === 0) {
      return res.json(null);
    }
    
    res.json(result.rows[0]);
  } catch (err: any) {
    console.error("Error fetching layout:", err);
    res.status(500).json({ error: "Failed to fetch layout" });
  }
});

// Publish layout for current tenant (admin only)
router.post("/layout", async (req: AuthRequest, res) => {
  const tenant_id = req.user?.tenant_id || 'default';
  const user_id = req.user?.id;
  const { cards } = req.body;
  
  if (!cards || !Array.isArray(cards)) {
    return res.status(400).json({ error: "Invalid layout data" });
  }
  
  // Verify user is admin
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: "Admin access required" });
  }
  
  try {
    const layout_data = { cards, publishedAt: new Date().toISOString(), publishedBy: user_id };
    
    // Upsert the layout
    const result = await pool.query(
      `INSERT INTO dashboard_layouts (tenant_id, layout_data, published_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (tenant_id) 
       DO UPDATE SET layout_data = $2, published_by = $3, published_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [tenant_id, JSON.stringify(layout_data), user_id]
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
