type TelegramDatabaseSetting = {
  botTokenEncrypted?: string | null;
  chatId?: string | null;
} | null;

export function resolveTelegramEnvironmentConfig(setting?: TelegramDatabaseSetting) {
  const databaseToken = decode(setting?.botTokenEncrypted);
  const token = databaseToken || process.env.TELEGRAM_BOT_TOKEN || "";
  const chatId = setting?.chatId || process.env.TELEGRAM_CHAT_ID || "";
  return {
    token,
    chatId,
    configured: Boolean(token && chatId),
    source: databaseToken && setting?.chatId ? "database" as const : token && chatId ? "env" as const : "none" as const
  };
}

function decode(value?: string | null) {
  if (!value) return "";
  try {
    return Buffer.from(value, "base64").toString("utf8");
  } catch {
    return "";
  }
}

