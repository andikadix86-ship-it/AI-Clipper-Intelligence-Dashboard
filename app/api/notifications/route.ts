import { NextResponse } from "next/server";
import { apiFallback } from "@/lib/api-response";
import { getNotifications } from "@/lib/notification-service";
import { prisma } from "@/lib/prisma";
import { withTimeout } from "@/lib/db-timeout";
import { serverLogger } from "@/lib/server-logger";

export const runtime = "nodejs";

const fallbackMessage = "Database unavailable, using empty notifications.";

function fallbackNotifications() {
  return {
    notifications: [],
    items: [],
    unreadCount: 0,
    providerWarningCount: 0,
    recommendationCount: 0,
    source: "fallback",
    message: fallbackMessage
  };
}

function notificationFallbackResponse() {
  return apiFallback(fallbackMessage, "NOTIFICATION_UNAVAILABLE", fallbackNotifications(), "notifications");
}

export async function GET() {
  try {
    const notifications = await withTimeout(getNotifications());
    return NextResponse.json({ ...notifications, notifications: notifications.items, source: "database" });
  } catch (error) {
    serverLogger.warn("notifications.list.fallback", undefined, error);
    return notificationFallbackResponse();
  }
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}));
  try {
    if (body.markAllRead) {
      await withTimeout(prisma.notification.updateMany({ where: { status: "UNREAD" }, data: { status: "READ" } }));
    } else if (body.id) {
      await withTimeout(prisma.notification.update({ where: { id: body.id }, data: { status: "READ" } }));
    } else {
      return NextResponse.json({ error: "Notification id or markAllRead is required." }, { status: 400 });
    }
    const notifications = await withTimeout(getNotifications());
    return NextResponse.json({ ...notifications, notifications: notifications.items, source: "database" });
  } catch (error) {
    serverLogger.warn("notifications.update.fallback", undefined, error);
    return notificationFallbackResponse();
  }
}
