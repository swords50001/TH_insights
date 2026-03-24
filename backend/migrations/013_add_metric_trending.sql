-- Add metric trending support
-- Allows metric cards to display trending indicators (up/down/dash)

ALTER TABLE dashboard_cards
ADD COLUMN IF NOT EXISTS trending_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS trending_comparison_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS trending_comparison_field VARCHAR(255),
ADD COLUMN IF NOT EXISTS trending_target_value NUMERIC;

-- Add drilldown support for metric cards
ALTER TABLE dashboard_cards
ADD COLUMN IF NOT EXISTS metric_drilldown_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS metric_drilldown_query TEXT;
