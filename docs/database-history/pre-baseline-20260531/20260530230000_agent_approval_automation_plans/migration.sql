CREATE TYPE "AutomationPlanStatus" AS ENUM ('DRAFT', 'WAITING_APPROVAL', 'APPROVED', 'REJECTED', 'EXECUTED');

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

ALTER TABLE "AutomationPlan"
ADD CONSTRAINT "AutomationPlan_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "Project"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AutomationPlan"
ADD CONSTRAINT "AutomationPlan_socialAccountId_fkey"
FOREIGN KEY ("socialAccountId") REFERENCES "SocialAccount"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AutomationPlan"
ADD CONSTRAINT "AutomationPlan_createdByAgentId_fkey"
FOREIGN KEY ("createdByAgentId") REFERENCES "AIAgent"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
