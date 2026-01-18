-- Fix dashboard_layouts unique constraint to allow multiple layouts per tenant
-- Drop old incorrect constraint and add correct one

ALTER TABLE dashboard_layouts DROP CONSTRAINT IF EXISTS dashboard_layouts_tenant_id_key;

ALTER TABLE dashboard_layouts ADD CONSTRAINT dashboard_layouts_tenant_id_dashboard_id_key 
  UNIQUE(tenant_id, dashboard_id);
