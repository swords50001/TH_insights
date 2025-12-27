#!/bin/bash

# Multi-tenancy migration script
# Run this to add tenant_id columns and dashboard_layouts table

echo "🚀 Starting multi-tenancy migration..."

# Wait for PostgreSQL to be ready
until docker exec th_insights-db-1 pg_isready -U postgres > /dev/null 2>&1; do
  echo "⏳ Waiting for database..."
  sleep 1
done

echo "✅ Database ready!"

# Copy migration file to container
docker cp /Users/scottkirby/TH_insights/backend/migrations/001_add_multi_tenancy.sql th_insights-db-1:/tmp/

# Run migration
echo "📝 Applying multi-tenancy migration..."
docker exec th_insights-db-1 psql -U postgres -d th_db -f /tmp/001_add_multi_tenancy.sql

if [ $? -eq 0 ]; then
  echo "✅ Multi-tenancy migration completed successfully!"
  echo ""
  echo "📊 Migration applied:"
  echo "  - Added tenant_id column to users table"
  echo "  - Added tenant_id column to dashboard_cards table"
  echo "  - Created dashboard_layouts table for tenant-specific layouts"
  echo "  - Created indexes for performance"
  echo ""
  echo "⚠️  IMPORTANT: All existing data has been assigned to 'default' tenant"
  echo "   Update tenant_id values for your organizations as needed"
else
  echo "❌ Migration failed! Check errors above"
  exit 1
fi
