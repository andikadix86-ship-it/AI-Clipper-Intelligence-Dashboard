import { upsertPerformance } from "@/lib/analytics-service";
import { getPublishingProvider } from "@/lib/publishing";
import { prisma } from "@/lib/prisma";
import type { PublishMode } from "@/lib/types";

export async function ensurePublishingJob(postingScheduleId: string, requestedMode?: PublishMode) {
  const schedule = await prisma.postingSchedule.findUnique({
    where: { id: postingScheduleId },
    include: { contentItem: true, socialAccount: true }
  });
  if (!schedule?.contentItemId || !schedule.contentItem) throw new Error("Schedule has no content item.");

  const publishMode = requestedMode ?? schedule.publishMode ?? schedule.socialAccount.uploadMode ?? "MANUAL";
  const safeMode = publishMode === "AUTO" && schedule.socialAccount.authStatus !== "CONNECTED" ? "MANUAL" : publishMode;
  const platform = schedule.socialPlatform ?? schedule.contentItem.platform ?? "YOUTUBE_SHORTS";

  const job = await prisma.publishingJob.upsert({
    where: { id: (await prisma.publishingJob.findFirst({ where: { postingScheduleId } }))?.id ?? "__new__" },
    update: { publishMode: safeMode, platform, status: "READY_TO_POST", errorMessage: null },
    create: {
      postingScheduleId,
      contentItemId: schedule.contentItemId,
      socialAccountId: schedule.socialAccountId,
      platform,
      publishMode: safeMode,
      status: "READY_TO_POST"
    }
  }).catch(async () => prisma.publishingJob.create({
    data: {
      postingScheduleId,
      contentItemId: schedule.contentItemId!,
      socialAccountId: schedule.socialAccountId,
      platform,
      publishMode: safeMode,
      status: "READY_TO_POST"
    }
  }));

  await prisma.publishingLog.create({
    data: {
      publishingJobId: job.id,
      level: safeMode === publishMode ? "INFO" : "WARN",
      message: safeMode === publishMode ? "Publishing job ready." : "Auto mode requested but account is not connected. Fallback to manual."
    }
  });

  return job;
}

export async function startPublishing(postingScheduleId: string, requestedMode?: PublishMode) {
  const job = await ensurePublishingJob(postingScheduleId, requestedMode);
  const loaded = await prisma.publishingJob.findUnique({
    where: { id: job.id },
    include: { contentItem: true, socialAccount: true, postingSchedule: true }
  });
  if (!loaded) throw new Error("Publishing job not found.");

  const provider = getPublishingProvider(loaded.platform);
  const result = await provider.publishPost({
    title: loaded.contentItem.title,
    description: loaded.contentItem.description,
    caption: loaded.contentItem.caption,
    assetUrl: loaded.contentItem.thumbnail,
    platform: loaded.platform,
    publishMode: loaded.publishMode,
    account: {
      id: loaded.socialAccount.id,
      name: loaded.socialAccount.name,
      authStatus: loaded.socialAccount.authStatus,
      uploadMode: loaded.socialAccount.uploadMode
    }
  });

  const nextStatus = loaded.publishMode === "AUTO" && loaded.socialAccount.authStatus === "CONNECTED" ? result.status : "READY_TO_POST";
  const updated = await prisma.publishingJob.update({
    where: { id: loaded.id },
    data: {
      status: nextStatus,
      providerJobId: result.providerJobId,
      errorMessage: result.errorMessage ?? result.warning,
      startedAt: nextStatus === "PUBLISHING" ? new Date() : loaded.startedAt
    }
  });

  await prisma.postingSchedule.update({
    where: { id: loaded.postingScheduleId },
    data: { status: nextStatus === "PUBLISHING" ? "PUBLISHING" : "READY_TO_POST", publishMode: updated.publishMode }
  });

  await prisma.publishingLog.create({
    data: {
      publishingJobId: loaded.id,
      level: result.errorMessage ? "ERROR" : result.warning ? "WARN" : "INFO",
      message: result.errorMessage ?? result.warning ?? "Publishing provider started."
    }
  });

  return updated;
}

export async function cancelPublishing(postingScheduleId: string) {
  const job = await ensurePublishingJob(postingScheduleId);
  const updated = await prisma.publishingJob.update({ where: { id: job.id }, data: { status: "CANCELED", completedAt: new Date() } });
  await prisma.postingSchedule.update({ where: { id: postingScheduleId }, data: { status: "CANCELED" } });
  await prisma.publishingLog.create({ data: { publishingJobId: job.id, level: "WARN", message: "Publishing job canceled by admin." } });
  return updated;
}

export async function markPublishingPosted(input: { postingScheduleId: string; postUrl: string; postedAt?: string; notes?: string }) {
  const job = await ensurePublishingJob(input.postingScheduleId);
  const schedule = await prisma.postingSchedule.update({
    where: { id: input.postingScheduleId },
    data: { status: "POSTED", notes: input.notes },
    include: { contentItem: true }
  });
  if (!schedule.contentItemId) throw new Error("Schedule has no content item.");

  await prisma.contentItem.update({
    where: { id: schedule.contentItemId },
    data: { status: "POSTED", workflowStatus: "POSTED", publishedAt: input.postedAt ? new Date(input.postedAt) : new Date(), failureReason: "" }
  });
  const updatedJob = await prisma.publishingJob.update({
    where: { id: job.id },
    data: { status: "POSTED", postUrl: input.postUrl, completedAt: new Date(), errorMessage: null }
  });
  await prisma.publishingLog.create({ data: { publishingJobId: job.id, level: "INFO", message: "Publishing job marked as posted." } });

  const analytics = await upsertPerformance({
    projectId: schedule.projectId ?? undefined,
    contentItemId: schedule.contentItemId,
    socialAccountId: schedule.socialAccountId,
    postingScheduleId: schedule.id,
    platform: schedule.socialPlatform ?? "YOUTUBE_SHORTS",
    postUrl: input.postUrl,
    views: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    saves: 0,
    watchTime: 0,
    averageViewDuration: 0,
    followersGained: 0,
    postedAt: input.postedAt,
    notes: input.notes
  });

  return { schedule, job: updatedJob, analytics };
}
