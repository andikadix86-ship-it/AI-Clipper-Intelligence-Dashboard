import { contentTypeLabels, socialPlatformLabels } from "@/lib/content-library";
import type { SocialPlatform } from "@/lib/types";

export type SchedulerItemDto = {
  id: string;
  projectId?: string;
  project: string;
  contentItemId?: string;
  contentTitle: string;
  contentType: string;
  socialAccountId: string;
  socialAccount: string;
  platform: SocialPlatform;
  platformLabel: string;
  date: string;
  time: string;
  scheduledAt: string;
  timezone: string;
  videosPerDay: number;
  publishMode: "MANUAL" | "SEMI_AUTO" | "AUTO";
  status: "DRAFT" | "SCHEDULED" | "READY_TO_POST" | "PUBLISHING" | "POSTED" | "FAILED" | "CANCELED";
  notes: string;
  postUrl?: string;
  postedAt?: string;
  analyticsRecorded: boolean;
};

type ScheduleWithRelations = {
  id: string;
  projectId: string | null;
  project: { name: string } | null;
  contentItemId: string | null;
  contentItem: { title: string; type: keyof typeof contentTypeLabels } | null;
  socialAccountId: string;
  socialAccount: { name: string };
  socialPlatform: SocialPlatform | null;
  scheduledAt: Date | null;
  startDate: Date;
  postingTime: string;
  timezone: string;
  videosPerDay: number;
  publishMode: "MANUAL" | "SEMI_AUTO" | "AUTO";
  status: "DRAFT" | "SCHEDULED" | "READY_TO_POST" | "PUBLISHING" | "POSTED" | "FAILED" | "CANCELED";
  notes: string;
  analytics?: Array<{ postUrl: string; postedAt: Date | null; recordedAt: Date }>;
};

export function mapSchedule(schedule: ScheduleWithRelations): SchedulerItemDto {
  const scheduledAt = schedule.scheduledAt ?? schedule.startDate;
  const platform = schedule.socialPlatform ?? "YOUTUBE_SHORTS";
  return {
    id: schedule.id,
    projectId: schedule.projectId ?? undefined,
    project: schedule.project?.name ?? "Unassigned",
    contentItemId: schedule.contentItemId ?? undefined,
    contentTitle: schedule.contentItem?.title ?? "Untitled content",
    contentType: schedule.contentItem ? contentTypeLabels[schedule.contentItem.type] : "Content",
    socialAccountId: schedule.socialAccountId,
    socialAccount: schedule.socialAccount.name,
    platform,
    platformLabel: socialPlatformLabels[platform],
    date: scheduledAt.toISOString().slice(0, 10),
    time: schedule.postingTime,
    scheduledAt: scheduledAt.toISOString(),
    timezone: schedule.timezone,
    videosPerDay: schedule.videosPerDay,
    publishMode: schedule.publishMode,
    status: schedule.status,
    notes: schedule.notes,
    postUrl: schedule.analytics?.[0]?.postUrl || undefined,
    postedAt: schedule.analytics?.[0]?.postedAt?.toISOString(),
    analyticsRecorded: Boolean(schedule.analytics?.length)
  };
}
