#!/bin/bash

# Wait for PostgreSQL to be ready
until docker exec th_insights-db-1 pg_isready -U postgres > /dev/null 2>&1; do
  echo "Waiting for database..."
  sleep 1
done

# Add hide_title column
docker exec th_insights-db-1 psql -U postgres -d th_db <<-EOSQL
    ALTER TABLE dashboard_cards ADD COLUMN IF NOT EXISTS hide_title BOOLEAN DEFAULT false;
EOSQL

echo "Database migration complete!"
