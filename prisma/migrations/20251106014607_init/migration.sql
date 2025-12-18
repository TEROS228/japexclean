-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "senderType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "apartment" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "ssnNumber" TEXT,
    "taxIdType" TEXT,
    "taxIdNumber" TEXT,
    "companyName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "translation_cache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceText" TEXT NOT NULL,
    "sourceLang" TEXT NOT NULL,
    "targetLang" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "compensation_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "selectedPackageIds" TEXT,
    "compensationType" TEXT DEFAULT 'replace',
    "description" TEXT NOT NULL,
    "files" TEXT NOT NULL,
    "damageCertificate" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "adminNotes" TEXT,
    "approvedForRefund" BOOLEAN NOT NULL DEFAULT false,
    "refundMethod" TEXT,
    "refundProcessed" BOOLEAN NOT NULL DEFAULT false,
    "bankAccountName" TEXT,
    "bankAccountAddress" TEXT,
    "bankAccountNumber" TEXT,
    "bankRoutingNumber" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "compensation_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "compensation_requests_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" INTEGER,
    "userId" TEXT NOT NULL,
    "total" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "shippingCountry" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_orders" ("createdAt", "id", "status", "total", "updatedAt", "userId") SELECT "createdAt", "id", "status", "total", "updatedAt", "userId" FROM "orders";
DROP TABLE "orders";
ALTER TABLE "new_orders" RENAME TO "orders";
CREATE UNIQUE INDEX "orders_orderNumber_key" ON "orders"("orderNumber");
CREATE TABLE "new_packages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "trackingNumber" TEXT,
    "weight" REAL,
    "status" TEXT NOT NULL DEFAULT 'ready',
    "shippingCost" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "shippingMethod" TEXT DEFAULT 'ems',
    "shippingAddressId" TEXT,
    "consolidation" BOOLEAN NOT NULL DEFAULT false,
    "consolidateWith" TEXT,
    "futureConsolidatedId" TEXT,
    "consolidated" BOOLEAN NOT NULL DEFAULT false,
    "consolidatedInto" TEXT,
    "photoService" BOOLEAN NOT NULL DEFAULT false,
    "photoServicePaid" BOOLEAN NOT NULL DEFAULT false,
    "photoServiceStatus" TEXT DEFAULT 'pending',
    "photos" TEXT,
    "packagePhoto" TEXT,
    "reinforcement" BOOLEAN NOT NULL DEFAULT false,
    "reinforcementPaid" BOOLEAN NOT NULL DEFAULT false,
    "reinforcementStatus" TEXT DEFAULT 'pending',
    "cancelReturn" BOOLEAN NOT NULL DEFAULT false,
    "cancelPurchase" BOOLEAN NOT NULL DEFAULT false,
    "cancelPurchaseStatus" TEXT DEFAULT 'pending',
    "cancelPurchasePaid" BOOLEAN NOT NULL DEFAULT false,
    "disposalRequested" BOOLEAN NOT NULL DEFAULT false,
    "disposalCost" INTEGER,
    "disposalDeclineReason" TEXT,
    "disposed" BOOLEAN NOT NULL DEFAULT false,
    "shippingRequested" BOOLEAN NOT NULL DEFAULT false,
    "shippingRequestedAt" DATETIME,
    "invoice" TEXT,
    "arrivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shippedAt" DATETIME,
    "deliveredAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "packages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "packages_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_items" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "packages_shippingAddressId_fkey" FOREIGN KEY ("shippingAddressId") REFERENCES "addresses" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_packages" ("arrivedAt", "cancelReturn", "consolidateWith", "consolidation", "createdAt", "deliveredAt", "id", "notes", "orderItemId", "photoService", "shippedAt", "shippingCost", "shippingMethod", "status", "trackingNumber", "updatedAt", "userId", "weight") SELECT "arrivedAt", "cancelReturn", "consolidateWith", "consolidation", "createdAt", "deliveredAt", "id", "notes", "orderItemId", "photoService", "shippedAt", "shippingCost", "shippingMethod", "status", "trackingNumber", "updatedAt", "userId", "weight" FROM "packages";
DROP TABLE "packages";
ALTER TABLE "new_packages" RENAME TO "packages";
CREATE UNIQUE INDEX "packages_orderItemId_key" ON "packages"("orderItemId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "translation_cache_sourceText_sourceLang_targetLang_idx" ON "translation_cache"("sourceText", "sourceLang", "targetLang");

-- CreateIndex
CREATE UNIQUE INDEX "translation_cache_sourceText_sourceLang_targetLang_key" ON "translation_cache"("sourceText", "sourceLang", "targetLang");
