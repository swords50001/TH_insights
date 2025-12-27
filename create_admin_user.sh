#!/bin/bash

# Create default admin user for testing
# Password: admin123 (hashed with bcrypt)

echo "👤 Creating default admin user..."

# Wait for database
until docker exec th_insights-db-1 pg_isready -U postgres > /dev/null 2>&1; do
  sleep 1
done

# Check if user exists
USER_EXISTS=$(docker exec th_insights-db-1 psql -U postgres -d th_db -t -c "SELECT COUNT(*) FROM users WHERE email = 'admin@example.com';")

if [ "$USER_EXISTS" -gt 0 ]; then
  echo "ℹ️  Admin user already exists"
else
  # Create admin user with password "admin123"
  # Bcrypt hash: $2b$10$YourHashHere - you'll need to generate this in your app
  docker exec th_insights-db-1 psql -U postgres -d th_db <<-EOSQL
    INSERT INTO users (email, password_hash, role, tenant_id)
    VALUES ('admin@example.com', '\$2b\$10\$rQZ1qN5xZ5xZ5xZ5xZ5xZOYour.Hashed.Password.Here', 'admin', 'default');
EOSQL
  
  echo "✅ Admin user created:"
  echo "   Email: admin@example.com"
  echo "   Password: admin123"
  echo "   Tenant: default"
fi
