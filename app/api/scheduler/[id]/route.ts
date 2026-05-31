import { NextResponse } from "next/server";
import { mapSchedule } from "@/lib/scheduler-service";
import { prisma } from "@/lib/prisma";
import type { PublishMode, SocialPlatform } from "@/lib/types";

export const runtime = "nodejs";

type SchedulePatch = {
  projectId?: string;
  contentItemId?: string;
  socialAccountId?: string;
  platform?: SocialPlatform;
  date?: string;
  time?: string;
  videosPerDay?: number;
  publishMode?: PublishMode;
  status?: "DRAFT" | "SCHEDULED" | "READY_TO_POST" | "PUBLISHING" | "POSTED" | "FAILED" | "CANCELED";
  notes?: string;
};

function destinationFromPlatform(platform: SocialPlatform) {
  if (platform === "TIKTOK") return "TIKTOK";
  if (platform === "INSTAGRAM_REELS" || platform === "FACEBOOK_REELS") return "INSTAGRAM";
  return "YOUTUBE";
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  let body: SchedulePatch;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const current = await prisma.postingSchedule.findUnique({ where: { id: params.id } });
    if (!current) return NextResponse.json({ error: "Schedule not found." }, { status: 404 });

    const nextDate = body.date ?? (current.scheduledAt ?? current.startDate).toISOString().slice(0, 10);
    const nextTime = body.time ?? current.postingTime;
    const nextPlatform = body.platform ?? current.socialPlatform ?? "YOUTUBE_SHORTS";

    const schedule = await prisma.postingSchedule.update({
      where: { id: params.id },
      data: {
        projectId: body.projectId,
        contentItemId: body.contentItemId,
        socialAccountId: body.socialAccountId,
        socialPlatform: body.platform,
        destination: body.platform ? destinationFromPlatform(body.platform) : undefined,
        startDate: body.date ? new Date(`${body.date}T00:00:00.000Z`) : undefined,
        scheduledAt: body.date || body.time ? new Date(`${nextDate}T${nextTime}:00.000Z`) : undefined,
        postingTime: body.time,
        postingEndTime: body.time,
        videosPerDay: body.videosPerDay,
        publishMode: body.publishMode,
        status: body.status,
        notes: body.notes
      },
      include: {
        project: true,
        contentItem: true,
        socialAccount: true,
        analytics: { orderBy: { recordedAt: "desc" }, take: 1 }
      }
    });

    if (body.status && schedule.contentItemId) {
      await prisma.contentItem.update({
        where: { id: schedule.contentItemId },
        data: {
          status: body.status === "POSTED" ? "POSTED" : body.status === "FAILED" ? "FAILED" : "SCHEDULED",
          workflowStatus: body.status === "POSTED" ? "POSTED" : body.status === "FAILED" ? "FAILED" : "SCHEDULED",
          scheduledAt: schedule.scheduledAt,
          publishedAt: body.status === "POSTED" ? new Date() : undefined,
          failureReason: body.status === "FAILED" ? body.notes ?? "Publishing failed." : ""
        }
      });
    }

    return NextResponse.json({ schedule: mapSchedule({ ...schedule, socialPlatform: nextPlatform }) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Schedule could not be updated in Supabase." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.postingSchedule.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Schedule could not be deleted from Supabase." },
      { status: 500 }
    );
  }
}
