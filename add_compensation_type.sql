-- Migration: Add compensationType field to CompensationRequest
-- Run this on production server

ALTER TABLE "compensation_requests"
ADD COLUMN IF NOT EXISTS "compensationType" TEXT DEFAULT 'replace';

-- Update existing records to have 'replace' as compensation type
UPDATE "compensation_requests"
SET "compensationType" = 'replace'
WHERE "compensationType" IS NULL;
