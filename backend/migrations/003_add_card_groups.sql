-- Migration: Add card grouping capability
-- Description: Allows admins to organize cards into groups with headers

-- Add group_name column (name of the group/container this card belongs to)
ALTER TABLE dashboard_cards 
ADD COLUMN IF NOT EXISTS group_name VARCHAR(100);

-- Add group_order column (controls the order of groups on the dashboard)
ALTER TABLE dashboard_cards 
ADD COLUMN IF NOT EXISTS group_order INTEGER DEFAULT 0;

-- Create index for efficient group queries
CREATE INDEX IF NOT EXISTS idx_cards_group ON dashboard_cards(tenant_id, group_name, group_order);

-- Add comments for documentation
COMMENT ON COLUMN dashboard_cards.group_name IS 'Name of the group/container this card belongs to. NULL means ungrouped.';
COMMENT ON COLUMN dashboard_cards.group_order IS 'Display order of the group. Lower numbers appear first.';
