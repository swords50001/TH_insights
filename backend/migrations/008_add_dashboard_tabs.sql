-- Add dashboard tabs support for multiple tabbed dashboards

-- Create dashboards table
CREATE TABLE IF NOT EXISTS dashboards (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL DEFAULT 'default',
  name VARCHAR(255) NOT NULL,
  description TEXT,
  tab_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for tenant queries
CREATE INDEX IF NOT EXISTS idx_dashboards_tenant ON dashboards(tenant_id, is_active, tab_order);

-- Add dashboard_id to dashboard_layouts table
ALTER TABLE dashboard_layouts 
ADD COLUMN IF NOT EXISTS dashboard_id INTEGER REFERENCES dashboards(id) ON DELETE CASCADE;

-- Create index for dashboard layouts
CREATE INDEX IF NOT EXISTS idx_layouts_dashboard ON dashboard_layouts(tenant_id, dashboard_id);

-- Create a default dashboard for existing tenants
INSERT INTO dashboards (tenant_id, name, description, tab_order, is_active)
SELECT DISTINCT tenant_id, 'Main Dashboard', 'Primary dashboard view', 0, true
FROM dashboard_layouts
WHERE NOT EXISTS (
  SELECT 1 FROM dashboards WHERE dashboards.tenant_id = dashboard_layouts.tenant_id
)
ON CONFLICT DO NOTHING;

-- Update existing layouts to reference the default dashboard
UPDATE dashboard_layouts
SET dashboard_id = (
  SELECT id FROM dashboards 
  WHERE dashboards.tenant_id = dashboard_layouts.tenant_id 
  AND tab_order = 0
  LIMIT 1
)
WHERE dashboard_id IS NULL;

-- Comments for documentation
COMMENT ON TABLE dashboards IS 'Stores dashboard tab definitions for multi-tab dashboard support';
COMMENT ON COLUMN dashboards.name IS 'Display name for the dashboard tab';
COMMENT ON COLUMN dashboards.tab_order IS 'Order of tabs from left to right (0-based)';
COMMENT ON COLUMN dashboard_layouts.dashboard_id IS 'References which dashboard this layout belongs to';
