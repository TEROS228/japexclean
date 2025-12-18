-- Add preferredShippingCarrier field to orders table
ALTER TABLE orders ADD COLUMN "preferredShippingCarrier" TEXT;
