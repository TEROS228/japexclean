-- SQL script to create coupons table
-- Run this if Prisma migration fails

CREATE TABLE IF NOT EXISTS coupons (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    "discountAmount" INTEGER NOT NULL,
    "minPurchase" INTEGER NOT NULL DEFAULT 0,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    "usedAt" TIMESTAMP,
    "expiresAt" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_coupons_userId ON coupons("userId");
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);

-- Add comment
COMMENT ON TABLE coupons IS 'Stores user discount coupons and rewards';
