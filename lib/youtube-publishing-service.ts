import { uploadYouTubeShort } from "@/lib/publishing/youtube";
import { writeAuditLog } from "@/lib/audit-log";
import { ensurePublishingJob } from "@/lib/publishing-job-service";
import { prisma } from "@/lib/prisma";

type YouTubePublishInput = {
  postingScheduleId: string;
  privacyStatus?: "public" | "private" | "unlisted";
  madeForKids?: boolean;
  notifySubscribers?: boolean;
};

export async function publishYouTubeNow(input: YouTubePublishInput) {
  const schedule = await prisma.postingSchedule.findUnique({
    where: { id: input.postingScheduleId },
    include: {
      contentItem: { include: { generatedClip: true, creativeAsset: true } },
      socialAccount: true
    }
  });
  if (!schedule) throw new Error("Schedule not found.");
  if (!schedule.contentItem) throw new Error("Schedule has no content item.");
  if (schedule.socialPlatform !== "YOUTUBE_SHORTS") throw new Error("Only YouTube Shorts schedules can use YouTube upload.");
  if (schedule.socialAccount.socialPlatform !== "YOUTUBE_SHORTS") throw new Error("Social account must be YouTube Shorts.");
  if (schedule.socialAccount.authStatus !== "CONNECTED") throw new Error("YouTube account is not connected. Reconnect OAuth first.");
  if (!schedule.socialAccount.refreshTokenEncrypted) throw new Error("Refresh token missing. Reconnect YouTube.");
  if (!["APPROVED", "SCHEDULED"].includes(schedule.contentItem.workflowStatus)) throw new Error("Content must be Approved before publishing.");
  if (!["READY_TO_POST", "SCHEDULED"].includes(schedule.status)) throw new Error("Schedule must be READY_TO_POST or SCHEDULED before publishing.");

  const videoFileUrl = schedule.contentItem.generatedClip?.outputFileUrl ?? schedule.contentItem.creativeAsset?.previewUrl ?? "";
  if (!videoFileUrl) throw new Error("Video/output file is not available. Generate or attach a video asset first.");

  const job = await ensurePublishingJob(schedule.id, "AUTO");
  await prisma.postingSchedule.update({ where: { id: schedule.id }, data: { status: "PUBLISHING", publishMode: "AUTO" } });
  await prisma.publishingJob.update({
    where: { id: job.id },
    data: { status: "PUBLISHING", publishMode: "AUTO", publishStartedAt: new Date(), startedAt: new Date(), errorMessage: null }
  });
  await prisma.publishingLog.create({ data: { publishingJobId: job.id, level: "INFO", message: "Admin confirmed Publish Now for YouTube Shorts." } });
  await writeAuditLog({
    action: "PUBLISHING_ATTEMPT",
    entityType: "PublishingJob",
    entityId: job.id,
    message: "YouTube Shorts publish attempt started.",
    metadata: { postingScheduleId: schedule.id, contentItemId: schedule.contentItemId, socialAccountId: schedule.socialAccountId }
  });

  const result = await uploadYouTubeShort({
    videoFileUrl,
    socialAccountId: schedule.socialAccountId,
    contentItemId: schedule.contentItemId ?? undefined,
    scheduleId: schedule.id,
    title: schedule.contentItem.title,
    description: schedule.contentItem.description,
    caption: schedule.contentItem.caption,
    tags: schedule.contentItem.tags,
    privacyStatus: input.privacyStatus ?? "private",
    madeForKids: Boolean(input.madeForKids),
    notifySubscribers: Boolean(input.notifySubscribers),
    assetUrl: videoFileUrl,
    platform: "YOUTUBE_SHORTS",
    publishMode: "AUTO",
    account: {
      id: schedule.socialAccount.id,
      name: schedule.socialAccount.name,
      authStatus: schedule.socialAccount.authStatus,
      uploadMode: schedule.socialAccount.uploadMode
    }
  });

  if (!result.ok) {
    const updated = await prisma.publishingJob.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        errorMessage: result.errorMessage ?? "YouTube upload failed.",
        retryCount: { increment: 1 },
        publishCompletedAt: new Date(),
        completedAt: new Date()
      }
    });
    await prisma.postingSchedule.update({ where: { id: schedule.id }, data: { status: "FAILED" } });
    await prisma.contentItem.update({
      where: { id: schedule.contentItem.id },
      data: { status: "FAILED", workflowStatus: "FAILED", failureReason: result.errorMessage ?? "YouTube upload failed." }
    });
    await prisma.publishingLog.create({ data: { publishingJobId: job.id, level: "ERROR", message: result.errorMessage ?? "YouTube upload failed." } });
    await writeAuditLog({
      action: "PUBLISHING_ATTEMPT_FAILED",
      entityType: "PublishingJob",
      entityId: job.id,
      message: result.errorMessage ?? "YouTube upload failed.",
      metadata: { postingScheduleId: schedule.id, provider: "YOUTUBE" }
    });
    return { ok: false, job: updated, errorMessage: result.errorMessage };
  }

  const postUrl = result.postUrl ?? `https://www.youtube.com/shorts/${result.providerJobId}`;
  const updated = await prisma.publishingJob.update({
    where: { id: job.id },
    data: {
      status: "POSTED",
      providerJobId: result.providerJobId,
      platformPostId: result.providerJobId,
      platformPostUrl: postUrl,
      postUrl,
      publishCompletedAt: new Date(),
      completedAt: new Date(),
      errorMessage: null
    }
  });
  await prisma.postingSchedule.update({ where: { id: schedule.id }, data: { status: "POSTED" } });
  await prisma.contentItem.update({
    where: { id: schedule.contentItem.id },
    data: { status: "POSTED", workflowStatus: "POSTED", publishedAt: new Date(), failureReason: "" }
  });
  await prisma.publishingLog.create({ data: { publishingJobId: job.id, level: "INFO", message: `YouTube Shorts published: ${postUrl}` } });
  await writeAuditLog({
    action: "PUBLISHING_ATTEMPT_SUCCEEDED",
    entityType: "PublishingJob",
    entityId: job.id,
    message: "YouTube Shorts publish completed.",
    metadata: { postingScheduleId: schedule.id, contentItemId: schedule.contentItemId, platformPostId: result.providerJobId, platformPostUrl: postUrl }
  });
  return { ok: true, job: updated, postUrl };
}
