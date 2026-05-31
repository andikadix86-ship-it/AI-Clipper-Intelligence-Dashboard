import { NextResponse } from "next/server";
import { mapSchedule } from "@/lib/scheduler-service";
import { prisma } from "@/lib/prisma";
import { upsertPerformance } from "@/lib/analytics-service";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  let body: { postUrl?: string; postedAt?: string; notes?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const schedule = await prisma.postingSchedule.update({
      where: { id: params.id },
      data: { status: "POSTED", notes: body.notes },
      include: { project: true, contentItem: true, socialAccount: true, analytics: { orderBy: { recordedAt: "desc" }, take: 1 } }
    });
    if (!schedule.contentItemId) return NextResponse.json({ error: "Schedule has no content item." }, { status: 400 });

    await prisma.contentItem.update({
      where: { id: schedule.contentItemId },
      data: { status: "POSTED", workflowStatus: "POSTED", publishedAt: body.postedAt ? new Date(body.postedAt) : new Date(), failureReason: "" }
    });

    const analytics = await upsertPerformance({
      projectId: schedule.projectId ?? undefined,
      contentItemId: schedule.contentItemId,
      socialAccountId: schedule.socialAccountId,
      postingScheduleId: schedule.id,
      platform: schedule.socialPlatform ?? "YOUTUBE_SHORTS",
      postUrl: body.postUrl,
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
      watchTime: 0,
      averageViewDuration: 0,
      followersGained: 0,
      postedAt: body.postedAt,
      notes: body.notes
    });

    return NextResponse.json({ schedule: mapSchedule(schedule), analytics });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Schedule could not be marked as posted." },
      { status: 500 }
    );
  }
}
