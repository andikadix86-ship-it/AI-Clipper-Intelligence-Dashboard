import { NextResponse } from "next/server";
import { mapSchedule } from "@/lib/scheduler-service";
import { prisma } from "@/lib/prisma";
import { serverLogger } from "@/lib/server-logger";

export const runtime = "nodejs";

export async function GET() {
  try {
    const schedules = await prisma.postingSchedule.findMany({
      orderBy: [{ scheduledAt: "asc" }, { startDate: "asc" }],
      include: {
        project: true,
        contentItem: true,
        socialAccount: true,
        analytics: { orderBy: { recordedAt: "desc" }, take: 1 }
      }
    });

    return NextResponse.json({ schedules: schedules.map((schedule) => mapSchedule(schedule)) });
  } catch (error) {
    serverLogger.warn("scheduler.list.database_fallback", undefined, error);
    return NextResponse.json({ schedules: [], source: "fallback", message: "Database unavailable, using empty schedule list." });
  }
}
