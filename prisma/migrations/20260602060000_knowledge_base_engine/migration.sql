CREATE TABLE "KnowledgeEntry" (
    "id" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "niche" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "tags" TEXT[],
    "confidence" INTEGER NOT NULL DEFAULT 70,
    "sourceType" TEXT NOT NULL DEFAULT 'ENGINE',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "KnowledgeEntry_fingerprint_key" ON "KnowledgeEntry"("fingerprint");
CREATE INDEX "KnowledgeEntry_category_updatedAt_idx" ON "KnowledgeEntry"("category", "updatedAt");
CREATE INDEX "KnowledgeEntry_platform_updatedAt_idx" ON "KnowledgeEntry"("platform", "updatedAt");
CREATE INDEX "KnowledgeEntry_tags_idx" ON "KnowledgeEntry" USING GIN ("tags");
