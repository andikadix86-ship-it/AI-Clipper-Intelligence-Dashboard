import { apiError, apiSuccess, parseJsonBody } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/audit-log";
import { mapSchedule } from "@/lib/scheduler-service";
import { prisma } from "@/lib/prisma";
import type { PublishMode, SocialPlatform } from "@/lib/types";
import { createNotification } from "@/lib/notification-service";

export const runtime = "nodejs";

type SchedulerRequest = {
  projectId?: string;
  contentItemId: string;
  socialAccountId: string;
  platform: SocialPlatform;
  date: string;
  time: string;
  videosPerDay: number;
  publishMode?: PublishMode;
  status: "DRAFT" | "SCHEDULED" | "READY_TO_POST" | "PUBLISHING" | "POSTED" | "FAILED" | "CANCELED";
  notes?: string;
};

function destinationFromPlatform(platform: SocialPlatform) {
  if (platform === "TIKTOK") return "TIKTOK";
  if (platform === "INSTAGRAM_REELS") return "INSTAGRAM";
  return "YOUTUBE";
}

export async function POST(request: Request) {
  let body: SchedulerRequest;
  body = (await parseJsonBody<SchedulerRequest>(request)) as SchedulerRequest;
  if (!body) return apiError("Invalid JSON body.", 400);

  if (!body.contentItemId || !body.socialAccountId || !body.date || !body.time) {
    return apiError("Content, social account, date, and time are required.", 400);
  }

  try {
    const content = await prisma.contentItem.findUnique({ where: { id: body.contentItemId } });
    if (!content) return apiError("Content item not found.", 404);
    if (!["APPROVED", "SCHEDULED"].includes(content.workflowStatus)) {
      return apiError("Only Approved content can be scheduled.", 400);
    }

    const schedule = await prisma.postingSchedule.create({
      data: {
        projectId: body.projectId || undefined,
        contentItemId: body.contentItemId,
        socialAccountId: body.socialAccountId,
        destination: destinationFromPlatform(body.platform),
        socialPlatform: body.platform,
        startDate: new Date(`${body.date}T00:00:00.000Z`),
        scheduledAt: new Date(`${body.date}T${body.time}:00.000Z`),
        postingTime: body.time,
        postingEndTime: body.time,
        timezone: "Asia/Jakarta",
        videosPerDay: Math.max(1, Number(body.videosPerDay) || 1),
        publishMode: body.publishMode ?? "MANUAL",
        status: body.status,
        notes: body.notes ?? ""
      },
      include: {
        project: true,
        contentItem: true,
        socialAccount: true,
        analytics: { orderBy: { recordedAt: "desc" }, take: 1 }
      }
    });

    await prisma.contentItem.update({
      where: { id: body.contentItemId },
      data: {
        status: body.status === "POSTED" ? "POSTED" : body.status === "FAILED" ? "FAILED" : "SCHEDULED",
        workflowStatus: body.status === "POSTED" ? "POSTED" : body.status === "FAILED" ? "FAILED" : "SCHEDULED",
        scheduledAt: schedule.scheduledAt,
        publishedAt: body.status === "POSTED" ? new Date() : undefined,
        failureReason: body.status === "FAILED" ? body.notes ?? "Schedule creation failed." : ""
      }
    });

    await writeAuditLog({
      action: "SCHEDULE_POST",
      entityType: "PostingSchedule",
      entityId: schedule.id,
      message: `Schedule created for ${schedule.contentItem?.title ?? "content"}.`,
      metadata: { contentItemId: body.contentItemId, socialAccountId: body.socialAccountId, platform: body.platform, scheduledAt: schedule.scheduledAt }
    });
    await createNotification({ title: "Content scheduled", message: `${schedule.contentItem?.title ?? "Content"} dijadwalkan pada ${body.date} ${body.time}.`, type: "CONTENT_SCHEDULED", severity: "INFO", source: "Scheduler", actionUrl: "/schedule" });

    const mapped = mapSchedule(schedule);
    return apiSuccess("Schedule created.", { schedule: mapped }, { schedule: mapped });
  } catch (error) {
    return apiError("Schedule could not be saved to Supabase.", 500, error);
  }
}
