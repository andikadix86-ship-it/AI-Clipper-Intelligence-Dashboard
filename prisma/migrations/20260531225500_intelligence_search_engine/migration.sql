-- Intelligence Search Engine and persisted data-driven analysis.
-- Additive only: no existing data is removed.

ALTER TABLE "IntelligenceResult"
ADD COLUMN "searchRunId" TEXT;

CREATE TABLE "IntelligenceSearchRun" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "niche" TEXT NOT NULL DEFAULT '',
    "mode" TEXT NOT NULL,
    "platforms" TEXT[],
    "region" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "timeRange" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "cacheKey" TEXT NOT NULL,
    "cachedUntil" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntelligenceSearchRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DataDrivenAnalysis" (
    "id" TEXT NOT NULL,
    "resultId" TEXT,
    "keyword" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "trendStage" TEXT NOT NULL,
    "opportunityLevel" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "confidence" INTEGER NOT NULL,
    "analysis" JSONB NOT NULL,
    "sourceBreakdown" JSONB NOT NULL,
    "isDemo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataDrivenAnalysis_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IntelligenceSearchRun_cacheKey_key" ON "IntelligenceSearchRun"("cacheKey");
CREATE INDEX "IntelligenceSearchRun_query_region_createdAt_idx" ON "IntelligenceSearchRun"("query", "region", "createdAt");
CREATE INDEX "IntelligenceSearchRun_cachedUntil_idx" ON "IntelligenceSearchRun"("cachedUntil");
CREATE INDEX "IntelligenceResult_searchRunId_collectedAt_idx" ON "IntelligenceResult"("searchRunId", "collectedAt");
CREATE INDEX "DataDrivenAnalysis_resultId_createdAt_idx" ON "DataDrivenAnalysis"("resultId", "createdAt");
CREATE INDEX "DataDrivenAnalysis_keyword_createdAt_idx" ON "DataDrivenAnalysis"("keyword", "createdAt");

ALTER TABLE "IntelligenceResult"
ADD CONSTRAINT "IntelligenceResult_searchRunId_fkey"
FOREIGN KEY ("searchRunId") REFERENCES "IntelligenceSearchRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DataDrivenAnalysis"
ADD CONSTRAINT "DataDrivenAnalysis_resultId_fkey"
FOREIGN KEY ("resultId") REFERENCES "IntelligenceResult"("id") ON DELETE SET NULL ON UPDATE CASCADE;

