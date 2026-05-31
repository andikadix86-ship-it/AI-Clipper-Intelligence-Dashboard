import { NextResponse } from "next/server";
import { upsertPerformance } from "@/lib/analytics-service";
import { prisma } from "@/lib/prisma";
import type { SocialPlatform } from "@/lib/types";

export const runtime = "nodejs";

type PerformanceRequest = {
  postingScheduleId: string;
  contentItemId?: string;
  socialAccountId?: string;
  projectId?: string;
  platform?: SocialPlatform;
  postUrl?: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  watchTime: number;
  averageViewDuration: number;
  followersGained: number;
  postedAt?: string;
  notes?: string;
};

export async function POST(request: Request) {
  let body: PerformanceRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const schedule = await prisma.postingSchedule.findUnique({ where: { id: body.postingScheduleId } });
    if (!schedule) return NextResponse.json({ error: "Schedule not found." }, { status: 404 });
    const contentItemId = body.contentItemId ?? schedule.contentItemId;
    if (!contentItemId) return NextResponse.json({ error: "Schedule has no content item." }, { status: 400 });

    const analytics = await upsertPerformance({
      contentItemId,
      socialAccountId: body.socialAccountId ?? schedule.socialAccountId,
      postingScheduleId: schedule.id,
      platform: body.platform ?? schedule.socialPlatform ?? "YOUTUBE_SHORTS",
      projectId: body.projectId ?? schedule.projectId ?? undefined,
      postUrl: body.postUrl,
      views: body.views,
      likes: body.likes,
      comments: body.comments,
      shares: body.shares,
      saves: body.saves,
      watchTime: body.watchTime,
      averageViewDuration: body.averageViewDuration,
      followersGained: body.followersGained,
      postedAt: body.postedAt,
      notes: body.notes
    });

    return NextResponse.json({ analytics });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Publishing performance could not be saved." },
      { status: 500 }
    );
  }
}
