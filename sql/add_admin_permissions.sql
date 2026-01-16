-- Add adminPermissions column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS "adminPermissions" TEXT;

-- Add comment for documentation
COMMENT ON COLUMN users."adminPermissions" IS 'JSON string containing admin panel tab permissions';
