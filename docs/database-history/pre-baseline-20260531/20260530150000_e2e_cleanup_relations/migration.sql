ALTER TYPE "ScheduleStatus" ADD VALUE IF NOT EXISTS 'CANCELED';

ALTER TABLE "ContentItem"
  ADD COLUMN IF NOT EXISTS "socialAccountId" TEXT;

DO $$ BEGIN
  ALTER TABLE "ContentItem"
    ADD CONSTRAINT "ContentItem_socialAccountId_fkey"
    FOREIGN KEY ("socialAccountId") REFERENCES "SocialAccount"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
