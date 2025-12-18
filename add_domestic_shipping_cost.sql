-- Add domesticShippingCost field to order_items and packages tables
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS "domesticShippingCost" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS "domesticShippingCost" INTEGER NOT NULL DEFAULT 0;

-- Add comment
COMMENT ON COLUMN order_items."domesticShippingCost" IS 'Стоимость доставки товара до склада (вводит админ)';
COMMENT ON COLUMN packages."domesticShippingCost" IS 'Стоимость доставки товара до склада (копируется из OrderItem)';
