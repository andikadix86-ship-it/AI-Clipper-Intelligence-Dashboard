import { NextResponse } from "next/server";
import { mapSchedule } from "@/lib/scheduler-service";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notification-service";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  let body: { notes?: string };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  try {
    const schedule = await prisma.postingSchedule.update({
      where: { id: params.id },
      data: { status: "FAILED", notes: body.notes ?? "Manual posting failed." },
      include: { project: true, contentItem: true, socialAccount: true, analytics: { orderBy: { recordedAt: "desc" }, take: 1 } }
    });

    if (schedule.contentItemId) {
      await prisma.contentItem.update({
        where: { id: schedule.contentItemId },
        data: { status: "FAILED", workflowStatus: "FAILED", failureReason: body.notes ?? "Manual posting failed." }
      });
    }
    await createNotification({ title: "Publishing failed", message: `${schedule.contentItem?.title ?? "Scheduled content"} gagal dipublikasikan.`, type: "PUBLISHING_FAILED", severity: "ERROR", source: "Scheduler", actionUrl: "/publishing?status=failed" });

    return NextResponse.json({ schedule: mapSchedule(schedule) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Schedule could not be marked as failed." },
      { status: 500 }
    );
  }
}
