-- Add lastStoragePayment field to packages table
ALTER TABLE packages ADD COLUMN IF NOT EXISTS "lastStoragePayment" TIMESTAMP(3);
