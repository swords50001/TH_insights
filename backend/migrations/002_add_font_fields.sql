-- Migration: Add font customization fields to dashboard_cards
-- Description: Allows admins to customize font size and font family for each card

-- Add font_size column (e.g., 'small', 'medium', 'large', or specific px values)
ALTER TABLE dashboard_cards 
ADD COLUMN IF NOT EXISTS font_size VARCHAR(50) DEFAULT 'medium';

-- Add font_family column (e.g., 'default', 'arial', 'roboto', etc.)
ALTER TABLE dashboard_cards 
ADD COLUMN IF NOT EXISTS font_family VARCHAR(100) DEFAULT 'default';

-- Add comments for documentation
COMMENT ON COLUMN dashboard_cards.font_size IS 'Font size setting: small, medium, large, or custom px value';
COMMENT ON COLUMN dashboard_cards.font_family IS 'Font family: default, arial, roboto, times, courier, etc.';
