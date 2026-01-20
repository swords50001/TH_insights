-- Add admin-friendly fields to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Ensure email uniqueness per tenant
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_tenant_email_key'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_tenant_email_key UNIQUE (tenant_id, email);
  END IF;
END $$;
