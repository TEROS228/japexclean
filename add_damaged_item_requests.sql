-- Create damaged_item_requests table
CREATE TABLE damaged_item_requests (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "packageId" TEXT NOT NULL,
  description TEXT NOT NULL,
  photos TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  "adminNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "damaged_item_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "damaged_item_requests_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES packages(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create index for faster queries
CREATE INDEX "damaged_item_requests_userId_idx" ON damaged_item_requests("userId");
CREATE INDEX "damaged_item_requests_packageId_idx" ON damaged_item_requests("packageId");
