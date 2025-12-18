-- Add isCommercial field to addresses table
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS "isCommercial" BOOLEAN NOT NULL DEFAULT false;
