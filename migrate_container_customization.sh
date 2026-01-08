#!/bin/bash

# Migration script for container customization

echo "Running container customization migration..."

docker exec -i th_db psql -U postgres -d insights -f - < /Users/scottkirby/TH_insights/backend/migrations/004_add_container_customization.sql

if [ $? -eq 0 ]; then
    echo "✓ Container customization migration completed successfully"
else
    echo "✗ Migration failed"
    exit 1
fi
