import { prisma } from "@/lib/prisma";
import { serverLogger } from "@/lib/server-logger";

export type NotificationInput = {
  title: string;
  message: string;
  type: string;
  severity?: "INFO" | "WARNING" | "ERROR" | "SUCCESS";
  source: string;
  actionUrl?: string;
};

export async function createNotification(input: NotificationInput) {
  try {
    return await prisma.notification.create({ data: { ...input, severity: input.severity ?? "INFO" } });
  } catch (error) {
    serverLogger.warn("notifications.create.fallback", { source: input.source, type: input.type }, error);
    return null;
  }
}

export async function getNotifications() {
  const [items, unreadCount, providerWarningCount, recommendationCount] = await Promise.all([
    prisma.notification.findMany({ orderBy: { createdAt: "desc" }, take: 40 }),
    prisma.notification.count({ where: { status: "UNREAD" } }),
    prisma.notification.count({ where: { status: "UNREAD", type: { in: ["PROVIDER_QUOTA_LIMITED", "API_KEY_MISSING", "DUMMY_FALLBACK"] } } }),
    prisma.notification.count({ where: { status: "UNREAD", type: "RECOMMENDATION_READY" } })
  ]);
  return { items: items.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() })), unreadCount, providerWarningCount, recommendationCount };
}
