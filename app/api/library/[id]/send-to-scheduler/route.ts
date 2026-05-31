import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  let content;
  try {
    content = await prisma.contentItem.findUnique({ where: { id: params.id } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Content item could not be sent to scheduler." },
      { status: 500 }
    );
  }
  if (!content) return NextResponse.json({ error: "Content item not found." }, { status: 404 });
  if (content.workflowStatus !== "APPROVED") {
    return NextResponse.json({ error: "Only Approved content can be sent to Scheduler." }, { status: 400 });
  }

  const socialAccount =
    (await prisma.socialAccount.findFirst({ where: { projectId: content.projectId ?? undefined } })) ??
    (await prisma.socialAccount.findFirst()) ??
    (await prisma.socialAccount.create({
      data: {
        name: "Fatih Manual Upload",
        handle: "@fatih",
        socialPlatform: content.platform ?? "YOUTUBE_SHORTS",
        status: "MANUAL",
        isActive: true
      }
    }));

  const now = new Date();
  const postingTime = "09:00";
  const schedule = await prisma.postingSchedule.create({
    data: {
      projectId: content.projectId,
      contentItemId: content.id,
      socialAccountId: socialAccount.id,
      destination: content.platform === "TIKTOK" ? "TIKTOK" : content.platform === "INSTAGRAM_REELS" ? "INSTAGRAM" : "YOUTUBE",
      socialPlatform: content.platform ?? socialAccount.socialPlatform ?? "YOUTUBE_SHORTS",
      startDate: now,
      scheduledAt: now,
      postingTime,
      postingEndTime: "21:00",
      timezone: "Asia/Jakarta",
      videosPerDay: 1,
      status: "DRAFT"
    }
  });

  await prisma.contentItem.update({ where: { id: content.id }, data: { status: "SCHEDULED", workflowStatus: "SCHEDULED", scheduledAt: now, failureReason: "" } });
  return NextResponse.json({ scheduleId: schedule.id });
}
