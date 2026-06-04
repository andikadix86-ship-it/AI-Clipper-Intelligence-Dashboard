ALTER TABLE "AffiliateProductInsight" ADD COLUMN IF NOT EXISTS "sourceType" TEXT NOT NULL DEFAULT 'DEMO';
ALTER TABLE "AffiliateProductInsight" ADD COLUMN IF NOT EXISTS "productUrl" TEXT;
ALTER TABLE "AffiliateProductInsight" ADD COLUMN IF NOT EXISTS "affiliateUrl" TEXT;
ALTER TABLE "AffiliateProductInsight" ADD COLUMN IF NOT EXISTS "price" DOUBLE PRECISION;
ALTER TABLE "AffiliateProductInsight" ADD COLUMN IF NOT EXISTS "commissionRate" DOUBLE PRECISION;
ALTER TABLE "AffiliateProductInsight" ADD COLUMN IF NOT EXISTS "revenue" DOUBLE PRECISION;
ALTER TABLE "AffiliateProductInsight" ADD COLUMN IF NOT EXISTS "salesVolume" INTEGER;
ALTER TABLE "AffiliateProductInsight" ADD COLUMN IF NOT EXISTS "demandScore" INTEGER;
ALTER TABLE "AffiliateProductInsight" ADD COLUMN IF NOT EXISTS "competitionScore" INTEGER;
ALTER TABLE "AffiliateProductInsight" ADD COLUMN IF NOT EXISTS "commissionScore" INTEGER;
ALTER TABLE "AffiliateProductInsight" ADD COLUMN IF NOT EXISTS "opportunityScore" INTEGER;
ALTER TABLE "AffiliateProductInsight" ADD COLUMN IF NOT EXISTS "isEstimated" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "AffiliateProductInsight" ADD COLUMN IF NOT EXISTS "lastSyncedAt" TIMESTAMP(3);

UPDATE "AffiliateProductInsight"
SET
  "sourceType" = CASE WHEN "isDemo" = true THEN 'DEMO' ELSE 'CACHE' END,
  "lastSyncedAt" = COALESCE("lastSyncedAt", "collectedAt")
WHERE "sourceType" IS NULL OR "sourceType" = 'DEMO';

CREATE INDEX IF NOT EXISTS "AffiliateProductInsight_sourceType_lastSyncedAt_idx" ON "AffiliateProductInsight"("sourceType", "lastSyncedAt");
