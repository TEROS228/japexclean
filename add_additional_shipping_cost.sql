-- Add additional shipping cost fields to Package table
-- These fields are used when admin discovers additional shipping costs are needed

ALTER TABLE "packages" ADD COLUMN IF NOT EXISTS "additionalShippingCost" INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE "packages" ADD COLUMN IF NOT EXISTS "additionalShippingReason" TEXT;
ALTER TABLE "packages" ADD COLUMN IF NOT EXISTS "additionalShippingPaid" BOOLEAN DEFAULT false NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN "packages"."additionalShippingCost" IS 'Additional shipping cost in JPY (charged by admin if more payment needed)';
COMMENT ON COLUMN "packages"."additionalShippingReason" IS 'Reason for additional shipping cost';
COMMENT ON COLUMN "packages"."additionalShippingPaid" IS 'Whether additional shipping cost has been paid by user';
