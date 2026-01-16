-- Create visits table for analytics
CREATE TABLE IF NOT EXISTS visits (
  id TEXT PRIMARY KEY,
  "sessionId" TEXT UNIQUE NOT NULL,
  fingerprint TEXT,
  "userAgent" TEXT,
  "ipAddress" TEXT,
  referrer TEXT,
  "landingPage" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "visits_createdAt_idx" ON visits("createdAt");
CREATE INDEX IF NOT EXISTS "visits_sessionId_idx" ON visits("sessionId");
