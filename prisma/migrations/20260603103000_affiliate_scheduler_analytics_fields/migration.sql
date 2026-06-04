ALTER TABLE "PlatformPerformanceSnapshot"
ADD COLUMN IF NOT EXISTS "campaignId" TEXT,
ADD COLUMN IF NOT EXISTS "generatedContentId" TEXT,
ADD COLUMN IF NOT EXISTS "productName" TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS "clicks" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "sales" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "commission" DOUBLE PRECISION NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "PlatformPerformanceSnapshot_campaignId_snapshotDate_idx"
ON "PlatformPerformanceSnapshot"("campaignId", "snapshotDate");

CREATE INDEX IF NOT EXISTS "PlatformPerformanceSnapshot_generatedContentId_snapshotDate_idx"
ON "PlatformPerformanceSnapshot"("generatedContentId", "snapshotDate");
