#!/bin/bash

echo "⏳ Waiting for database to be ready..."
until docker exec th_insights-db-1 pg_isready -U postgres > /dev/null 2>&1; do
  sleep 1
done
echo "✅ Database ready!"

echo "📝 Applying card groups migration..."
docker cp backend/migrations/003_add_card_groups.sql th_insights-db-1:/tmp/003_add_card_groups.sql

docker exec th_insights-db-1 psql -U postgres -d th_db -f /tmp/003_add_card_groups.sql

if [ $? -eq 0 ]; then
  echo "✅ Card groups migration completed successfully!"
  echo ""
  echo "Added columns:"
  echo "  - group_name (VARCHAR 100, nullable)"
  echo "  - group_order (INTEGER, default: 0)"
  echo ""
  echo "Cards can now be organized into groups with headers!"
else
  echo "❌ Migration failed!"
  exit 1
fi
