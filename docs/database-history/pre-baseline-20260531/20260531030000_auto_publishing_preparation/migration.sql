CREATE TYPE "AuthStatus" AS ENUM ('NOT_CONNECTED', 'CONNECTED', 'EXPIRED', 'ERROR');
CREATE TYPE "PublishMode" AS ENUM ('MANUAL', 'SEMI_AUTO', 'AUTO');
CREATE TYPE "PublishingJobStatus" AS ENUM ('READY_TO_POST', 'PUBLISHING', 'POSTED', 'FAILED', 'CANCELED');
CREATE TYPE "PublishingLogLevel" AS ENUM ('INFO', 'WARN', 'ERROR');

ALTER TYPE "ScheduleStatus" ADD VALUE IF NOT EXISTS 'READY_TO_POST';
ALTER TYPE "ScheduleStatus" ADD VALUE IF NOT EXISTS 'PUBLISHING';

ALTER TABLE "PostingSchedule"
ADD COLUMN IF NOT EXISTS "publishMode" "PublishMode" NOT NULL DEFAULT 'MANUAL';

ALTER TABLE "SocialAccount"
ADD COLUMN IF NOT EXISTS "uploadMode" "PublishMode" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN IF NOT EXISTS "authStatus" "AuthStatus" NOT NULL DEFAULT 'NOT_CONNECTED',
ADD COLUMN IF NOT EXISTS "accessTokenEncrypted" TEXT,
ADD COLUMN IF NOT EXISTS "refreshTokenEncrypted" TEXT,
ADD COLUMN IF NOT EXISTS "tokenExpiresAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "lastSyncAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "connectionNotes" TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS "PublishingJob" (
  "id" TEXT NOT NULL,
  "postingScheduleId" TEXT NOT NULL,
  "contentItemId" TEXT NOT NULL,
  "socialAccountId" TEXT NOT NULL,
  "platform" "SocialPlatform" NOT NULL,
  "publishMode" "PublishMode" NOT NULL,
  "status" "PublishingJobStatus" NOT NULL DEFAULT 'READY_TO_POST',
  "providerJobId" TEXT,
  "postUrl" TEXT NOT NULL DEFAULT '',
  "errorMessage" TEXT,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PublishingJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PublishingLog" (
  "id" TEXT NOT NULL,
  "publishingJobId" TEXT NOT NULL,
  "level" "PublishingLogLevel" NOT NULL DEFAULT 'INFO',
  "message" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PublishingLog_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "PublishingJob" ADD CONSTRAINT "PublishingJob_postingScheduleId_fkey" FOREIGN KEY ("postingScheduleId") REFERENCES "PostingSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "PublishingJob" ADD CONSTRAINT "PublishingJob_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "PublishingJob" ADD CONSTRAINT "PublishingJob_socialAccountId_fkey" FOREIGN KEY ("socialAccountId") REFERENCES "SocialAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "PublishingLog" ADD CONSTRAINT "PublishingLog_publishingJobId_fkey" FOREIGN KEY ("publishingJobId") REFERENCES "PublishingJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
