-- Initial schema creation
-- Creates all base tables before multi-tenancy migrations

-- Create dashboard_cards table
CREATE TABLE IF NOT EXISTS dashboard_cards (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  sql_query TEXT NOT NULL,
  visualization_type VARCHAR(50) NOT NULL,
  chart_type VARCHAR(50),
  drilldown_enabled BOOLEAN DEFAULT FALSE,
  drilldown_query TEXT,
  hide_title BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create dashboards table for tabs
CREATE TABLE IF NOT EXISTS dashboards (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  tab_order INTEGER DEFAULT 0,
  icon VARCHAR(50),
  color VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
