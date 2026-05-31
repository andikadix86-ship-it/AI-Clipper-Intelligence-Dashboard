-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('YOUTUBE', 'TIKTOK', 'INSTAGRAM');

-- CreateEnum
CREATE TYPE "PrivacyStatus" AS ENUM ('PUBLIC', 'PRIVATE', 'UNLISTED');

-- CreateTable
CREATE TABLE "VideoSource" (
    "id" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "url" TEXT NOT NULL,
    "videoId" TEXT,
    "title" TEXT NOT NULL,
    "thumbnail" TEXT NOT NULL,
    "embedUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClipSetting" (
    "id" TEXT NOT NULL,
    "videoSourceId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "watermark" BOOLEAN NOT NULL DEFAULT true,
    "subtitle" BOOLEAN NOT NULL DEFAULT true,
    "category" TEXT NOT NULL,
    "clipCount" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "resolution" TEXT NOT NULL,
    "layout" TEXT NOT NULL DEFAULT 'Auto Reframe',
    "subtitleStyle" TEXT NOT NULL DEFAULT 'Bold Creator',
    "textPlacement" TEXT NOT NULL DEFAULT 'Lower Third',
    "ccLanguage" TEXT NOT NULL DEFAULT 'id-ID',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClipSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedClip" (
    "id" TEXT NOT NULL,
    "videoSourceId" TEXT NOT NULL,
    "clipSettingId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "thumbnail" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "viralScore" INTEGER NOT NULL,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedClip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostingSchedule" (
    "id" TEXT NOT NULL,
    "videoSourceId" TEXT,
    "socialAccountId" TEXT NOT NULL,
    "destination" "Platform" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "postingTime" TEXT NOT NULL,
    "postingEndTime" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Jakarta',
    "videosPerDay" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PostingSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostingClipDetail" (
    "id" TEXT NOT NULL,
    "postingScheduleId" TEXT NOT NULL,
    "generatedClipId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tags" TEXT[],
    "privacyStatus" "PrivacyStatus" NOT NULL DEFAULT 'PUBLIC',
    "notifySubscriber" BOOLEAN NOT NULL DEFAULT true,
    "madeForKids" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostingClipDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialAccount" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "platform" "Platform",
    "handle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialAccount_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ClipSetting" ADD CONSTRAINT "ClipSetting_videoSourceId_fkey" FOREIGN KEY ("videoSourceId") REFERENCES "VideoSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedClip" ADD CONSTRAINT "GeneratedClip_videoSourceId_fkey" FOREIGN KEY ("videoSourceId") REFERENCES "VideoSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedClip" ADD CONSTRAINT "GeneratedClip_clipSettingId_fkey" FOREIGN KEY ("clipSettingId") REFERENCES "ClipSetting"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostingSchedule" ADD CONSTRAINT "PostingSchedule_videoSourceId_fkey" FOREIGN KEY ("videoSourceId") REFERENCES "VideoSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostingSchedule" ADD CONSTRAINT "PostingSchedule_socialAccountId_fkey" FOREIGN KEY ("socialAccountId") REFERENCES "SocialAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostingClipDetail" ADD CONSTRAINT "PostingClipDetail_postingScheduleId_fkey" FOREIGN KEY ("postingScheduleId") REFERENCES "PostingSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostingClipDetail" ADD CONSTRAINT "PostingClipDetail_generatedClipId_fkey" FOREIGN KEY ("generatedClipId") REFERENCES "GeneratedClip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
