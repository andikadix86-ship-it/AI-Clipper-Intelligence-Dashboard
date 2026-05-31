import { contentTypeLabels, socialPlatformLabels } from "@/lib/content-library";
import { demoPlaceholder } from "@/lib/demo-placeholder";
import type { SocialPlatform } from "@/lib/types";

type PublishingRow = {
  id: string;
  projectId: string | null;
  contentItemId: string | null;
  socialAccountId: string;
  socialPlatform: SocialPlatform | null;
  scheduledAt: Date | null;
  startDate: Date;
  postingTime: string;
  publishMode: "MANUAL" | "SEMI_AUTO" | "AUTO";
  status: "DRAFT" | "SCHEDULED" | "READY_TO_POST" | "PUBLISHING" | "POSTED" | "FAILED" | "CANCELED";
  notes: string;
  project: { name: string } | null;
  socialAccount: { name: string; uploadMode?: "MANUAL" | "SEMI_AUTO" | "AUTO"; authStatus?: string; platformAccountName?: string | null };
  contentItem: {
    id: string;
    title: string;
    description: string;
    caption: string;
    thumbnail: string;
    type: keyof typeof contentTypeLabels;
    workflowStatus: string;
    platform: SocialPlatform | null;
    tags: string[];
    generatedClip?: { outputFileUrl: string | null } | null;
    creativeAsset?: { previewUrl: string | null } | null;
  } | null;
  analytics?: Array<{ postUrl: string; postedAt: Date | null; views: number; engagementRate: number }>;
  publishingChecklists?: Array<{
    id: string;
    assetChecked: boolean;
    captionCopied: boolean;
    hashtagCopied: boolean;
    uploadedManually: boolean;
    postUrlAdded: boolean;
  }>;
  publishingJobs?: Array<{
    id: string;
    status: string;
    publishMode: string;
    providerJobId: string | null;
    platformPostId?: string | null;
    platformPostUrl?: string | null;
    postUrl: string;
    errorMessage: string | null;
  }>;
};

export function mapPublishingItem(row: PublishingRow) {
  const content = row.contentItem;
  const scheduledAt = row.scheduledAt ?? row.startDate;
  const platform = row.socialPlatform ?? content?.platform ?? "YOUTUBE_SHORTS";
  const analytics = row.analytics?.[0];
  const checklist = row.publishingChecklists?.[0];
  const publishingJob = row.publishingJobs?.[0];

  return {
    scheduleId: row.id,
    projectId: row.projectId ?? undefined,
    contentItemId: content?.id,
    socialAccountId: row.socialAccountId,
    title: content?.title ?? "Untitled content",
    description: content?.description ?? "",
    caption: content?.caption ?? "",
    hashtag: content?.tags.map((tag) => `#${tag}`).join(" ") ?? "",
    thumbnail: content?.thumbnail ?? demoPlaceholder("Publishing Asset"),
    project: row.project?.name ?? "Unassigned",
    socialAccount: row.socialAccount.name,
    socialAccountAuthStatus: row.socialAccount.authStatus ?? "NOT_CONNECTED",
    platformAccountName: row.socialAccount.platformAccountName ?? undefined,
    platform,
    platformLabel: socialPlatformLabels[platform],
    publishMode: publishingJob?.publishMode ?? row.publishMode ?? row.socialAccount.uploadMode ?? "MANUAL",
    publishingJobId: publishingJob?.id,
    publishingJobStatus: publishingJob?.status,
    providerJobId: publishingJob?.providerJobId ?? undefined,
    platformPostId: publishingJob?.platformPostId ?? undefined,
    platformPostUrl: publishingJob?.platformPostUrl ?? undefined,
    publishingError: publishingJob?.errorMessage ?? undefined,
    assetUrl: content?.generatedClip?.outputFileUrl ?? content?.creativeAsset?.previewUrl ?? content?.thumbnail ?? "",
    scheduledAt: scheduledAt.toISOString(),
    scheduledTime: `${scheduledAt.toISOString().slice(0, 10)} ${row.postingTime}`,
    status: row.status,
    contentStatus: content?.workflowStatus ?? "SCHEDULED",
    contentType: content ? contentTypeLabels[content.type] : "Content",
    postUrl: publishingJob?.postUrl || analytics?.postUrl || "",
    postedAt: analytics?.postedAt?.toISOString(),
    analyticsRecorded: Boolean(analytics && analytics.views > 0),
    checklist: checklist ?? {
      id: "",
      assetChecked: false,
      captionCopied: false,
      hashtagCopied: false,
      uploadedManually: false,
      postUrlAdded: Boolean(analytics?.postUrl)
    }
  };
}
