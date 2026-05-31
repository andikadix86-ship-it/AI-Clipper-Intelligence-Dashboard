import { apiError, apiSuccess } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/audit-log";
import { getTelegramSetting, saveTelegramSetting } from "@/lib/telegram-service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const setting = await getTelegramSetting();
    return apiSuccess("Telegram settings loaded.", { setting }, { setting });
  } catch (error) {
    return apiError("Telegram settings could not be loaded.", 500, error);
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  try {
    const setting = await saveTelegramSetting({ botToken: body.botToken, chatId: body.chatId });
    await writeAuditLog({
      action: "SAVE_TELEGRAM_SETTINGS",
      entityType: "TelegramSetting",
      entityId: setting.id,
      message: "Telegram settings saved.",
      metadata: { hasBotToken: Boolean(body.botToken), hasChatId: Boolean(body.chatId) }
    });
    return apiSuccess("Telegram settings saved.", { setting }, { setting });
  } catch (error) {
    return apiError("Telegram settings could not be saved.", 500, error);
  }
}
