import { NextResponse } from "next/server";
import { getNotifications } from "@/lib/notification-service";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json(await getNotifications());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Notifications could not be loaded." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}));
  try {
    if (body.markAllRead) {
      await prisma.notification.updateMany({ where: { status: "UNREAD" }, data: { status: "READ" } });
    } else if (body.id) {
      await prisma.notification.update({ where: { id: body.id }, data: { status: "READ" } });
    } else {
      return NextResponse.json({ error: "Notification id or markAllRead is required." }, { status: 400 });
    }
    return NextResponse.json(await getNotifications());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Notification could not be updated." }, { status: 500 });
  }
}
