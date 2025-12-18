-- Add shared domestic shipping group field for deconsolidated items
ALTER TABLE packages
  ADD COLUMN IF NOT EXISTS "sharedDomesticShippingGroup" TEXT;

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS "sharedDomesticShippingGroup" TEXT;

COMMENT ON COLUMN packages."sharedDomesticShippingGroup" IS 'Группа товаров с общей оплатой domestic shipping (если разделили автоконсолидированные товары)';
COMMENT ON COLUMN order_items."sharedDomesticShippingGroup" IS 'Группа товаров с общей оплатой domestic shipping (если разделили автоконсолидированные товары)';
