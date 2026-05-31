import { apiError, apiSuccess } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/audit-log";
import { ensurePublishingJob } from "@/lib/publishing-job-service";
import { prisma } from "@/lib/prisma";
import { publishYouTubeNow } from "@/lib/youtube-publishing-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!body.postingScheduleId) return apiError("postingScheduleId is required.", 400);
  try {
    await writeAuditLog({
      action: "PUBLISHING_ATTEMPT",
      entityType: "PostingSchedule",
      entityId: body.postingScheduleId,
      message: "Admin started YouTube publish attempt.",
      metadata: { provider: "YOUTUBE", privacyStatus: body.privacyStatus }
    });
    const result = await publishYouTubeNow({
      postingScheduleId: body.postingScheduleId,
      privacyStatus: body.privacyStatus,
      madeForKids: body.madeForKids,
      notifySubscribers: body.notifySubscribers
    });
    return result.ok
      ? apiSuccess("YouTube publish completed.", result, result)
      : apiError(result.errorMessage ?? "YouTube publish failed.", 400, result.errorMessage, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "YouTube publish failed.";
    if (body.postingScheduleId) {
      const job = await ensurePublishingJob(body.postingScheduleId, "AUTO").catch(() => null);
      if (job) {
        await prisma.publishingJob.update({
          where: { id: job.id },
          data: { status: "FAILED", errorMessage: message, retryCount: { increment: 1 }, publishCompletedAt: new Date(), completedAt: new Date() }
        }).catch(() => undefined);
        await prisma.postingSchedule.update({ where: { id: body.postingScheduleId }, data: { status: "FAILED" } }).catch(() => undefined);
        await prisma.publishingLog.create({ data: { publishingJobId: job.id, level: "ERROR", message } }).catch(() => undefined);
      }
    }
    await writeAuditLog({
      action: "PUBLISHING_ATTEMPT_FAILED",
      entityType: "PostingSchedule",
      entityId: body.postingScheduleId,
      message,
      metadata: { provider: "YOUTUBE" }
    });
    return apiError("YouTube publish failed.", 400, message);
  }
}
