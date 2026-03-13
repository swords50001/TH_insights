-- Migration: Add dashboard section hierarchy support
-- Description: Adds section-level fields above groups (Dashboard/Tab -> Section -> Group -> Card)

ALTER TABLE dashboard_cards
ADD COLUMN IF NOT EXISTS section_name VARCHAR(100) DEFAULT 'General';

ALTER TABLE dashboard_cards
ADD COLUMN IF NOT EXISTS section_order INTEGER DEFAULT 0;

-- Backfill existing rows
UPDATE dashboard_cards
SET section_name = COALESCE(NULLIF(TRIM(section_name), ''), 'General')
WHERE section_name IS NULL OR TRIM(section_name) = '';

-- Helpful index for ordering/grouping dashboard hierarchy
CREATE INDEX IF NOT EXISTS idx_cards_section_group
ON dashboard_cards(tenant_id, section_order, section_name, group_order, group_name);

COMMENT ON COLUMN dashboard_cards.section_name IS 'Section that contains groups for this card. Defaults to General.';
COMMENT ON COLUMN dashboard_cards.section_order IS 'Display order of sections. Lower numbers appear first.';
