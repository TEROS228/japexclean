-- Add domesticShippingPaid field to packages table
ALTER TABLE packages ADD COLUMN IF NOT EXISTS "domesticShippingPaid" BOOLEAN NOT NULL DEFAULT false;

-- Set domesticShippingPaid to true for packages without domestic shipping cost
UPDATE packages SET "domesticShippingPaid" = true WHERE "domesticShippingCost" = 0;

-- Add comment
COMMENT ON COLUMN packages."domesticShippingPaid" IS 'Оплачена ли доставка до склада';
