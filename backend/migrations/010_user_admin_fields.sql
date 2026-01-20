-- Add admin-friendly fields to users table (safe: IF NOT EXISTS prevents errors)
BEGIN;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default';

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS name TEXT;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Ensure email uniqueness per tenant (safe: only if constraint doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'users' AND constraint_name = 'users_tenant_email_key'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_tenant_email_key UNIQUE (tenant_id, email);
  END IF;
END $$;

COMMIT;
