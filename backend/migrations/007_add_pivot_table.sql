-- Add pivot table support to dashboard cards

-- Add pivot table configuration columns
ALTER TABLE dashboard_cards 
ADD COLUMN IF NOT EXISTS pivot_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS pivot_config JSONB DEFAULT NULL;

-- Create index for pivot queries
CREATE INDEX IF NOT EXISTS idx_cards_pivot ON dashboard_cards(tenant_id, pivot_enabled);

-- Comment for documentation
COMMENT ON COLUMN dashboard_cards.pivot_enabled IS 'Whether this card displays data as a pivot table';
COMMENT ON COLUMN dashboard_cards.pivot_config IS 'Pivot table configuration: {rowFields: [], columnFields: [], valueField: "", aggregation: "sum"}';

-- Example pivot_config structure:
-- {
--   "rowFields": ["Region", "Product"],       // Fields to group by as rows
--   "columnFields": ["Year", "Quarter"],      // Fields to group by as columns
--   "valueField": "Sales",                    // Field to aggregate
--   "aggregation": "sum"                      // sum, avg, count, min, max
-- }
