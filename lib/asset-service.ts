import { prisma } from "@/lib/prisma";
import type { ContentStatus, LibraryAssetStatus } from "@/lib/types";

export async function setAssetStatus(id: string, assetStatus: LibraryAssetStatus) {
  return prisma.contentItem.update({
    where: { id },
    data: {
      assetStatus,
      archivedAt: assetStatus === "ARCHIVED" ? new Date() : assetStatus === "ACTIVE" ? null : undefined,
      trashedAt: assetStatus === "TRASHED" ? new Date() : assetStatus === "ACTIVE" ? null : undefined
    }
  });
}

export async function duplicateContentItem(id: string, titleSuffix = "Copy") {
  const source = await prisma.contentItem.findUnique({ where: { id } });
  if (!source) throw new Error("Content item not found.");

  return prisma.contentItem.create({
    data: {
      projectId: source.projectId,
      socialAccountId: source.socialAccountId,
      creativeAssetId: source.creativeAssetId,
      generatedClipId: source.generatedClipId,
      type: source.type,
      title: `${source.title} ${titleSuffix}`,
      description: source.description,
      caption: source.caption,
      thumbnail: source.thumbnail,
      status: "DRAFT",
      workflowStatus: "DRAFT",
      reviewNotes: "",
      rejectReason: "",
      sourceType: source.sourceType || "DUPLICATE",
      linkedFromContentId: source.id,
      parentAssetId: source.parentAssetId ?? source.id,
      assetStatus: "ACTIVE",
      versionNumber: 1,
      isLatestVersion: true,
      versionNotes: `Duplicated from ${source.title}`,
      viralScorePrediction: source.viralScorePrediction,
      contentAngle: source.contentAngle,
      trendKeyword: source.trendKeyword,
      trendPlatform: source.trendPlatform,
      fypScore: source.fypScore,
      hook: source.hook,
      cta: source.cta,
      targetAudience: source.targetAudience,
      editingStyle: source.editingStyle,
      suggestedDuration: source.suggestedDuration,
      notes: source.notes,
      platform: source.platform,
      tags: source.tags
    }
  });
}

export async function createAssetVersion(id: string, versionNotes = "") {
  const source = await prisma.contentItem.findUnique({
    where: { id },
    include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } }
  });
  if (!source) throw new Error("Content item not found.");

  const rootId = source.parentAssetId ?? source.id;
  const latestVersion = source.versions[0]?.versionNumber ?? source.versionNumber;

  await prisma.contentItem.updateMany({
    where: { OR: [{ id: rootId }, { parentAssetId: rootId }] },
    data: { isLatestVersion: false }
  });

  return prisma.contentItem.create({
    data: {
      projectId: source.projectId,
      socialAccountId: source.socialAccountId,
      creativeAssetId: source.creativeAssetId,
      generatedClipId: source.generatedClipId,
      type: source.type,
      title: `${source.title} v${latestVersion + 1}`,
      description: source.description,
      caption: source.caption,
      thumbnail: source.thumbnail,
      status: "DRAFT",
      workflowStatus: "DRAFT",
      reviewNotes: "",
      rejectReason: "",
      sourceType: source.sourceType || "VERSION",
      linkedFromContentId: source.linkedFromContentId,
      parentAssetId: rootId,
      assetStatus: "ACTIVE",
      versionNumber: latestVersion + 1,
      isLatestVersion: true,
      versionNotes: versionNotes || `New version from ${source.title}`,
      viralScorePrediction: source.viralScorePrediction,
      contentAngle: source.contentAngle,
      trendKeyword: source.trendKeyword,
      trendPlatform: source.trendPlatform,
      fypScore: source.fypScore,
      hook: source.hook,
      cta: source.cta,
      targetAudience: source.targetAudience,
      editingStyle: source.editingStyle,
      suggestedDuration: source.suggestedDuration,
      notes: source.notes,
      platform: source.platform,
      tags: source.tags
    }
  });
}

export async function bulkUpdateAssets(input: {
  ids: string[];
  action: "ARCHIVE" | "TRASH" | "RESTORE" | "DELETE" | "CHANGE_STATUS" | "ASSIGN_PROJECT" | "SEND_TO_SCHEDULER";
  workflowStatus?: ContentStatus;
  projectId?: string;
}) {
  if (!input.ids.length) throw new Error("Select at least one asset.");

  if (input.action === "DELETE") {
    return prisma.contentItem.deleteMany({ where: { id: { in: input.ids } } });
  }

  if (input.action === "CHANGE_STATUS") {
    if (!input.workflowStatus) throw new Error("Workflow status is required.");
    return prisma.contentItem.updateMany({
      where: { id: { in: input.ids } },
      data: { status: input.workflowStatus, workflowStatus: input.workflowStatus }
    });
  }

  if (input.action === "ASSIGN_PROJECT") {
    if (!input.projectId) throw new Error("Project is required.");
    return prisma.contentItem.updateMany({
      where: { id: { in: input.ids } },
      data: { projectId: input.projectId }
    });
  }

  if (input.action === "SEND_TO_SCHEDULER") {
    return prisma.contentItem.updateMany({
      where: { id: { in: input.ids }, workflowStatus: "APPROVED" },
      data: { status: "SCHEDULED", workflowStatus: "SCHEDULED" }
    });
  }

  const assetStatus = input.action === "ARCHIVE" ? "ARCHIVED" : input.action === "TRASH" ? "TRASHED" : "ACTIVE";
  return prisma.contentItem.updateMany({
    where: { id: { in: input.ids } },
    data: {
      assetStatus,
      archivedAt: assetStatus === "ARCHIVED" ? new Date() : assetStatus === "ACTIVE" ? null : undefined,
      trashedAt: assetStatus === "TRASHED" ? new Date() : assetStatus === "ACTIVE" ? null : undefined
    }
  });
}
