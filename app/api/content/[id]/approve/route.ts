import { apiError, apiSuccess } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/audit-log";
import { transitionContentStatus } from "@/lib/approval-service";
import { getLibraryItem } from "@/lib/library-service";
import { sendTelegramApproval } from "@/lib/telegram-service";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json().catch(() => ({}));
  try {
    await transitionContentStatus(params.id, { toStatus: "APPROVED", note: body.note, actionBy: body.actionBy });
    const telegram = await sendTelegramApproval(params.id, "SENT_APPROVED").catch((telegramError) => ({
      status: "FAILED",
      errorMessage: telegramError instanceof Error ? telegramError.message : "Telegram approval failed."
    }));
    const item = await getLibraryItem(params.id);
    await writeAuditLog({
      action: "APPROVE_CONTENT",
      entityType: "ContentItem",
      entityId: params.id,
      message: `Content approved by ${body.actionBy || "Admin"}.`,
      metadata: { telegramStatus: telegram.status, note: body.note }
    });
    return apiSuccess("Content approved.", { item, telegram }, { item, telegram, warning: telegram.status === "FAILED" ? telegram.errorMessage : undefined });
  } catch (error) {
    return apiError("Content could not be approved.", 500, error);
  }
}
