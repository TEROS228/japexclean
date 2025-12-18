-- Add isReplacement field to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS "isReplacement" BOOLEAN NOT NULL DEFAULT false;

-- Add comment
COMMENT ON COLUMN orders."isReplacement" IS 'Заказ на замену поврежденного товара (не попадает в warehouse)';
