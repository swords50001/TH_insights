import { Router } from "express";
import { pool } from "../db";
import { auth } from "../middleware";


const router = Router();

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
try {
  const { rows } = await pool.query(
    `SELECT 
      id, title, description, sql_query, visualization_type, chart_type,
      drilldown_enabled, drilldown_query, hide_title, font_size, font_family,
      group_name, group_order, header_bg_color, header_text_color,
      conditional_formatting, pivot_enabled, pivot_config, is_active, created_at, updated_at
    FROM dashboard_cards WHERE is_active=true`
  );
  
  console.log('=== DASHBOARD CARDS API ===');
  console.log('Total cards:', rows.length);
  const card7 = rows.find(r => r.id === 7);
  console.log('Card 7 conditional_formatting:', card7?.conditional_formatting);
  console.log('Card 7 typeof:', typeof card7?.conditional_formatting);
  console.log('Card 7 full:', JSON.stringify(card7, null, 2));
  console.log('=========================');
  
  res.json(rows);
} catch (err: any) {
  console.error('Error fetching cards:', err);
  res.status(500).json({ error: err.message });
}
});


router.post("/cards/:id/data", auth, async (req, res) => {
  try {
    console.log('=== CARD DATA REQUEST ===');
    console.log('Card ID:', req.params.id);
    
    const { rows } = await pool.query(
      "SELECT sql_query, pivot_enabled, pivot_config FROM dashboard_cards WHERE id=$1",
      [req.params.id]
    );
    
    if (!rows[0]) {
      console.log('Card not found:', req.params.id);
      return res.status(404).json({ error: "Card not found" });
    }
    
    const originalSql = rows[0].sql_query;
    const pivotEnabled = rows[0].pivot_enabled;
    const pivotConfig = rows[0].pivot_config;
    const filterParams = req.body?.filters || {};
    
    console.log('Original SQL:', originalSql);
    console.log('Filter parameters:', filterParams);
    console.log('Pivot enabled:', pivotEnabled);
    console.log('Pivot enabled type:', typeof pivotEnabled);
    console.log('Pivot config:', pivotConfig);
    console.log('Pivot config type:', typeof pivotConfig);
    
    // Substitute parameters in the SQL query
    const { query: processedSql, values } = substituteParameters(originalSql, filterParams);
    
    console.log('Processed SQL:', processedSql);
    console.log('Values:', values);
    
    const data = await pool.query(processedSql, values);
    
    // Apply pivot transformation if enabled
    let resultData = data.rows;
    if (pivotEnabled && pivotConfig) {
      console.log('Applying pivot transformation...');
      const pivotedData = transformToPivot(data.rows, pivotConfig);
      console.log('Pivot result:', pivotedData.length, 'rows');
      
      // Return both pivoted data and raw data for drill-down
      res.json({
        data: pivotedData,
        rawData: data.rows,
        pivotConfig: pivotConfig
      });
    } else {
      res.json(resultData);
    }
  } catch (error: any) {
    console.error('Error executing card SQL', error.message);
    res.status(500).json({ error: 'Failed to execute query' });
  }
});


export default router;
