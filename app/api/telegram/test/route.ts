import { apiError, apiSuccess } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/audit-log";
import { testTelegramConnection } from "@/lib/telegram-service";

export const runtime = "nodejs";

export async function POST() {
  try {
    const setting = await testTelegramConnection();
    await writeAuditLog({
      action: "TELEGRAM_TEST",
      entityType: "TelegramSetting",
      entityId: setting.id,
      message: "Telegram connection tested.",
      metadata: { status: setting.status }
    });
    return apiSuccess("Telegram connection tested.", { setting }, { setting });
  } catch (error) {
    return apiSuccess(
      "Telegram is not connected. Dashboard approval remains available.",
      {
        setting: {
          botTokenMasked: "",
          chatId: "",
          status: "NOT_CONNECTED",
          statusLabel: "Not configured",
          errorMessage: error instanceof Error ? error.message : "Telegram test failed."
        }
      },
      {
        setting: {
          botTokenMasked: "",
          chatId: "",
          status: "NOT_CONNECTED",
          statusLabel: "Not configured",
          errorMessage: error instanceof Error ? error.message : "Telegram test failed."
        }
      }
    );
  }
}
