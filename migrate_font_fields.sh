#!/bin/bash

echo "⏳ Waiting for database to be ready..."
until docker exec th_insights-db-1 pg_isready -U postgres > /dev/null 2>&1; do
  sleep 1
done
echo "✅ Database ready!"

echo "📝 Applying font fields migration..."
docker cp backend/migrations/002_add_font_fields.sql th_insights-db-1:/tmp/002_add_font_fields.sql

docker exec th_insights-db-1 psql -U postgres -d th_db -f /tmp/002_add_font_fields.sql

if [ $? -eq 0 ]; then
  echo "✅ Font fields migration completed successfully!"
  echo ""
  echo "Added columns:"
  echo "  - font_size (default: 'medium')"
  echo "  - font_family (default: 'default')"
else
  echo "❌ Migration failed!"
  exit 1
fi
