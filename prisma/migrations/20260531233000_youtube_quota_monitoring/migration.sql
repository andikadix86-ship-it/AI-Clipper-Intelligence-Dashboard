-- YouTube quota estimate monitoring.
-- Additive only: no existing data is removed.

CREATE TABLE "YouTubeQuotaLog" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "estimatedCost" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "YouTubeQuotaLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "YouTubeQuotaLog_createdAt_idx" ON "YouTubeQuotaLog"("createdAt");
CREATE INDEX "YouTubeQuotaLog_endpoint_createdAt_idx" ON "YouTubeQuotaLog"("endpoint", "createdAt");

