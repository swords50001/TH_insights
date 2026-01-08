-- Add conditional formatting to dashboard_cards
ALTER TABLE dashboard_cards
ADD COLUMN conditional_formatting JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN dashboard_cards.conditional_formatting IS 'Array of conditional formatting rules: [{column: string, operator: "greater"|"less"|"equals"|"between", value: number|number[], bgColor: string, textColor: string}]';
