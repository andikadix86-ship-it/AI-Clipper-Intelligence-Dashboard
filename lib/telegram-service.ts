import { prisma } from "@/lib/prisma";
import { transitionContentStatus } from "@/lib/approval-service";
import { writeAuditLog } from "@/lib/audit-log";
import { decodeSecret, encodeSecret, maskSecret } from "@/lib/security";
import type { TelegramApprovalLogDto, TelegramSettingDto } from "@/lib/types";

function maskToken(encrypted: string) {
  const token = decodeSecret(encrypted);
  if (!token) return "";
  return maskSecret(token);
}

export function mapTelegramSetting(setting: { id: string; botTokenEncrypted: string; chatId: string; status: "CONNECTED" | "NOT_CONNECTED" | "ERROR"; lastTestAt: Date | null }): TelegramSettingDto {
  return {
    id: setting.id,
    botTokenMasked: maskToken(setting.botTokenEncrypted),
    chatId: setting.chatId,
    status: setting.status === "NOT_CONNECTED" ? "NOT_CONFIGURED" : setting.status,
    statusLabel: setting.status === "CONNECTED" ? "Connected" : setting.status === "ERROR" ? "Error" : "Not configured",
    lastTestAt: setting.lastTestAt?.toISOString()
  };
}

export function mapTelegramLog(log: {
  id: string;
  contentItemId: string;
  action: "SENT_REVIEW" | "SENT_APPROVED" | "APPROVED" | "REJECTED" | "REVIEW" | "TEST";
  telegramMessageId: string | null;
  telegramChatId: string | null;
  status: "PENDING" | "SENT" | "FAILED" | "RESPONDED";
  responseBy: string | null;
  responseAt: Date | null;
  errorMessage: string | null;
  createdAt: Date;
}): TelegramApprovalLogDto {
  return {
    id: log.id,
    contentItemId: log.contentItemId,
    action: log.action,
    telegramMessageId: log.telegramMessageId ?? undefined,
    telegramChatId: log.telegramChatId ?? undefined,
    status: log.status,
    responseBy: log.responseBy ?? undefined,
    responseAt: log.responseAt?.toISOString(),
    errorMessage: log.errorMessage ?? undefined,
    createdAt: log.createdAt.toISOString()
  };
}

export async function getTelegramSetting() {
  const setting = await prisma.telegramSetting.findFirst({ orderBy: { updatedAt: "desc" } });
  if (setting) return mapTelegramSetting(setting);
  return {
    botTokenMasked: process.env.TELEGRAM_BOT_TOKEN ? maskSecret(process.env.TELEGRAM_BOT_TOKEN) : "",
    chatId: process.env.TELEGRAM_CHAT_ID ?? "",
    status: "NOT_CONFIGURED" as const,
    statusLabel: "Not configured"
  };
}

export async function saveTelegramSetting(input: { botToken?: string; chatId?: string }) {
  const current = await prisma.telegramSetting.findFirst({ orderBy: { updatedAt: "desc" } });
  const botTokenEncrypted = input.botToken?.trim() ? encodeSecret(input.botToken.trim()) : current?.botTokenEncrypted ?? "";
  const chatId = input.chatId?.trim() ?? current?.chatId ?? "";
  const status = "NOT_CONNECTED";

  const setting = current
    ? await prisma.telegramSetting.update({ where: { id: current.id }, data: { botTokenEncrypted, chatId, status } })
    : await prisma.telegramSetting.create({ data: { botTokenEncrypted, chatId, status } });

  return mapTelegramSetting(setting);
}

async function activeSetting() {
  const setting = await prisma.telegramSetting.findFirst({ orderBy: { updatedAt: "desc" } });
  const token = decodeSecret(setting?.botTokenEncrypted ?? "");
  if (!setting || !token || !setting.chatId) throw new Error("Telegram not connected. Save Bot Token and Chat ID first.");
  return { setting, token };
}

export async function testTelegramConnection() {
  const { setting, token } = await activeSetting();
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/getMe`, { method: "GET" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) throw new Error(data.description ?? "Telegram test failed.");
    const updated = await prisma.telegramSetting.update({ where: { id: setting.id }, data: { status: "CONNECTED", lastTestAt: new Date() } });
    return mapTelegramSetting(updated);
  } catch (error) {
    await prisma.telegramSetting.update({ where: { id: setting.id }, data: { status: "ERROR", lastTestAt: new Date() } });
    throw error;
  }
}

export async function sendTelegramApproval(contentItemId: string, action: "SENT_REVIEW" | "SENT_APPROVED" = "SENT_REVIEW") {
  const item = await prisma.contentItem.findUnique({ where: { id: contentItemId }, include: { project: true, creativeAsset: true } });
  if (!item) throw new Error("Content item not found.");

  const log = await prisma.telegramApprovalLog.create({
    data: { contentItemId, action, status: "PENDING" }
  });

  try {
    const { setting, token } = await activeSetting();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
    const dashboardUrl = appUrl?.startsWith("https://") ? `${appUrl}/library/${contentItemId}` : null;
    const tags = item.tags.length ? item.tags.map((tag) => `#${tag.replace(/^#/, "")}`).join(" ") : "-";
    const metadata = item.creativeAsset?.metadata && typeof item.creativeAsset.metadata === "object" && !Array.isArray(item.creativeAsset.metadata) ? item.creativeAsset.metadata as Record<string, unknown> : {};
    const text = [
      `Approval Request: ${item.title}`,
      `Project: ${item.project?.name ?? "Unassigned"}`,
      `Platform: ${item.platform ?? "Unassigned"}`,
      `Type: ${item.type}`,
      `Provider: ${item.creativeAsset?.provider ?? "Manual"}`,
      `Model: ${typeof metadata.model === "string" ? metadata.model : "Not applicable"}`,
      `Status: ${item.workflowStatus}`,
      `Caption: ${item.caption || "-"}`,
      `Hashtag: ${tags}`,
      item.thumbnail ? `Preview: ${item.thumbnail}` : ""
    ].filter(Boolean).join("\n\n");

    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: setting.chatId,
        text,
        reply_markup: {
          inline_keyboard: [
            [
              { text: "Approve", callback_data: `approve:${contentItemId}` },
              { text: "Reject", callback_data: `reject:${contentItemId}` },
              { text: "Send Back", callback_data: `review:${contentItemId}` }
            ],
            ...(dashboardUrl ? [[{ text: "Open Dashboard", url: dashboardUrl }]] : [])
          ]
        }
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) throw new Error(data.description ?? "Telegram send failed.");

    const updated = await prisma.telegramApprovalLog.update({
      where: { id: log.id },
      data: {
        status: "SENT",
        telegramChatId: String(setting.chatId),
        telegramMessageId: data.result?.message_id ? String(data.result.message_id) : undefined
      }
    });
    await prisma.contentItem.update({
      where: { id: contentItemId },
      data: {
        telegramChatId: String(setting.chatId),
        approvalMessageId: updated.telegramMessageId,
        approvalStatus: item.workflowStatus === "APPROVED" ? "APPROVED" : "PENDING"
      }
    });

    await prisma.approvalHistory.create({
      data: {
        contentItemId,
        fromStatus: item.workflowStatus,
        toStatus: item.workflowStatus,
        note: action === "SENT_APPROVED" ? "Approved status sent to Telegram." : "Sent to Telegram approval.",
        actionBy: "Telegram Bot"
      }
    });

    await writeAuditLog({
      action: "SEND_TELEGRAM_APPROVAL",
      entityType: "ContentItem",
      entityId: contentItemId,
      message: "Approval notification sent to Telegram.",
      metadata: { action, telegramChatId: setting.chatId, telegramMessageId: updated.telegramMessageId }
    });

    return mapTelegramLog(updated);
  } catch (error) {
    await prisma.approvalHistory.create({
      data: {
        contentItemId,
        fromStatus: item.workflowStatus,
        toStatus: item.workflowStatus,
        note: `Telegram approval failed: ${error instanceof Error ? error.message : "Telegram send failed."}`,
        actionBy: "Telegram Bot"
      }
    });
    const updated = await prisma.telegramApprovalLog.update({
      where: { id: log.id },
      data: { status: "FAILED", errorMessage: error instanceof Error ? error.message : "Telegram send failed." }
    });
    await writeAuditLog({
      action: "SEND_TELEGRAM_APPROVAL_FAILED",
      entityType: "ContentItem",
      entityId: contentItemId,
      message: error instanceof Error ? error.message : "Telegram send failed.",
      metadata: { action }
    });
    return mapTelegramLog(updated);
  }
}

export async function approveFromTelegram(contentItemId: string, responseBy = "Telegram Admin") {
  await transitionContentStatus(contentItemId, { toStatus: "APPROVED", note: "Approved via Telegram.", actionBy: responseBy });
  const log = await prisma.telegramApprovalLog.create({
    data: { contentItemId, action: "APPROVED", status: "RESPONDED", responseBy, responseAt: new Date() }
  });
  return mapTelegramLog(log);
}

export async function rejectFromTelegram(contentItemId: string, reason = "Rejected via Telegram.", responseBy = "Telegram Admin") {
  await transitionContentStatus(contentItemId, { toStatus: "REJECTED", note: reason, reason, actionBy: responseBy });
  const log = await prisma.telegramApprovalLog.create({
    data: { contentItemId, action: "REJECTED", status: "RESPONDED", responseBy, responseAt: new Date() }
  });
  return mapTelegramLog(log);
}

export async function reviewFromTelegram(contentItemId: string, responseBy = "Telegram Admin") {
  await transitionContentStatus(contentItemId, { toStatus: "REVIEW", note: "Sent back to review via Telegram.", actionBy: responseBy });
  const log = await prisma.telegramApprovalLog.create({
    data: { contentItemId, action: "REVIEW", status: "RESPONDED", responseBy, responseAt: new Date() }
  });
  return mapTelegramLog(log);
}
