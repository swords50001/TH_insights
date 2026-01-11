#!/bin/bash

# Run Database Migrations on AWS RDS
# Usage: ./run-migrations.sh

set -e

echo "🔄 Running database migrations..."

# Get database credentials from AWS Secrets Manager
DB_HOST=$(aws secretsmanager get-secret-value --secret-id th-insights/db-host --query SecretString --output text)
DB_NAME=$(aws secretsmanager get-secret-value --secret-id th-insights/db-name --query SecretString --output text)
DB_USER=$(aws secretsmanager get-secret-value --secret-id th-insights/db-user --query SecretString --output text)
DB_PASSWORD=$(aws secretsmanager get-secret-value --secret-id th-insights/db-password --query SecretString --output text)

# Set environment variables
export PGHOST=$DB_HOST
export PGDATABASE=$DB_NAME
export PGUSER=$DB_USER
export PGPASSWORD=$DB_PASSWORD
export PGPORT=5432

# Run migrations
echo "📂 Running migration files..."
cd backend/migrations

for migration in $(ls -1 *.sql | sort); do
  echo "  ⚙️  Running $migration..."
  psql -f $migration
done

cd ../..

echo "✅ Migrations completed successfully!"
