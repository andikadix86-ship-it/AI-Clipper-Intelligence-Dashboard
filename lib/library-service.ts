import type { Prisma } from "@prisma/client";
import { assetStatusLabels, contentStatusLabels, contentTypeLabels, socialPlatformLabels } from "@/lib/content-library";
import { prisma } from "@/lib/prisma";
import type { ContentStatus, ContentType, LibraryAssetStatus, LibraryItemDto, SocialPlatform } from "@/lib/types";

type ContentWithRelations = {
  id: string;
  type: ContentType;
  title: string;
  description: string;
  caption: string;
  thumbnail: string;
  status: ContentStatus;
  workflowStatus: ContentStatus;
  reviewNotes: string;
  rejectReason: string;
  reviewer: string | null;
  approvedAt: Date | null;
  approvedBy: string | null;
  scheduledAt: Date | null;
  publishedAt: Date | null;
  failureReason: string;
  telegramChatId: string | null;
  approvalMessageId: string | null;
  approvalStatus: string;
  sourceType?: string;
  linkedFromContentId?: string | null;
  parentAssetId?: string | null;
  assetStatus?: LibraryAssetStatus;
  versionNumber?: number;
  isLatestVersion?: boolean;
  versionNotes?: string;
  archivedAt?: Date | null;
  trashedAt?: Date | null;
  viralScorePrediction?: number | null;
  contentAngle?: string;
  trendKeyword?: string;
  trendPlatform?: SocialPlatform | null;
  fypScore?: number | null;
  hook?: string;
  cta?: string;
  targetAudience?: string;
  editingStyle?: string;
  suggestedDuration?: number | null;
  notes?: string;
  platform: SocialPlatform | null;
  tags: string[];
  createdAt: Date;
  projectId: string | null;
  project: { name: string } | null;
  socialAccountId: string | null;
  socialAccount: { name: string } | null;
  creativeAsset?: {
    provider: string | null;
    metadata: Prisma.JsonValue | null;
  } | null;
  schedules: Array<{
    id?: string;
    socialAccountId: string;
    status: string;
    scheduledAt?: Date | null;
    socialPlatform?: SocialPlatform | null;
    socialAccount: { name: string };
  }>;
  analytics?: Array<{
    postUrl: string;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    watchTime: number;
    averageViewDuration: number;
    followersGained: number;
    engagementRate: number;
    postedAt: Date | null;
    recordedAt: Date;
  }>;
  approvalHistory?: Array<{
    id: string;
    fromStatus: ContentStatus;
    toStatus: ContentStatus;
    note: string;
    reason: string;
    actionBy: string;
    createdAt: Date;
  }>;
  versions?: Array<{
    id: string;
    title: string;
    versionNumber: number;
    isLatestVersion: boolean;
    versionNotes: string;
    assetStatus: LibraryAssetStatus;
    createdAt: Date;
  }>;
  parentAsset?: {
    id: string;
    title: string;
    versionNumber: number;
    isLatestVersion: boolean;
    versionNotes: string;
    assetStatus: LibraryAssetStatus;
    createdAt: Date;
  } | null;
  collectionItems?: Array<{
    collection: {
      id: string;
      name: string;
    };
  }>;
  agentRecommendations?: Array<{
    id: string;
    agentId: string;
    agent: { name: string };
    projectId: string | null;
    contentItemId: string | null;
    title: string;
    description: string;
    recommendationType: string;
    priority: "HIGH" | "MEDIUM" | "LOW";
    score: number;
    status: string;
    createdAt: Date;
  }>;
  telegramApprovalLogs?: Array<{
    id: string;
    contentItemId: string;
    action: "SENT_REVIEW" | "SENT_APPROVED" | "APPROVED" | "REJECTED" | "REVIEW" | "TEST";
    telegramMessageId: string | null;
    telegramChatId: string | null;
    status: "PENDING" | "SENT" | "FAILED" | "RESPONDED";
    responseBy: string | null;
    responseAt: Date | null;
    errorMessage: string | null;
    createdAt: Date;
  }>;
};

export function mapContentItem(item: ContentWithRelations): LibraryItemDto {
  const schedules = item.schedules ?? [];
  const tags = item.tags ?? [];
  const schedule = schedules[0];
  const analytics = item.analytics?.[0];
  const generationMetadata =
    item.creativeAsset?.metadata && typeof item.creativeAsset.metadata === "object" && !Array.isArray(item.creativeAsset.metadata)
      ? item.creativeAsset.metadata as Prisma.JsonObject
      : {};
  const isDummyGeneration = typeof generationMetadata.isDummy === "boolean" ? generationMetadata.isDummy : undefined;
  const rawGenerationWarning = typeof generationMetadata.providerWarning === "string"
    ? generationMetadata.providerWarning
    : typeof generationMetadata.errorMessage === "string"
      ? generationMetadata.errorMessage
      : undefined;
  const generationWarning = normalizeGenerationWarning(rawGenerationWarning);
  const generationMode = generationMetadata.providerMode === "REAL" || generationMetadata.outputSource === "provider"
    ? "REAL"
    : isDummyGeneration === true
      ? "DUMMY"
      : undefined;
  return {
    id: item.id,
    type: item.type,
    typeLabel: contentTypeLabels[item.type],
    title: item.title,
    description: item.description,
    caption: item.caption,
    thumbnail: item.thumbnail,
    status: item.status,
    statusLabel: contentStatusLabels[item.status],
    workflowStatus: item.workflowStatus,
    workflowStatusLabel: contentStatusLabels[item.workflowStatus],
    reviewNotes: item.reviewNotes,
    rejectReason: item.rejectReason,
    reviewer: item.reviewer ?? undefined,
    approvedAt: item.approvedAt?.toISOString(),
    approvedBy: item.approvedBy ?? undefined,
    scheduledAt: item.scheduledAt?.toISOString(),
    publishedAt: item.publishedAt?.toISOString(),
    failureReason: item.failureReason,
    telegramChatId: item.telegramChatId ?? undefined,
    approvalMessageId: item.approvalMessageId ?? undefined,
    approvalStatus: item.approvalStatus,
    sourceType: item.sourceType,
    linkedFromContentId: item.linkedFromContentId ?? undefined,
    parentAssetId: item.parentAssetId ?? undefined,
    assetStatus: item.assetStatus ?? "ACTIVE",
    assetStatusLabel: assetStatusLabels[item.assetStatus ?? "ACTIVE"],
    versionNumber: item.versionNumber ?? 1,
    isLatestVersion: item.isLatestVersion ?? true,
    versionNotes: item.versionNotes ?? "",
    archivedAt: item.archivedAt?.toISOString(),
    trashedAt: item.trashedAt?.toISOString(),
    viralScorePrediction: item.viralScorePrediction ?? undefined,
    contentAngle: item.contentAngle,
    trendKeyword: item.trendKeyword,
    trendPlatform: item.trendPlatform ?? undefined,
    fypScore: item.fypScore ?? undefined,
    hook: item.hook,
    cta: item.cta,
    targetAudience: item.targetAudience,
    editingStyle: item.editingStyle,
    suggestedDuration: item.suggestedDuration ?? undefined,
    notes: item.notes,
    postUrl: analytics?.postUrl || undefined,
    scheduleStatus: schedule?.status,
    analyticsStatus: analytics ? "Recorded" : "Pending",
    performanceSummary: analytics
      ? {
          views: analytics.views,
          likes: analytics.likes,
          comments: analytics.comments,
          shares: analytics.shares,
          saves: analytics.saves,
          watchTime: analytics.watchTime,
          averageViewDuration: analytics.averageViewDuration,
          followersGained: analytics.followersGained,
          engagementRate: analytics.engagementRate,
          postedAt: analytics.postedAt?.toISOString(),
          recordedAt: analytics.recordedAt.toISOString()
        }
      : undefined,
    platform: item.platform ?? undefined,
    platformLabel: item.platform ? socialPlatformLabels[item.platform] : "Unassigned",
    projectId: item.projectId ?? undefined,
    project: item.project?.name ?? "Unassigned",
    socialAccountId: item.socialAccountId ?? schedule?.socialAccountId,
    socialAccount: item.socialAccount?.name ?? schedule?.socialAccount.name ?? "Unassigned",
    tags,
    date: item.createdAt.toISOString().slice(0, 10),
    meta: `${contentTypeLabels[item.type]} - ${contentStatusLabels[item.workflowStatus]}`,
    approvalHistory: item.approvalHistory?.map((history) => ({
      id: history.id,
      fromStatus: history.fromStatus,
      toStatus: history.toStatus,
      note: history.note,
      reason: history.reason,
      actionBy: history.actionBy,
      createdAt: history.createdAt.toISOString()
    })),
    versionHistory: [
      ...(item.parentAsset ? [item.parentAsset] : []),
      ...(item.versions ?? [])
    ]
      .filter((version, index, versions) => versions.findIndex((candidate) => candidate.id === version.id) === index)
      .sort((a, b) => a.versionNumber - b.versionNumber)
      .map((version) => ({
        id: version.id,
        title: version.title,
        versionNumber: version.versionNumber,
        isLatestVersion: version.isLatestVersion,
        versionNotes: version.versionNotes,
        assetStatus: version.assetStatus,
        createdAt: version.createdAt.toISOString()
      })),
    publishingHistory: schedules.map((schedule) => ({
      id: schedule.id ?? "",
      status: schedule.status,
      platform: schedule.socialPlatform ? socialPlatformLabels[schedule.socialPlatform] : "Unassigned",
      scheduledAt: schedule.scheduledAt?.toISOString(),
      socialAccount: schedule.socialAccount.name
    })),
    collections: item.collectionItems?.map((entry) => ({
      id: entry.collection.id,
      name: entry.collection.name
    })),
    agentRecommendations: item.agentRecommendations?.map((recommendation) => ({
      id: recommendation.id,
      agentId: recommendation.agentId,
      agentName: recommendation.agent.name,
      projectId: recommendation.projectId ?? undefined,
      contentItemId: recommendation.contentItemId ?? undefined,
      title: recommendation.title,
      description: recommendation.description,
      recommendationType: recommendation.recommendationType,
      priority: recommendation.priority,
      score: recommendation.score,
      status: recommendation.status,
      createdAt: recommendation.createdAt.toISOString()
    })),
    telegramApprovalLogs: item.telegramApprovalLogs?.map((log) => ({
      id: log.id,
      contentItemId: log.contentItemId,
      action: log.action,
      telegramMessageId: log.telegramMessageId ?? undefined,
      telegramChatId: log.telegramChatId ?? undefined,
      status: log.status,
      responseBy: log.responseBy ?? undefined,
      responseAt: log.responseAt?.toISOString(),
      errorMessage: log.errorMessage ?? undefined,
      createdAt: log.createdAt.toISOString()
    })),
    generationProvider: item.creativeAsset?.provider as LibraryItemDto["generationProvider"] | undefined,
    generationModel: typeof generationMetadata.model === "string" ? generationMetadata.model : undefined,
    generationMode,
    generationType: typeof generationMetadata.generationType === "string"
      ? generationMetadata.generationType as LibraryItemDto["generationType"]
      : undefined,
    generationOutputSource:
      generationMetadata.outputSource === "provider" || generationMetadata.outputSource === "dummy"
        ? generationMetadata.outputSource
        : undefined,
    generationStatus:
      isDummyGeneration && generationMetadata.status === "READY"
        ? rawGenerationWarning
          ? "DUMMY_FALLBACK"
          : "DUMMY_PREVIEW"
        : typeof generationMetadata.status === "string"
          ? generationMetadata.status
          : undefined,
    originalPrompt: typeof generationMetadata.originalPrompt === "string" ? generationMetadata.originalPrompt : undefined,
    finalPrompt: typeof generationMetadata.finalPrompt === "string" ? generationMetadata.finalPrompt : undefined,
    isDummyGeneration,
    generationWarning,
    isDemoData: item.sourceType === "DEMO_SAMPLE"
  };
}

function normalizeGenerationWarning(warning?: string) {
  if (!warning) return undefined;
  const normalized = warning.toLowerCase();
  if (normalized.includes("gemini") && (normalized.includes("timeout") || normalized.includes("timed out") || normalized.includes("unavailable"))) {
    return "Gemini API timeout. Provider belum stabil.";
  }
  if (normalized.includes("openai") && (normalized.includes("quota") || normalized.includes("billing") || normalized.includes("rate-limit") || normalized.includes("rate limit"))) {
    return "OpenAI quota/billing error. Provider belum tersedia.";
  }
  if (normalized.includes("api key") || normalized.includes("401") || normalized.includes("403")) {
    return "Provider NOT CONNECTED. API key or permission is invalid.";
  }
  if (normalized.includes("not implemented")) {
    return warning;
  }
  return warning.length > 240 ? `${warning.slice(0, 237)}...` : warning;
}

export async function ensureLibrarySeed() {
  return;
}

export async function getLibraryItems() {
  const items = await prisma.contentItem.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      project: true,
      socialAccount: true,
      schedules: { include: { socialAccount: true }, orderBy: { createdAt: "desc" } },
      analytics: { orderBy: { recordedAt: "desc" }, take: 1 },
      approvalHistory: { orderBy: { createdAt: "desc" } },
      versions: { orderBy: { versionNumber: "asc" } },
      parentAsset: true,
      collectionItems: { include: { collection: true } },
      agentRecommendations: { include: { agent: true }, orderBy: { createdAt: "desc" }, take: 3 },
      telegramApprovalLogs: { orderBy: { createdAt: "desc" }, take: 3 },
      creativeAsset: true
    }
  });
  return items.map((item) => mapContentItem(item as ContentWithRelations));
}

export async function getLibraryItem(id: string) {
  const item = await prisma.contentItem.findUnique({
    where: { id },
    include: {
      project: true,
      socialAccount: true,
      schedules: { include: { socialAccount: true }, orderBy: { createdAt: "desc" } },
      analytics: { orderBy: { recordedAt: "desc" }, take: 1 },
      approvalHistory: { orderBy: { createdAt: "desc" } },
      versions: { orderBy: { versionNumber: "asc" } },
      parentAsset: true,
      collectionItems: { include: { collection: true } },
      agentRecommendations: { include: { agent: true }, orderBy: { createdAt: "desc" }, take: 8 },
      telegramApprovalLogs: { orderBy: { createdAt: "desc" }, take: 12 },
      creativeAsset: true
    }
  });
  return item ? mapContentItem(item as ContentWithRelations) : null;
}
