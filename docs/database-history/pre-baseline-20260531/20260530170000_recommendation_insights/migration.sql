CREATE TABLE IF NOT EXISTS "RecommendationInsight" (
  "id" TEXT NOT NULL,
  "projectId" TEXT,
  "socialAccountId" TEXT,
  "contentItemId" TEXT,
  "insightType" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "score" INTEGER NOT NULL,
  "recommendation" TEXT NOT NULL,
  "priority" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RecommendationInsight_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "RecommendationInsight"
    ADD CONSTRAINT "RecommendationInsight_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "RecommendationInsight"
    ADD CONSTRAINT "RecommendationInsight_socialAccountId_fkey"
    FOREIGN KEY ("socialAccountId") REFERENCES "SocialAccount"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "RecommendationInsight"
    ADD CONSTRAINT "RecommendationInsight_contentItemId_fkey"
    FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
