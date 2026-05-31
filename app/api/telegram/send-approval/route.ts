import { apiError, apiSuccess } from "@/lib/api-response";
import { sendTelegramApproval } from "@/lib/telegram-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!body.contentItemId) return apiError("contentItemId is required.", 400);

  try {
    const log = await sendTelegramApproval(body.contentItemId, body.action === "SENT_APPROVED" ? "SENT_APPROVED" : "SENT_REVIEW");
    return apiSuccess("Telegram approval request processed.", { log }, { log, warning: log.status === "FAILED" ? log.errorMessage : undefined });
  } catch (error) {
    return apiError("Telegram approval could not be sent.", 500, error);
  }
}
