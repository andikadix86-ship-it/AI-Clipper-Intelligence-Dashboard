-- CreateEnum
CREATE TYPE "ContentMode" AS ENUM ('CLIPPER', 'IMAGE_GENERATOR', 'AI_VIDEO_GENERATOR');

-- CreateEnum
CREATE TYPE "CreativeType" AS ENUM ('IMAGE', 'MOTION_IMAGE', 'AI_VIDEO');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('READY', 'PROCESSING', 'FAILED');

-- CreateEnum
CREATE TYPE "AIProviderName" AS ENUM ('GEMINI_VEO', 'OPENAI_SORA', 'RUNWAY', 'PIKA', 'LUMA', 'MANUAL_UPLOAD');

-- CreateEnum
CREATE TYPE "ProviderStatus" AS ENUM ('CONNECTED', 'NOT_CONNECTED');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "niche" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "targetAccounts" TEXT[],
    "contentMode" "ContentMode" NOT NULL DEFAULT 'CLIPPER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "VideoSource" ADD COLUMN "projectId" TEXT;

-- AlterTable
ALTER TABLE "PostingSchedule" ADD COLUMN "projectId" TEXT;

-- CreateTable
CREATE TABLE "CreativeAsset" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "generationJobId" TEXT,
    "type" "CreativeType" NOT NULL,
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "style" TEXT,
    "aspectRatio" TEXT,
    "motionPrompt" TEXT,
    "provider" "AIProviderName",
    "thumbnail" TEXT NOT NULL,
    "previewUrl" TEXT,
    "status" "AssetStatus" NOT NULL DEFAULT 'READY',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreativeAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIProvider" (
    "id" TEXT NOT NULL,
    "name" "AIProviderName" NOT NULL,
    "apiKey" TEXT,
    "status" "ProviderStatus" NOT NULL DEFAULT 'NOT_CONNECTED',
    "dailyLimit" INTEGER NOT NULL DEFAULT 0,
    "usedToday" INTEGER NOT NULL DEFAULT 0,
    "resetTime" TEXT NOT NULL DEFAULT '00:00',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GenerationJob" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "providerId" TEXT,
    "type" "CreativeType" NOT NULL,
    "prompt" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'COMPLETED',
    "resultAssetId" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GenerationJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AIProvider_name_key" ON "AIProvider"("name");

-- AddForeignKey
ALTER TABLE "VideoSource" ADD CONSTRAINT "VideoSource_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostingSchedule" ADD CONSTRAINT "PostingSchedule_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreativeAsset" ADD CONSTRAINT "CreativeAsset_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreativeAsset" ADD CONSTRAINT "CreativeAsset_generationJobId_fkey" FOREIGN KEY ("generationJobId") REFERENCES "GenerationJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenerationJob" ADD CONSTRAINT "GenerationJob_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenerationJob" ADD CONSTRAINT "GenerationJob_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "AIProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;
