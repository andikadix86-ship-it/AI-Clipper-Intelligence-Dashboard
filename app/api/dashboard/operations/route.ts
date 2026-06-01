import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withTimeout } from "@/lib/db-timeout";

export const runtime = "nodejs";

const fallbackOperations = {
  operations: { reviewQueue: 0, approvalQueue: 0, scheduledToday: 0, failedPosting: 0 },
  analytics: { publishedContent: 0, scheduledContent: 0, approvalPending: 0, failedContent: 0 },
  aiTeam: [],
  notifications: { unreadNotifications: 0, providerWarnings: 0, recommendationsReady: 0 },
  recentActivities: [],
  source: "fallback",
  message: "Database unavailable, using empty dashboard summary."
};

export async function GET() {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  try {
    const [reviewQueue, approvalQueue, scheduledToday, failedPosting, publishedContent, scheduledContent, agents, activities, unreadNotifications, providerWarnings, recommendationsReady] = await withTimeout(Promise.all([
      prisma.contentItem.count({ where: { workflowStatus: "DRAFT" } }),
      prisma.contentItem.count({ where: { workflowStatus: "REVIEW" } }),
      prisma.postingSchedule.count({
        where: {
          scheduledAt: { gte: startOfDay, lt: endOfDay },
          status: { in: ["SCHEDULED", "READY_TO_POST", "PUBLISHING"] }
        }
      }),
      prisma.postingSchedule.count({ where: { status: "FAILED" } }),
      prisma.contentItem.count({ where: { workflowStatus: "POSTED" } }),
      prisma.contentItem.count({ where: { workflowStatus: "SCHEDULED" } }),
      prisma.aIAgent.findMany({ orderBy: { role: "asc" }, take: 7 }),
      prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
      prisma.notification.count({ where: { status: "UNREAD" } }),
      prisma.notification.count({ where: { status: "UNREAD", type: { in: ["PROVIDER_QUOTA_LIMITED", "API_KEY_MISSING", "DUMMY_FALLBACK"] } } }),
      prisma.notification.count({ where: { status: "UNREAD", type: "RECOMMENDATION_READY" } })
    ]));

    return NextResponse.json({
      operations: { reviewQueue, approvalQueue, scheduledToday, failedPosting },
      analytics: { publishedContent, scheduledContent, approvalPending: approvalQueue, failedContent: failedPosting },
      aiTeam: agents.map((agent) => ({
        name: agent.name,
        status: agent.status === "DISABLED" ? "Offline" : agent.status === "PAUSED" ? "Waiting" : agent.lastRunAt && Date.now() - agent.lastRunAt.getTime() < 5 * 60 * 1000 ? "Working" : "Active"
      })),
      notifications: { unreadNotifications, providerWarnings, recommendationsReady },
      recentActivities: activities.map((item) => item.message),
      source: "database"
    });
  } catch (error) {
    console.error("[dashboard] Database unavailable while loading operations summary.", error);
    return NextResponse.json(fallbackOperations);
  }
}
