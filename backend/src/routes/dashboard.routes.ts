import { Router } from "express";
import { pool } from "../db";
import { auth } from "../middleware";


const router = Router();

// Helper function to substitute SQL parameters
function substituteParameters(sql: string, params: Record<string, any>): { query: string; values: any[] } {
  const values: any[] = [];
  let paramIndex = 1;
  
  // Replace named parameters (:param_name) with PostgreSQL positional parameters ($1, $2, etc.)
  let processedSql = sql;
  
  // Find all :parameter_name patterns
  const paramPattern = /:([a-zA-Z_][a-zA-Z0-9_]*)/g;
  const matches = [...sql.matchAll(paramPattern)];
  
  // Track which parameters we've processed to avoid double replacement
  const processed = new Set<string>();
  
  for (const match of matches) {
    const paramName = match[1];
    
    // Skip if already processed
    if (processed.has(paramName)) continue;
    processed.add(paramName);
    
    const paramValue = params[paramName];
    
    if (paramValue !== undefined && paramValue !== null && paramValue !== '') {
      // Replace ALL occurrences of this named parameter with a positional parameter
      const regex = new RegExp(`:${paramName}\\b`, 'g');
      processedSql = processedSql.replace(regex, `$${paramIndex}`);
      values.push(paramValue);
      paramIndex++;
    } else {
      // Replace with a value that will match everything (1=1 for conditions)
      // This is safer than NULL which would break WHERE clauses
      const regex = new RegExp(`:${paramName}\\b`, 'g');
      processedSql = processedSql.replace(regex, `'%'`); // Use wildcard for LIKE, or TRUE for boolean contexts
    }
  }
  
  return { query: processedSql, values };
}


router.get("/cards", auth, async (req: any, res) => {
const { rows } = await pool.query(
`SELECT * FROM dashboard_cards WHERE is_active=true`
);
res.json(rows);
});


router.post("/cards/:id/data", auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT sql_query FROM dashboard_cards WHERE id=$1",
      [req.params.id]
    );
    
    if (!rows[0]) {
      return res.status(404).json({ error: "Card not found" });
    }
    
    const originalSql = rows[0].sql_query;
    const filterParams = req.body?.filters || {};
    
    console.log('Original SQL:', originalSql);
    console.log('Filter parameters:', filterParams);
    
    // Substitute parameters in the SQL query
    const { query: processedSql, values } = substituteParameters(originalSql, filterParams);
    
    console.log('Processed SQL:', processedSql);
    console.log('Values:', values);
    
    const data = await pool.query(processedSql, values);
    res.json(data.rows);
  } catch (error: any) {
    console.error('Error executing card SQL', error.message);
    res.status(500).json({ error: 'Failed to execute query' });
  }
});


export default router;
