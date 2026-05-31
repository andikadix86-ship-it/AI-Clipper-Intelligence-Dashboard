-- AlterEnum
ALTER TYPE "ContentStatus" ADD VALUE IF NOT EXISTS 'REJECTED';

-- AlterTable
ALTER TABLE "ContentItem" ADD COLUMN IF NOT EXISTS "workflowStatus" "ContentStatus" NOT NULL DEFAULT 'DRAFT';
ALTER TABLE "ContentItem" ADD COLUMN IF NOT EXISTS "reviewNotes" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ContentItem" ADD COLUMN IF NOT EXISTS "rejectReason" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ContentItem" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3);
ALTER TABLE "ContentItem" ADD COLUMN IF NOT EXISTS "approvedBy" TEXT;

-- Backfill workflowStatus from existing status
UPDATE "ContentItem" SET "workflowStatus" = "status" WHERE "workflowStatus" = 'DRAFT' AND "status" IS NOT NULL;

-- CreateTable
CREATE TABLE IF NOT EXISTS "ApprovalHistory" (
    "id" TEXT NOT NULL,
    "contentItemId" TEXT NOT NULL,
    "fromStatus" "ContentStatus" NOT NULL,
    "toStatus" "ContentStatus" NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "reason" TEXT NOT NULL DEFAULT '',
    "actionBy" TEXT NOT NULL DEFAULT 'Admin',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "ApprovalHistory" ADD CONSTRAINT "ApprovalHistory_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
