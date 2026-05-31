CREATE TYPE "AgentRole" AS ENUM ('CEO', 'RESEARCH', 'SCRIPT', 'CLIPPER', 'CREATIVE', 'SCHEDULER', 'ANALYST');
CREATE TYPE "AgentStatus" AS ENUM ('ACTIVE', 'PAUSED', 'DISABLED');
CREATE TYPE "AgentTaskType" AS ENUM ('RESEARCH_TREND', 'GENERATE_CONTENT_IDEA', 'REVIEW_CONTENT', 'RECOMMEND_SCHEDULE', 'ANALYZE_PERFORMANCE');
CREATE TYPE "AgentTaskStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');
CREATE TYPE "AgentPriority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

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

ALTER TABLE "AgentTask"
ADD CONSTRAINT "AgentTask_agentId_fkey"
FOREIGN KEY ("agentId") REFERENCES "AIAgent"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AgentTask"
ADD CONSTRAINT "AgentTask_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "Project"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AgentTask"
ADD CONSTRAINT "AgentTask_contentItemId_fkey"
FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AgentRecommendation"
ADD CONSTRAINT "AgentRecommendation_agentId_fkey"
FOREIGN KEY ("agentId") REFERENCES "AIAgent"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AgentRecommendation"
ADD CONSTRAINT "AgentRecommendation_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "Project"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AgentRecommendation"
ADD CONSTRAINT "AgentRecommendation_contentItemId_fkey"
FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
