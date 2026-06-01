import { writeAuditLog } from "@/lib/audit-log";
import { getTelegramSetting, saveTelegramSetting } from "@/lib/telegram-service";
import type { TelegramSettingDto } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  try {
    const telegram = await getTelegramSetting();
    return telegramResponse(true, "Telegram settings loaded.", telegram);
  } catch (error) {
    return telegramResponse(false, "Telegram settings could not be loaded. Dashboard approval remains available.", emptyTelegram(), error, 503);
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  try {
    const telegram = await saveTelegramSetting({ botToken: body.botToken, chatId: body.chatId });
    await writeAuditLog({
      action: "SAVE_TELEGRAM_SETTINGS",
      entityType: "TelegramSetting",
      entityId: telegram.id,
      message: "Telegram settings saved.",
      metadata: { hasBotToken: Boolean(body.botToken), hasChatId: Boolean(body.chatId) }
    });
    return telegramResponse(true, "Telegram settings saved.", telegram);
  } catch (error) {
    return telegramResponse(false, "Telegram settings could not be saved. Existing configuration remains unchanged.", emptyTelegram(), error, 503);
  }
}

function emptyTelegram(): TelegramSettingDto {
  return { botTokenMasked: "", chatId: "", status: "NOT_CONFIGURED", statusLabel: "Not configured" };
}

function telegramResponse(ok: boolean, message: string, telegram: TelegramSettingDto, error?: unknown, status = 200) {
  return Response.json({
    ok,
    success: ok,
    message,
    telegram,
    setting: telegram,
    ...(error ? { error: "Telegram settings storage is temporarily unavailable." } : {})
  }, { status });
}
