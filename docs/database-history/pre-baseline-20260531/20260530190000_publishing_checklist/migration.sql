CREATE TABLE IF NOT EXISTS "PublishingChecklist" (
  "id" TEXT NOT NULL,
  "contentItemId" TEXT NOT NULL,
  "postingScheduleId" TEXT,
  "assetChecked" BOOLEAN NOT NULL DEFAULT false,
  "captionCopied" BOOLEAN NOT NULL DEFAULT false,
  "hashtagCopied" BOOLEAN NOT NULL DEFAULT false,
  "uploadedManually" BOOLEAN NOT NULL DEFAULT false,
  "postUrlAdded" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PublishingChecklist_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "PublishingChecklist"
    ADD CONSTRAINT "PublishingChecklist_contentItemId_fkey"
    FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "PublishingChecklist"
    ADD CONSTRAINT "PublishingChecklist_postingScheduleId_fkey"
    FOREIGN KEY ("postingScheduleId") REFERENCES "PostingSchedule"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
