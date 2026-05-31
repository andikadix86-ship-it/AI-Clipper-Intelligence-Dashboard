import { apiError, apiSuccess, parseJsonBody } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/audit-log";
import { markPublishingPosted } from "@/lib/publishing-job-service";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notification-service";

export const runtime = "nodejs";

type MarkPostedRequest = {
  postingScheduleId: string;
  postUrl: string;
  postedAt?: string;
  notes?: string;
};

export async function POST(request: Request) {
  let body: MarkPostedRequest;
  body = (await parseJsonBody<MarkPostedRequest>(request)) as MarkPostedRequest;
  if (!body) return apiError("Invalid JSON body.", 400);

  if (!body.postingScheduleId || !body.postUrl) {
    return apiError("Schedule and Post URL are required.", 400);
  }

  try {
    const result = await markPublishingPosted(body);
    const schedule = result.schedule;
    const analytics = result.analytics;

    await prisma.publishingChecklist.upsert({
      where: { id: (await prisma.publishingChecklist.findFirst({ where: { postingScheduleId: schedule.id } }))?.id ?? "__new__" },
      update: { uploadedManually: true, postUrlAdded: true },
      create: {
        contentItemId: schedule.contentItemId!,
        postingScheduleId: schedule.id,
        uploadedManually: true,
        postUrlAdded: true
      }
    }).catch(async () => {
      await prisma.publishingChecklist.create({
        data: {
          contentItemId: schedule.contentItemId!,
          postingScheduleId: schedule.id,
          uploadedManually: true,
          postUrlAdded: true
        }
      });
    });

    await writeAuditLog({
      action: "MARK_POSTED",
      entityType: "PostingSchedule",
      entityId: schedule.id,
      message: "Schedule marked as posted from Publishing Center.",
      metadata: { postUrl: body.postUrl, postedAt: body.postedAt, contentItemId: schedule.contentItemId }
    });
    await createNotification({ title: "Content published", message: `${schedule.contentItem?.title ?? "Content"} ditandai published secara manual.`, type: "CONTENT_PUBLISHED", severity: "SUCCESS", source: "Publishing Center", actionUrl: "/publishing" });

    return apiSuccess("Publishing item marked as posted.", { schedule, analytics, job: result.job }, { schedule, analytics, job: result.job });
  } catch (error) {
    return apiError("Publishing item could not be marked as posted.", 500, error);
  }
}
