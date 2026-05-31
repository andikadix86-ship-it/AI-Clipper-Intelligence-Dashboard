import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { withTimeout } from "@/lib/db-timeout";
import { sanitizeMetadata } from "@/lib/security";

type AuditInput = {
  action: string;
  entityType: string;
  entityId?: string | null;
  message: string;
  metadata?: unknown;
};

export async function writeAuditLog(input: AuditInput) {
  try {
    await withTimeout(
      prisma.auditLog.create({
        data: {
          action: input.action,
          entityType: input.entityType,
          entityId: input.entityId ?? undefined,
          message: input.message,
          metadata: input.metadata === undefined ? undefined : (sanitizeMetadata(input.metadata) as Prisma.InputJsonValue)
        }
      }),
      2500
    );
  } catch {
    // Audit logging must never block the primary workflow.
  }
}
