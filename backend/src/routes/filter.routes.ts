import { Router } from "express";
import { pool } from "../db";
import { auth, AuthRequest } from "../middleware";

const router = Router();
router.use(auth);

// Get all filters for tenant
router.get("/filters", async (req: AuthRequest, res) => {
  const tenant_id = req.user?.tenant_id || 'default';
  
  try {
    const result = await pool.query(
      `SELECT id, name, filter_type, label, sql_parameter, options, default_value, is_active, display_order
       FROM dashboard_filters 
       WHERE tenant_id = $1 
       ORDER BY display_order, name`,
      [tenant_id]
    );
    
    res.json(result.rows);
  } catch (err: any) {
    console.error("Error fetching filters:", err);
    res.status(500).json({ error: "Failed to fetch filters" });
  }
});

// Create a new filter (admin only)
router.post("/filters", async (req: AuthRequest, res) => {
  const tenant_id = req.user?.tenant_id || 'default';
  
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: "Admin access required" });
  }
  
  const { name, filter_type, label, sql_parameter, options, default_value, display_order } = req.body;
  
  try {
    const result = await pool.query(
      `INSERT INTO dashboard_filters 
       (tenant_id, name, filter_type, label, sql_parameter, options, default_value, display_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [tenant_id, name, filter_type, label, sql_parameter, JSON.stringify(options || null), default_value, display_order || 0]
    );
    
    res.json(result.rows[0]);
  } catch (err: any) {
    console.error("Error creating filter:", err);
    res.status(500).json({ error: "Failed to create filter" });
  }
});

// Update a filter (admin only)
router.put("/filters/:id", async (req: AuthRequest, res) => {
  const tenant_id = req.user?.tenant_id || 'default';
  const { id } = req.params;
  
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: "Admin access required" });
  }
  
  const { name, filter_type, label, sql_parameter, options, default_value, is_active, display_order } = req.body;
  
  try {
    const result = await pool.query(
      `UPDATE dashboard_filters 
       SET name = $1, filter_type = $2, label = $3, sql_parameter = $4, 
           options = $5, default_value = $6, is_active = $7, display_order = $8
       WHERE id = $9 AND tenant_id = $10
       RETURNING *`,
      [name, filter_type, label, sql_parameter, JSON.stringify(options || null), default_value, is_active, display_order, id, tenant_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Filter not found" });
    }
    
    res.json(result.rows[0]);
  } catch (err: any) {
    console.error("Error updating filter:", err);
    res.status(500).json({ error: "Failed to update filter" });
  }
});

// Delete a filter (admin only)
router.delete("/filters/:id", async (req: AuthRequest, res) => {
  const tenant_id = req.user?.tenant_id || 'default';
  const { id } = req.params;
  
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: "Admin access required" });
  }
  
  try {
    const result = await pool.query(
      "DELETE FROM dashboard_filters WHERE id = $1 AND tenant_id = $2",
      [id, tenant_id]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Filter not found" });
    }
    
    res.json({ success: true });
  } catch (err: any) {
    console.error("Error deleting filter:", err);
    res.status(500).json({ error: "Failed to delete filter" });
  }
});

// Get filters for a specific card
router.get("/cards/:cardId/filters", async (req: AuthRequest, res) => {
  const tenant_id = req.user?.tenant_id || 'default';
  const { cardId } = req.params;
  
  try {
    const result = await pool.query(
      `SELECT df.*, cf.is_required
       FROM dashboard_filters df
       JOIN card_filters cf ON df.id = cf.filter_id
       WHERE cf.card_id = $1 AND df.tenant_id = $2 AND df.is_active = true
       ORDER BY df.display_order, df.name`,
      [cardId, tenant_id]
    );
    
    res.json(result.rows);
  } catch (err: any) {
    console.error("Error fetching card filters:", err);
    res.status(500).json({ error: "Failed to fetch card filters" });
  }
});

// Associate a filter with a card (admin only)
router.post("/cards/:cardId/filters/:filterId", async (req: AuthRequest, res) => {
  const { cardId, filterId } = req.params;
  const { is_required } = req.body;
  
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: "Admin access required" });
  }
  
  try {
    const result = await pool.query(
      `INSERT INTO card_filters (card_id, filter_id, is_required)
       VALUES ($1, $2, $3)
       ON CONFLICT (card_id, filter_id) DO UPDATE SET is_required = $3
       RETURNING *`,
      [cardId, filterId, is_required || false]
    );
    
    res.json(result.rows[0]);
  } catch (err: any) {
    console.error("Error associating filter with card:", err);
    res.status(500).json({ error: "Failed to associate filter" });
  }
});

// Remove a filter from a card (admin only)
router.delete("/cards/:cardId/filters/:filterId", async (req: AuthRequest, res) => {
  const { cardId, filterId } = req.params;
  
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: "Admin access required" });
  }
  
  try {
    const result = await pool.query(
      "DELETE FROM card_filters WHERE card_id = $1 AND filter_id = $2",
      [cardId, filterId]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Association not found" });
    }
    
    res.json({ success: true });
  } catch (err: any) {
    console.error("Error removing filter from card:", err);
    res.status(500).json({ error: "Failed to remove filter" });
  }
});

export default router;
