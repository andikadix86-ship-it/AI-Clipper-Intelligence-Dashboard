-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('YOUTUBE', 'TIKTOK', 'INSTAGRAM');

-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM ('TIKTOK', 'YOUTUBE_SHORTS', 'INSTAGRAM_REELS', 'FACEBOOK_REELS');

-- CreateEnum
CREATE TYPE "PrivacyStatus" AS ENUM ('PUBLIC', 'PRIVATE', 'UNLISTED');

-- CreateEnum
CREATE TYPE "ContentMode" AS ENUM ('CLIPPER', 'IMAGE_GENERATOR', 'AI_VIDEO_GENERATOR');

-- CreateEnum
CREATE TYPE "CreativeType" AS ENUM ('IMAGE', 'MOTION_IMAGE', 'AI_VIDEO');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('READY', 'PROCESSING', 'FAILED');

-- CreateEnum
CREATE TYPE "LibraryAssetStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'TRASHED');

-- CreateEnum
CREATE TYPE "AgentRole" AS ENUM ('CEO', 'RESEARCH', 'SCRIPT', 'CLIPPER', 'CREATIVE', 'SCHEDULER', 'ANALYST');

-- CreateEnum
CREATE TYPE "AgentStatus" AS ENUM ('ACTIVE', 'PAUSED', 'DISABLED');

-- CreateEnum
CREATE TYPE "AgentTaskType" AS ENUM ('RESEARCH_TREND', 'GENERATE_CONTENT_IDEA', 'REVIEW_CONTENT', 'RECOMMEND_SCHEDULE', 'ANALYZE_PERFORMANCE');

-- CreateEnum
CREATE TYPE "AgentTaskStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "AgentPriority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "TelegramStatus" AS ENUM ('CONNECTED', 'NOT_CONNECTED', 'ERROR');

-- CreateEnum
CREATE TYPE "TelegramApprovalAction" AS ENUM ('SENT_REVIEW', 'SENT_APPROVED', 'APPROVED', 'REJECTED', 'REVIEW', 'TEST');

-- CreateEnum
CREATE TYPE "TelegramLogStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'RESPONDED');

-- CreateEnum
CREATE TYPE "AutomationPlanStatus" AS ENUM ('DRAFT', 'WAITING_APPROVAL', 'APPROVED', 'REJECTED', 'EXECUTED');

-- CreateEnum
CREATE TYPE "AIProviderName" AS ENUM ('GEMINI_VEO', 'OPENAI_SORA', 'RUNWAY', 'PIKA', 'LUMA', 'MANUAL_UPLOAD');

-- CreateEnum
CREATE TYPE "ProviderStatus" AS ENUM ('CONNECTED', 'NOT_CONNECTED');

-- CreateEnum
CREATE TYPE "ProviderMode" AS ENUM ('DUMMY', 'REAL');

-- CreateEnum
CREATE TYPE "AIProviderStatus" AS ENUM ('NOT_CONFIGURED', 'CONFIGURED', 'READY', 'ERROR', 'DUMMY');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "VideoSourceType" AS ENUM ('URL', 'UPLOAD');

-- CreateEnum
CREATE TYPE "ProcessingStatus" AS ENUM ('QUEUED', 'PROCESSING', 'GENERATING_SUBTITLE', 'GENERATING_THUMBNAIL', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "MediaJobType" AS ENUM ('UPLOAD', 'CLIP_PROCESSING', 'THUMBNAIL', 'SUBTITLE');

-- CreateEnum
CREATE TYPE "SocialConnectionStatus" AS ENUM ('CONNECTED', 'MANUAL', 'NOT_CONNECTED', 'DISABLED');

-- CreateEnum
CREATE TYPE "AuthStatus" AS ENUM ('NOT_CONNECTED', 'CONNECTED', 'EXPIRED', 'ERROR');

-- CreateEnum
CREATE TYPE "UploadMethod" AS ENUM ('MANUAL', 'API', 'BROWSER_AUTOMATION');

-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'READY_TO_POST', 'PUBLISHING', 'POSTED', 'FAILED', 'CANCELED');

-- CreateEnum
CREATE TYPE "PublishMode" AS ENUM ('MANUAL', 'SEMI_AUTO', 'AUTO');

-- CreateEnum
CREATE TYPE "PublishingJobStatus" AS ENUM ('READY_TO_POST', 'PUBLISHING', 'POSTED', 'FAILED', 'CANCELED');

-- CreateEnum
CREATE TYPE "PublishingLogLevel" AS ENUM ('INFO', 'WARN', 'ERROR');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('CLIP', 'IMAGE', 'MOTION_IMAGE', 'AI_VIDEO', 'SCHEDULED_POST', 'IDEA', 'SCRIPT', 'CLIP_PLAN');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'REVIEW', 'APPROVED', 'SCHEDULED', 'POSTED', 'REJECTED', 'FAILED', 'READY');

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

-- CreateTable
CREATE TABLE "VideoSource" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "platform" "Platform" NOT NULL,
    "sourceType" "VideoSourceType" NOT NULL DEFAULT 'URL',
    "sourceFileUrl" TEXT,
    "originalFileName" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
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
    "thumbnailUrl" TEXT,
    "duration" INTEGER NOT NULL,
    "viralScore" INTEGER NOT NULL,
    "outputFileUrl" TEXT,
    "subtitleUrl" TEXT,
    "startTime" INTEGER,
    "endTime" INTEGER,
    "processingStatus" "ProcessingStatus" NOT NULL DEFAULT 'COMPLETED',
    "errorMessage" TEXT,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedClip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostingSchedule" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "contentItemId" TEXT,
    "videoSourceId" TEXT,
    "socialAccountId" TEXT NOT NULL,
    "destination" "Platform" NOT NULL,
    "socialPlatform" "SocialPlatform",
    "startDate" TIMESTAMP(3) NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "postingTime" TEXT NOT NULL,
    "postingEndTime" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Jakarta',
    "videosPerDay" INTEGER NOT NULL,
    "publishMode" "PublishMode" NOT NULL DEFAULT 'MANUAL',
    "status" "ScheduleStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT NOT NULL DEFAULT '',
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
    "projectId" TEXT,
    "name" TEXT NOT NULL,
    "platform" "Platform",
    "socialPlatform" "SocialPlatform",
    "handle" TEXT,
    "niche" TEXT,
    "status" "SocialConnectionStatus" NOT NULL DEFAULT 'MANUAL',
    "uploadMethod" "UploadMethod" NOT NULL DEFAULT 'MANUAL',
    "uploadMode" "PublishMode" NOT NULL DEFAULT 'MANUAL',
    "authStatus" "AuthStatus" NOT NULL DEFAULT 'NOT_CONNECTED',
    "platformAccountId" TEXT,
    "platformAccountName" TEXT,
    "platformAccountAvatar" TEXT,
    "permissionStatus" TEXT NOT NULL DEFAULT 'NOT_REQUESTED',
    "accessTokenEncrypted" TEXT,
    "refreshTokenEncrypted" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "lastSyncAt" TIMESTAMP(3),
    "connectionNotes" TEXT NOT NULL DEFAULT '',
    "loginNotes" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastActivityAt" TIMESTAMP(3),
    "disabledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialAccount_pkey" PRIMARY KEY ("id")
);

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
    "providerStatus" "AIProviderStatus" NOT NULL DEFAULT 'NOT_CONFIGURED',
    "lastTestAt" TIMESTAMP(3),
    "lastTestStatus" "AIProviderStatus",
    "lastTestError" TEXT,
    "mode" "ProviderMode" NOT NULL DEFAULT 'DUMMY',
    "dailyLimit" INTEGER NOT NULL DEFAULT 0,
    "usedToday" INTEGER NOT NULL DEFAULT 0,
    "resetTime" TEXT NOT NULL DEFAULT '00:00',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderCredential" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "apiKeyEncrypted" TEXT NOT NULL DEFAULT '',
    "label" TEXT NOT NULL DEFAULT 'default',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderCredential_pkey" PRIMARY KEY ("id")
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
    "outputUrl" TEXT,
    "duration" INTEGER,
    "providerMode" "ProviderMode" NOT NULL DEFAULT 'DUMMY',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GenerationJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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
    "logs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaProcessingJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentItem" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "socialAccountId" TEXT,
    "creativeAssetId" TEXT,
    "generatedClipId" TEXT,
    "type" "ContentType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "caption" TEXT NOT NULL DEFAULT '',
    "thumbnail" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "workflowStatus" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "reviewNotes" TEXT NOT NULL DEFAULT '',
    "rejectReason" TEXT NOT NULL DEFAULT '',
    "reviewer" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "failureReason" TEXT NOT NULL DEFAULT '',
    "telegramChatId" TEXT,
    "approvalMessageId" TEXT,
    "approvalStatus" TEXT NOT NULL DEFAULT '',
    "sourceType" TEXT NOT NULL DEFAULT '',
    "linkedFromContentId" TEXT,
    "parentAssetId" TEXT,
    "assetStatus" "LibraryAssetStatus" NOT NULL DEFAULT 'ACTIVE',
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "isLatestVersion" BOOLEAN NOT NULL DEFAULT true,
    "versionNotes" TEXT NOT NULL DEFAULT '',
    "archivedAt" TIMESTAMP(3),
    "trashedAt" TIMESTAMP(3),
    "viralScorePrediction" INTEGER,
    "contentAngle" TEXT NOT NULL DEFAULT '',
    "trendKeyword" TEXT NOT NULL DEFAULT '',
    "trendPlatform" "SocialPlatform",
    "fypScore" INTEGER,
    "hook" TEXT NOT NULL DEFAULT '',
    "cta" TEXT NOT NULL DEFAULT '',
    "targetAudience" TEXT NOT NULL DEFAULT '',
    "editingStyle" TEXT NOT NULL DEFAULT '',
    "suggestedDuration" INTEGER,
    "notes" TEXT NOT NULL DEFAULT '',
    "platform" "SocialPlatform",
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIAgent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "AgentRole" NOT NULL,
    "description" TEXT NOT NULL,
    "status" "AgentStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastRunAt" TIMESTAMP(3),
    "totalTasks" INTEGER NOT NULL DEFAULT 0,
    "successRate" DOUBLE PRECISION NOT NULL DEFAULT 96,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIAgent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentTask" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "projectId" TEXT,
    "contentItemId" TEXT,
    "taskType" "AgentTaskType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "AgentTaskStatus" NOT NULL DEFAULT 'COMPLETED',
    "result" TEXT NOT NULL DEFAULT '',
    "priority" "AgentPriority" NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "AgentTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentRecommendation" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "projectId" TEXT,
    "contentItemId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "recommendationType" TEXT NOT NULL,
    "priority" "AgentPriority" NOT NULL DEFAULT 'MEDIUM',
    "score" INTEGER NOT NULL DEFAULT 80,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelegramSetting" (
    "id" TEXT NOT NULL,
    "botTokenEncrypted" TEXT NOT NULL DEFAULT '',
    "chatId" TEXT NOT NULL DEFAULT '',
    "status" "TelegramStatus" NOT NULL DEFAULT 'NOT_CONNECTED',
    "lastTestAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelegramSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoogleOAuthSetting" (
    "id" TEXT NOT NULL,
    "clientIdEncrypted" TEXT NOT NULL DEFAULT '',
    "clientSecretEncrypted" TEXT NOT NULL DEFAULT '',
    "redirectUri" TEXT NOT NULL DEFAULT '',
    "status" "ProviderStatus" NOT NULL DEFAULT 'NOT_CONNECTED',
    "lastTestAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoogleOAuthSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OAuthCredential" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "socialAccountId" TEXT NOT NULL,
    "accessTokenEncrypted" TEXT NOT NULL,
    "refreshTokenEncrypted" TEXT,
    "scope" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OAuthCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OAuthProviderSetting" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "clientIdEncrypted" TEXT NOT NULL DEFAULT '',
    "clientSecretEncrypted" TEXT NOT NULL DEFAULT '',
    "redirectUri" TEXT NOT NULL DEFAULT '',
    "status" "ProviderStatus" NOT NULL DEFAULT 'NOT_CONNECTED',
    "lastTestAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OAuthProviderSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationPlan" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "socialAccountId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "suggestedPlatform" "SocialPlatform",
    "suggestedPostingTime" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "priority" "AgentPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "AutomationPlanStatus" NOT NULL DEFAULT 'DRAFT',
    "createdByAgentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelegramApprovalLog" (
    "id" TEXT NOT NULL,
    "contentItemId" TEXT NOT NULL,
    "action" "TelegramApprovalAction" NOT NULL,
    "telegramMessageId" TEXT,
    "telegramChatId" TEXT,
    "status" "TelegramLogStatus" NOT NULL DEFAULT 'PENDING',
    "responseBy" TEXT,
    "responseAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelegramApprovalLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetCollection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "projectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetCollectionItem" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "contentItemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetCollectionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalHistory" (
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

-- CreateTable
CREATE TABLE "PostAnalytics" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "contentItemId" TEXT NOT NULL,
    "socialAccountId" TEXT NOT NULL,
    "postingScheduleId" TEXT,
    "platform" "SocialPlatform" NOT NULL,
    "postUrl" TEXT NOT NULL DEFAULT '',
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "saves" INTEGER NOT NULL DEFAULT 0,
    "watchTime" INTEGER NOT NULL DEFAULT 0,
    "averageViewDuration" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "followersGained" INTEGER NOT NULL DEFAULT 0,
    "engagementRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "postedAt" TIMESTAMP(3),
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT NOT NULL DEFAULT '',
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformPerformanceSnapshot" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "socialAccountId" TEXT,
    "platform" "SocialPlatform" NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "saves" INTEGER NOT NULL DEFAULT 0,
    "watchTime" INTEGER NOT NULL DEFAULT 0,
    "engagementRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "snapshotDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformPerformanceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationInsight" (
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

-- CreateTable
CREATE TABLE "PublishingChecklist" (
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

-- CreateTable
CREATE TABLE "PublishingJob" (
    "id" TEXT NOT NULL,
    "postingScheduleId" TEXT NOT NULL,
    "contentItemId" TEXT NOT NULL,
    "socialAccountId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "publishMode" "PublishMode" NOT NULL,
    "status" "PublishingJobStatus" NOT NULL DEFAULT 'READY_TO_POST',
    "providerJobId" TEXT,
    "platformPostId" TEXT,
    "platformPostUrl" TEXT,
    "postUrl" TEXT NOT NULL DEFAULT '',
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "publishStartedAt" TIMESTAMP(3),
    "publishCompletedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublishingJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublishingLog" (
    "id" TEXT NOT NULL,
    "publishingJobId" TEXT NOT NULL,
    "level" "PublishingLogLevel" NOT NULL DEFAULT 'INFO',
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublishingLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'INFO',
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNREAD',
    "actionUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntelligenceResult" (
    "id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "score" INTEGER NOT NULL,
    "confidence" INTEGER NOT NULL,
    "volumeLabel" TEXT NOT NULL,
    "trendDirection" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "collectedAt" TIMESTAMP(3) NOT NULL,
    "rawData" JSONB,
    "isDemo" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntelligenceResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateProductInsight" (
    "id" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "trendScore" INTEGER NOT NULL,
    "competitionLevel" TEXT NOT NULL,
    "commissionEstimate" TEXT NOT NULL,
    "priceRange" TEXT NOT NULL,
    "contentPotentialScore" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "confidence" INTEGER NOT NULL,
    "collectedAt" TIMESTAMP(3) NOT NULL,
    "isDemo" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT NOT NULL DEFAULT '',
    "rawData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliateProductInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntelligenceProviderSetting" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "apiKeyEncrypted" TEXT,
    "status" TEXT NOT NULL DEFAULT 'MISSING',
    "lastError" TEXT,
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntelligenceProviderSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedOpportunity" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "platform" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "confidence" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "isDemo" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'saved',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateCampaign" (
    "id" TEXT NOT NULL,
    "campaignName" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "trendScore" INTEGER NOT NULL,
    "competitionLevel" TEXT NOT NULL,
    "commissionEstimate" TEXT NOT NULL,
    "priceRange" TEXT NOT NULL,
    "contentPotentialScore" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "isDemo" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliateCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedContent" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT,
    "opportunityId" TEXT,
    "contentType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "tone" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "isDemo" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedContent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AIProvider_name_key" ON "AIProvider"("name");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthProviderSetting_provider_key" ON "OAuthProviderSetting"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "AssetCollectionItem_collectionId_contentItemId_key" ON "AssetCollectionItem"("collectionId", "contentItemId");

-- CreateIndex
CREATE INDEX "Notification_status_createdAt_idx" ON "Notification"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_type_createdAt_idx" ON "Notification"("type", "createdAt");

-- CreateIndex
CREATE INDEX "IntelligenceResult_platform_collectedAt_idx" ON "IntelligenceResult"("platform", "collectedAt");

-- CreateIndex
CREATE INDEX "IntelligenceResult_keyword_collectedAt_idx" ON "IntelligenceResult"("keyword", "collectedAt");

-- CreateIndex
CREATE INDEX "AffiliateProductInsight_platform_collectedAt_idx" ON "AffiliateProductInsight"("platform", "collectedAt");

-- CreateIndex
CREATE INDEX "AffiliateProductInsight_category_collectedAt_idx" ON "AffiliateProductInsight"("category", "collectedAt");

-- CreateIndex
CREATE UNIQUE INDEX "IntelligenceProviderSetting_provider_key" ON "IntelligenceProviderSetting"("provider");

-- CreateIndex
CREATE INDEX "SavedOpportunity_type_createdAt_idx" ON "SavedOpportunity"("type", "createdAt");

-- CreateIndex
CREATE INDEX "SavedOpportunity_status_createdAt_idx" ON "SavedOpportunity"("status", "createdAt");

-- CreateIndex
CREATE INDEX "AffiliateCampaign_status_createdAt_idx" ON "AffiliateCampaign"("status", "createdAt");

-- CreateIndex
CREATE INDEX "AffiliateCampaign_platform_createdAt_idx" ON "AffiliateCampaign"("platform", "createdAt");

-- CreateIndex
CREATE INDEX "GeneratedContent_campaignId_contentType_idx" ON "GeneratedContent"("campaignId", "contentType");

-- CreateIndex
CREATE INDEX "GeneratedContent_opportunityId_contentType_idx" ON "GeneratedContent"("opportunityId", "contentType");

-- AddForeignKey
ALTER TABLE "VideoSource" ADD CONSTRAINT "VideoSource_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClipSetting" ADD CONSTRAINT "ClipSetting_videoSourceId_fkey" FOREIGN KEY ("videoSourceId") REFERENCES "VideoSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedClip" ADD CONSTRAINT "GeneratedClip_videoSourceId_fkey" FOREIGN KEY ("videoSourceId") REFERENCES "VideoSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedClip" ADD CONSTRAINT "GeneratedClip_clipSettingId_fkey" FOREIGN KEY ("clipSettingId") REFERENCES "ClipSetting"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostingSchedule" ADD CONSTRAINT "PostingSchedule_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostingSchedule" ADD CONSTRAINT "PostingSchedule_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostingSchedule" ADD CONSTRAINT "PostingSchedule_videoSourceId_fkey" FOREIGN KEY ("videoSourceId") REFERENCES "VideoSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostingSchedule" ADD CONSTRAINT "PostingSchedule_socialAccountId_fkey" FOREIGN KEY ("socialAccountId") REFERENCES "SocialAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostingClipDetail" ADD CONSTRAINT "PostingClipDetail_postingScheduleId_fkey" FOREIGN KEY ("postingScheduleId") REFERENCES "PostingSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostingClipDetail" ADD CONSTRAINT "PostingClipDetail_generatedClipId_fkey" FOREIGN KEY ("generatedClipId") REFERENCES "GeneratedClip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialAccount" ADD CONSTRAINT "SocialAccount_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreativeAsset" ADD CONSTRAINT "CreativeAsset_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreativeAsset" ADD CONSTRAINT "CreativeAsset_generationJobId_fkey" FOREIGN KEY ("generationJobId") REFERENCES "GenerationJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderCredential" ADD CONSTRAINT "ProviderCredential_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "AIProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenerationJob" ADD CONSTRAINT "GenerationJob_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenerationJob" ADD CONSTRAINT "GenerationJob_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "AIProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaProcessingJob" ADD CONSTRAINT "MediaProcessingJob_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaProcessingJob" ADD CONSTRAINT "MediaProcessingJob_videoSourceId_fkey" FOREIGN KEY ("videoSourceId") REFERENCES "VideoSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaProcessingJob" ADD CONSTRAINT "MediaProcessingJob_generatedClipId_fkey" FOREIGN KEY ("generatedClipId") REFERENCES "GeneratedClip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_socialAccountId_fkey" FOREIGN KEY ("socialAccountId") REFERENCES "SocialAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_creativeAssetId_fkey" FOREIGN KEY ("creativeAssetId") REFERENCES "CreativeAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_generatedClipId_fkey" FOREIGN KEY ("generatedClipId") REFERENCES "GeneratedClip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_parentAssetId_fkey" FOREIGN KEY ("parentAssetId") REFERENCES "ContentItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentTask" ADD CONSTRAINT "AgentTask_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AIAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentTask" ADD CONSTRAINT "AgentTask_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentTask" ADD CONSTRAINT "AgentTask_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentRecommendation" ADD CONSTRAINT "AgentRecommendation_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AIAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentRecommendation" ADD CONSTRAINT "AgentRecommendation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentRecommendation" ADD CONSTRAINT "AgentRecommendation_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OAuthCredential" ADD CONSTRAINT "OAuthCredential_socialAccountId_fkey" FOREIGN KEY ("socialAccountId") REFERENCES "SocialAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationPlan" ADD CONSTRAINT "AutomationPlan_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationPlan" ADD CONSTRAINT "AutomationPlan_socialAccountId_fkey" FOREIGN KEY ("socialAccountId") REFERENCES "SocialAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationPlan" ADD CONSTRAINT "AutomationPlan_createdByAgentId_fkey" FOREIGN KEY ("createdByAgentId") REFERENCES "AIAgent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelegramApprovalLog" ADD CONSTRAINT "TelegramApprovalLog_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetCollection" ADD CONSTRAINT "AssetCollection_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetCollectionItem" ADD CONSTRAINT "AssetCollectionItem_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "AssetCollection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetCollectionItem" ADD CONSTRAINT "AssetCollectionItem_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalHistory" ADD CONSTRAINT "ApprovalHistory_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostAnalytics" ADD CONSTRAINT "PostAnalytics_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostAnalytics" ADD CONSTRAINT "PostAnalytics_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostAnalytics" ADD CONSTRAINT "PostAnalytics_socialAccountId_fkey" FOREIGN KEY ("socialAccountId") REFERENCES "SocialAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostAnalytics" ADD CONSTRAINT "PostAnalytics_postingScheduleId_fkey" FOREIGN KEY ("postingScheduleId") REFERENCES "PostingSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformPerformanceSnapshot" ADD CONSTRAINT "PlatformPerformanceSnapshot_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformPerformanceSnapshot" ADD CONSTRAINT "PlatformPerformanceSnapshot_socialAccountId_fkey" FOREIGN KEY ("socialAccountId") REFERENCES "SocialAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationInsight" ADD CONSTRAINT "RecommendationInsight_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationInsight" ADD CONSTRAINT "RecommendationInsight_socialAccountId_fkey" FOREIGN KEY ("socialAccountId") REFERENCES "SocialAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationInsight" ADD CONSTRAINT "RecommendationInsight_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublishingChecklist" ADD CONSTRAINT "PublishingChecklist_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublishingChecklist" ADD CONSTRAINT "PublishingChecklist_postingScheduleId_fkey" FOREIGN KEY ("postingScheduleId") REFERENCES "PostingSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublishingJob" ADD CONSTRAINT "PublishingJob_postingScheduleId_fkey" FOREIGN KEY ("postingScheduleId") REFERENCES "PostingSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublishingJob" ADD CONSTRAINT "PublishingJob_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublishingJob" ADD CONSTRAINT "PublishingJob_socialAccountId_fkey" FOREIGN KEY ("socialAccountId") REFERENCES "SocialAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublishingLog" ADD CONSTRAINT "PublishingLog_publishingJobId_fkey" FOREIGN KEY ("publishingJobId") REFERENCES "PublishingJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedContent" ADD CONSTRAINT "GeneratedContent_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "AffiliateCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedContent" ADD CONSTRAINT "GeneratedContent_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "SavedOpportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

