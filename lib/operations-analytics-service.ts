import { prisma } from "@/lib/prisma";

export async function getOperationsAnalytics() {
  const [
    totalProjects,
    totalCampaigns,
    totalAssets,
    publishedContent,
    scheduledContent,
    approvalPending,
    failedContent,
    assetsGenerated,
    videosGenerated,
    publishedVideos,
    generatedHooks,
    generatedScripts,
    generatedCaptions,
    winningProductsSaved,
    affiliateContentCreated,
    contentByStatus,
    recentActivities
  ] = await Promise.all([
    prisma.project.count(),
    prisma.affiliateCampaign.count(),
    prisma.contentItem.count(),
    prisma.contentItem.count({ where: { workflowStatus: "POSTED" } }),
    prisma.contentItem.count({ where: { workflowStatus: "SCHEDULED" } }),
    prisma.contentItem.count({ where: { workflowStatus: "REVIEW" } }),
    prisma.contentItem.count({ where: { workflowStatus: "FAILED" } }),
    prisma.creativeAsset.count(),
    prisma.contentItem.count({ where: { type: { in: ["CLIP", "MOTION_IMAGE", "AI_VIDEO"] } } }),
    prisma.contentItem.count({ where: { type: { in: ["CLIP", "MOTION_IMAGE", "AI_VIDEO"] }, workflowStatus: "POSTED" } }),
    prisma.generatedContent.count({ where: { contentType: "hook" } }),
    prisma.generatedContent.count({ where: { contentType: "script" } }),
    prisma.generatedContent.count({ where: { contentType: "caption" } }),
    prisma.savedOpportunity.count({ where: { type: "affiliate_product" } }),
    prisma.generatedContent.count(),
    prisma.contentItem.groupBy({ by: ["workflowStatus"], _count: { _all: true } }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 12 })
  ]);

  return {
    overview: { totalProjects, totalCampaigns, totalAssets, publishedContent, scheduledContent, approvalPending, failedContent },
    creator: {
      projects: totalProjects,
      assetsGenerated,
      videosGenerated,
      publishedVideos,
      contentByStatus: contentByStatus.map((item) => ({ status: item.workflowStatus, count: item._count._all }))
    },
    affiliate: { campaigns: totalCampaigns, generatedHooks, generatedScripts, generatedCaptions, winningProductsSaved, contentCreated: affiliateContentCreated },
    recentActivities: recentActivities.map((item) => ({
      id: item.id,
      action: item.action,
      entityType: item.entityType,
      message: item.message,
      createdAt: item.createdAt.toISOString()
    }))
  };
}

export async function getAgentCenter() {
  const [agents, tasks, automationPlans, projects, campaigns, pendingApproval, failedJobs, providerIssues, opportunities, activities] = await Promise.all([
    prisma.aIAgent.findMany({ orderBy: { role: "asc" } }),
    prisma.agentTask.findMany({ orderBy: { createdAt: "desc" }, take: 150, include: { agent: true } }),
    prisma.automationPlan.count({ where: { status: "WAITING_APPROVAL" } }),
    prisma.project.count(),
    prisma.affiliateCampaign.count(),
    prisma.contentItem.count({ where: { workflowStatus: "REVIEW" } }),
    prisma.publishingJob.count({ where: { status: "FAILED" } }),
    prisma.aIProvider.count({ where: { providerStatus: "ERROR" } }),
    prisma.savedOpportunity.count(),
    prisma.auditLog.findMany({ where: { entityType: { in: ["AIAgent", "AutomationPlan"] } }, orderBy: { createdAt: "desc" }, take: 16 })
  ]);

  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  return {
    agents: agents.map((agent) => {
      const rows = tasks.filter((task) => task.agentId === agent.id);
      const queue = {
        pending: rows.filter((task) => task.status === "QUEUED").length,
        running: rows.filter((task) => task.status === "RUNNING").length,
        completed: rows.filter((task) => task.status === "COMPLETED").length,
        failed: rows.filter((task) => task.status === "FAILED").length
      };
      const operationalStatus =
        agent.status === "DISABLED" ? "Offline" :
        queue.failed > 0 ? "Error" :
        agent.status === "PAUSED" ? "Waiting" :
        queue.running > 0 || Boolean(agent.lastRunAt && agent.lastRunAt.getTime() >= fiveMinutesAgo) ? "Working" :
        "Active";
      return {
        id: agent.id,
        name: agent.name,
        role: agent.role,
        roleLabel: `${agent.role.charAt(0)}${agent.role.slice(1).toLowerCase()} Agent`,
        description: agent.description,
        status: agent.status,
        statusLabel: agent.status === "ACTIVE" ? "Active" : agent.status === "PAUSED" ? "Paused" : "Disabled",
        totalTasks: agent.totalTasks,
        successRate: agent.successRate,
        createdAt: agent.createdAt.toISOString(),
        operationalStatus,
        lastActivity: agent.lastRunAt?.toISOString(),
        tasksCompleted: queue.completed,
        currentQueue: queue.pending + queue.running,
        queue
      };
    }),
    ceo: { projects, campaigns, pendingApproval, failedJobs, providerIssues, opportunities, automationPlans },
    logs: activities.map((item) => ({ id: item.id, timestamp: item.createdAt.toISOString(), agent: item.entityId ?? item.entityType, action: item.action, status: item.action.includes("FAILED") ? "Failed" : "Completed", message: item.message }))
  };
}
