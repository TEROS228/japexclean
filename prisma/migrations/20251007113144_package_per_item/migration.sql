/*
  Warnings:

  - You are about to drop the column `orderId` on the `packages` table. All the data in the column will be lost.
  - Added the required column `orderItemId` to the `packages` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_packages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "trackingNumber" TEXT,
    "weight" REAL,
    "status" TEXT NOT NULL DEFAULT 'ready',
    "shippingCost" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "arrivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shippedAt" DATETIME,
    "deliveredAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "packages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "packages_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_items" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_packages" ("arrivedAt", "createdAt", "deliveredAt", "id", "notes", "shippedAt", "shippingCost", "status", "trackingNumber", "updatedAt", "userId", "weight") SELECT "arrivedAt", "createdAt", "deliveredAt", "id", "notes", "shippedAt", "shippingCost", "status", "trackingNumber", "updatedAt", "userId", "weight" FROM "packages";
DROP TABLE "packages";
ALTER TABLE "new_packages" RENAME TO "packages";
CREATE UNIQUE INDEX "packages_orderItemId_key" ON "packages"("orderItemId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
