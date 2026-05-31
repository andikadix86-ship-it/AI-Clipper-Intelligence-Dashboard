import { NextResponse } from "next/server";
import { mapSchedule } from "@/lib/scheduler-service";
import { prisma } from "@/lib/prisma";

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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Schedules could not be loaded from Supabase." },
      { status: 500 }
    );
  }
}
