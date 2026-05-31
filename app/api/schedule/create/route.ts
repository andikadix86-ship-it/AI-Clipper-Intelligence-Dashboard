import { NextResponse } from "next/server";
import { withTimeout } from "@/lib/db-timeout";
import { prisma } from "@/lib/prisma";
import type { Platform, PostingClipDetailDto } from "@/lib/types";

export const runtime = "nodejs";

type ScheduleRequest = {
  videoSourceId?: string;
  socialAccountName: string;
  destination: Platform;
  startDate: string;
  postingTime: string;
  postingEndTime: string;
  timezone: string;
  videosPerDay: number;
  clips: PostingClipDetailDto[];
};

export async function POST(request: Request) {
  let body: ScheduleRequest;
  try {
    body = (await request.json()) as ScheduleRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.clips?.length) {
    return NextResponse.json({ error: "Select at least one clip." }, { status: 400 });
  }

  if (!body.startDate || !body.postingTime || !body.postingEndTime) {
    return NextResponse.json({ error: "Schedule date and posting time are required." }, { status: 400 });
  }

  try {
    const socialAccount =
      (await withTimeout(
        prisma.socialAccount.findFirst({
          where: { name: body.socialAccountName || "Fatih" }
        }),
        7000
      )) ??
      (await withTimeout(
        prisma.socialAccount.create({
          data: {
            name: body.socialAccountName || "Fatih",
            platform: body.destination,
            handle: "@fatih"
          }
        }),
        7000
      ));

    const schedule = await withTimeout(
      prisma.postingSchedule.create({
        data: {
          videoSourceId: body.videoSourceId?.startsWith("preview_") ? undefined : body.videoSourceId,
          socialAccountId: socialAccount.id,
          destination: body.destination,
          startDate: new Date(`${body.startDate}T00:00:00.000Z`),
          postingTime: body.postingTime,
          postingEndTime: body.postingEndTime,
          timezone: body.timezone || "Asia/Jakarta",
          videosPerDay: Math.max(1, Number(body.videosPerDay) || 1),
          clipDetails: {
            create: body.clips.map((clip) => ({
              generatedClipId: clip.generatedClipId,
              title: clip.title,
              description: clip.description,
              tags: clip.tags,
              privacyStatus: clip.privacyStatus,
              notifySubscriber: clip.notifySubscriber,
              madeForKids: clip.madeForKids
            }))
          }
        },
        include: { clipDetails: true, socialAccount: true }
      }),
      7000
    );

    return NextResponse.json({ schedule });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Schedule could not be saved. Check DATABASE_URL, migration state, and clip IDs.",
        detail: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
