import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  try {
    const [reviewQueue, approvalQueue, scheduledToday, failedPosting, publishedContent, scheduledContent, agents, activities, unreadNotifications, providerWarnings, recommendationsReady] = await Promise.all([
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
    ]);

    return NextResponse.json({
      operations: { reviewQueue, approvalQueue, scheduledToday, failedPosting },
      analytics: { publishedContent, scheduledContent, approvalPending: approvalQueue, failedContent: failedPosting },
      aiTeam: agents.map((agent) => ({
        name: agent.name,
        status: agent.status === "DISABLED" ? "Offline" : agent.status === "PAUSED" ? "Waiting" : agent.lastRunAt && Date.now() - agent.lastRunAt.getTime() < 5 * 60 * 1000 ? "Working" : "Active"
      })),
      notifications: { unreadNotifications, providerWarnings, recommendationsReady },
      recentActivities: activities.map((item) => item.message)
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Dashboard operations could not be loaded." },
      { status: 500 }
    );
  }
}
