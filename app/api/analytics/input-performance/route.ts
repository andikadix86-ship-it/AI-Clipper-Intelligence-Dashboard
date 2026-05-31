import { NextResponse } from "next/server";
import { upsertPerformance } from "@/lib/analytics-service";
import { prisma } from "@/lib/prisma";
import type { SocialPlatform } from "@/lib/types";

export const runtime = "nodejs";

type PerformanceRequest = {
  contentItemId?: string;
  socialAccountId?: string;
  postingScheduleId?: string;
  platform?: SocialPlatform;
  projectId?: string;
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
    let contentItemId = body.contentItemId;
    let socialAccountId = body.socialAccountId;
    let projectId = body.projectId;
    let platform = body.platform;

    if (body.postingScheduleId) {
      const schedule = await prisma.postingSchedule.findUnique({ where: { id: body.postingScheduleId } });
      if (!schedule) return NextResponse.json({ error: "Schedule not found." }, { status: 404 });
      contentItemId = contentItemId ?? schedule.contentItemId ?? undefined;
      socialAccountId = socialAccountId ?? schedule.socialAccountId;
      projectId = projectId ?? schedule.projectId ?? undefined;
      platform = platform ?? schedule.socialPlatform ?? "YOUTUBE_SHORTS";
    }

    if (!contentItemId || !socialAccountId || !platform) {
      return NextResponse.json({ error: "Content, social account, and platform are required." }, { status: 400 });
    }

    const analytics = await upsertPerformance({
      contentItemId,
      socialAccountId,
      postingScheduleId: body.postingScheduleId,
      platform,
      projectId,
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
      { error: error instanceof Error ? error.message : "Performance could not be saved." },
      { status: 500 }
    );
  }
}
