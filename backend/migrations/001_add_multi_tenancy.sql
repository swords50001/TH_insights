-- Multi-tenancy migration
-- Adds tenant_id to all tables and creates dashboard_layouts table

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add tenant_id and name to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(50) NOT NULL DEFAULT 'default';
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);

-- Add tenant_id to dashboard_cards table
ALTER TABLE dashboard_cards ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(50) NOT NULL DEFAULT 'default';
CREATE INDEX IF NOT EXISTS idx_cards_tenant ON dashboard_cards(tenant_id);

-- Create dashboard_layouts table for storing published layouts per tenant
CREATE TABLE IF NOT EXISTS dashboard_layouts (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(50) NOT NULL,
  layout_data JSONB NOT NULL,
  published_by INTEGER REFERENCES users(id),
  published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_layouts_tenant ON dashboard_layouts(tenant_id);

-- Add comments for documentation
COMMENT ON COLUMN users.tenant_id IS 'Organization/tenant identifier for data isolation';
COMMENT ON COLUMN dashboard_cards.tenant_id IS 'Organization/tenant identifier for data isolation';
COMMENT ON TABLE dashboard_layouts IS 'Stores published dashboard layouts per tenant';
