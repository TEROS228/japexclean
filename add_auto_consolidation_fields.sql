-- Add fields for auto-consolidation feature
ALTER TABLE packages
  ADD COLUMN IF NOT EXISTS "autoConsolidated" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "originalOrderItemIds" TEXT;

COMMENT ON COLUMN packages."autoConsolidated" IS 'Автоматически консолидирован при создании (одинаковые товары с разными вариантами)';
COMMENT ON COLUMN packages."originalOrderItemIds" IS 'JSON array ID оригинальных OrderItems (для autoConsolidated packages)';
