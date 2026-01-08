-- Add filters table for dashboard-level filters
CREATE TABLE IF NOT EXISTS dashboard_filters (
    id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    filter_type VARCHAR(50) NOT NULL, -- 'date_range', 'select', 'multi_select', 'text'
    label VARCHAR(255) NOT NULL,
    sql_parameter VARCHAR(100) NOT NULL, -- Parameter name to use in SQL queries
    options JSONB, -- For select/multi_select: array of {label, value}
    default_value TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, sql_parameter)
);

-- Add card_filters junction table to associate filters with cards
CREATE TABLE IF NOT EXISTS card_filters (
    id SERIAL PRIMARY KEY,
    card_id VARCHAR(255) NOT NULL,
    filter_id INTEGER REFERENCES dashboard_filters(id) ON DELETE CASCADE,
    is_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(card_id, filter_id)
);

CREATE INDEX IF NOT EXISTS idx_dashboard_filters_tenant ON dashboard_filters(tenant_id);
CREATE INDEX IF NOT EXISTS idx_card_filters_card ON card_filters(card_id);
CREATE INDEX IF NOT EXISTS idx_card_filters_filter ON card_filters(filter_id);
