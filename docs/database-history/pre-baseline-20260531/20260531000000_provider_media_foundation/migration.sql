CREATE TYPE "ProviderMode" AS ENUM ('DUMMY', 'REAL');
CREATE TYPE "VideoSourceType" AS ENUM ('URL', 'UPLOAD');
CREATE TYPE "ProcessingStatus" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');
CREATE TYPE "MediaJobType" AS ENUM ('UPLOAD', 'CLIP_PROCESSING', 'THUMBNAIL', 'SUBTITLE');

ALTER TABLE "AIProvider"
ADD COLUMN "mode" "ProviderMode" NOT NULL DEFAULT 'DUMMY';

CREATE TABLE "ProviderCredential" (
  "id" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "apiKeyEncrypted" TEXT NOT NULL DEFAULT '',
  "label" TEXT NOT NULL DEFAULT 'default',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProviderCredential_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ProviderCredential"
ADD CONSTRAINT "ProviderCredential_providerId_fkey"
FOREIGN KEY ("providerId") REFERENCES "AIProvider"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VideoSource"
ADD COLUMN "sourceType" "VideoSourceType" NOT NULL DEFAULT 'URL',
ADD COLUMN "sourceFileUrl" TEXT,
ADD COLUMN "originalFileName" TEXT,
ADD COLUMN "fileSize" INTEGER,
ADD COLUMN "mimeType" TEXT;

ALTER TABLE "GeneratedClip"
ADD COLUMN "outputFileUrl" TEXT,
ADD COLUMN "subtitleUrl" TEXT,
ADD COLUMN "startTime" INTEGER,
ADD COLUMN "endTime" INTEGER,
ADD COLUMN "processingStatus" "ProcessingStatus" NOT NULL DEFAULT 'COMPLETED',
ADD COLUMN "errorMessage" TEXT;

CREATE TABLE "MediaProcessingJob" (
  "id" TEXT NOT NULL,
  "projectId" TEXT,
  "videoSourceId" TEXT,
  "generatedClipId" TEXT,
  "jobType" "MediaJobType" NOT NULL,
  "status" "ProcessingStatus" NOT NULL DEFAULT 'QUEUED',
  "progress" INTEGER NOT NULL DEFAULT 0,
  "inputUrl" TEXT NOT NULL,
  "outputUrl" TEXT,
  "errorMessage" TEXT,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MediaProcessingJob_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "MediaProcessingJob"
ADD CONSTRAINT "MediaProcessingJob_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "Project"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MediaProcessingJob"
ADD CONSTRAINT "MediaProcessingJob_videoSourceId_fkey"
FOREIGN KEY ("videoSourceId") REFERENCES "VideoSource"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MediaProcessingJob"
ADD CONSTRAINT "MediaProcessingJob_generatedClipId_fkey"
FOREIGN KEY ("generatedClipId") REFERENCES "GeneratedClip"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
