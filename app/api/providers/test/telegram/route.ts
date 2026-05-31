import { apiError, apiSuccess } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/audit-log";
import { testTelegramConnection } from "@/lib/telegram-service";

export const runtime = "nodejs";

export async function POST() {
  try {
    const setting = await testTelegramConnection();
    await writeAuditLog({
      action: "PROVIDER_TEST_TELEGRAM",
      entityType: "TelegramSetting",
      entityId: setting.id,
      message: "Telegram provider test succeeded.",
      metadata: { status: setting.status }
    });
    const result = {
      provider: "Telegram Bot",
      status: "READY",
      mode: "REAL",
      message: "Telegram test message endpoint is reachable.",
      lastTestAt: setting.lastTestAt ?? new Date().toISOString()
    };
    return apiSuccess(result.message, { result, setting }, { result, setting });
  } catch (error) {
    await writeAuditLog({
      action: "PROVIDER_TEST_TELEGRAM_FAILED",
      entityType: "TelegramSetting",
      message: error instanceof Error ? error.message : "Telegram provider test failed."
    });
    const result = {
      provider: "Telegram Bot",
      status: "NOT_CONFIGURED",
      mode: "DUMMY",
      message: "Telegram is not connected. Dashboard approval remains available.",
      errorMessage: error instanceof Error ? error.message : "Telegram provider test failed.",
      lastTestAt: new Date().toISOString()
    };
    return apiSuccess(result.message, { result }, { result });
  }
}
