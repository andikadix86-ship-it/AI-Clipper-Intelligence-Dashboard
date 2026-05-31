import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit-log";
import type { ContentStatus } from "@/lib/types";

type ApprovalInput = {
  toStatus: ContentStatus;
  note?: string;
  reason?: string;
  actionBy?: string;
};

export async function transitionContentStatus(contentItemId: string, input: ApprovalInput) {
  const current = await prisma.contentItem.findUnique({ where: { id: contentItemId } });
  if (!current) throw new Error("Content item not found.");

  const actionBy = input.actionBy || "Admin";
  const approved = input.toStatus === "APPROVED";
  const rejected = input.toStatus === "REJECTED";
  const failed = input.toStatus === "FAILED";

  const updated = await prisma.$transaction(async (tx) => {
    const item = await tx.contentItem.update({
      where: { id: contentItemId },
      data: {
        status: input.toStatus,
        workflowStatus: input.toStatus,
        reviewNotes: input.note ?? current.reviewNotes,
        rejectReason: rejected ? input.reason ?? "" : input.toStatus === "REVIEW" ? "" : current.rejectReason,
        reviewer: input.toStatus === "REVIEW" || approved || rejected ? actionBy : current.reviewer,
        approvedAt: approved ? new Date() : current.approvedAt,
        approvedBy: approved ? actionBy : current.approvedBy,
        approvalStatus: approved ? "APPROVED" : rejected ? "REJECTED" : input.toStatus === "REVIEW" ? "PENDING" : current.approvalStatus,
        failureReason: failed ? input.reason ?? input.note ?? "Content workflow failed." : input.toStatus === "REVIEW" ? "" : current.failureReason
      }
    });

    await tx.approvalHistory.create({
      data: {
        contentItemId,
        fromStatus: current.workflowStatus,
        toStatus: input.toStatus,
        note: input.note ?? "",
        reason: input.reason ?? "",
        actionBy
      }
    });

    return item;
  });

  await writeAuditLog({
    action: `CONTENT_STATUS_${input.toStatus}`,
    entityType: "ContentItem",
    entityId: contentItemId,
    message: `Content status changed from ${current.workflowStatus} to ${input.toStatus}.`,
    metadata: { fromStatus: current.workflowStatus, toStatus: input.toStatus, actionBy, reason: input.reason, note: input.note }
  });

  return updated;
}
