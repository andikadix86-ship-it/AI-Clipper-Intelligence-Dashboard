import { randomUUID } from "node:crypto";
import { serverLogger } from "../server-logger";

export type TelegramApproval = { approval_id: string; content_title: string; platform: string; status: "pending" | "approved" | "rejected"; requested_at: string; approved_at?: string; reviewer: string; notes: string; mode: "telegram" | "dummy"; preview_message: string };
export type TelegramApprovalInput = { contentTitle: string; platform: string; objective: string; riskLevel: "low" | "medium" | "high"; metadataSummary: string; reviewer?: string };
type ApprovalOptions = { botToken?: string; chatId?: string; fetchImpl?: typeof fetch };
const approvals = new Map<string, TelegramApproval>();

export async function requestTelegramApproval(input: TelegramApprovalInput, options: ApprovalOptions = {}) {
  const approvalId = `approval_${randomUUID()}`, now = new Date().toISOString(), preview = telegramPreviewMessage(input);
  const base: TelegramApproval = { approval_id: approvalId, content_title: input.contentTitle, platform: input.platform, status: "pending", requested_at: now, reviewer: input.reviewer || "FVN Content Operator", notes: "Waiting for approval.", mode: "dummy", preview_message: preview };
  const botToken = options.botToken ?? process.env.TELEGRAM_BOT_TOKEN, chatId = options.chatId ?? process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) { approvals.set(approvalId, base); return { approval: base, fallback: true as const, reason: "TELEGRAM_NOT_CONFIGURED" }; }
  try {
    const response = await (options.fetchImpl ?? fetch)(`https://api.telegram.org/bot${botToken}/sendMessage`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: chatId, text: preview, reply_markup: { inline_keyboard: [[{ text: "Approve", callback_data: `approve:${approvalId}` }, { text: "Reject", callback_data: `reject:${approvalId}` }]] } }) });
    const payload = await response.json().catch(() => ({})) as { ok?: boolean; description?: string };
    if (!response.ok || payload.ok === false) throw new Error(payload.description || "Telegram approval send failed.");
    const approval = { ...base, mode: "telegram" as const, notes: "Telegram approval request sent." }; approvals.set(approvalId, approval); return { approval, fallback: false as const };
  } catch (error) { serverLogger.warn("telegram_approval.send.fallback", { approvalId, platform: input.platform }, error); approvals.set(approvalId, base); return { approval: base, fallback: true as const, reason: "TELEGRAM_OFFLINE" }; }
}
export function updateTelegramApproval(approvalId: string, status: "approved" | "rejected", reviewer = "FVN Content Operator", notes = "") { const current = approvals.get(approvalId); if (!current) throw new Error("Approval request not found."); const approval = { ...current, status, reviewer, notes: notes || (status === "approved" ? "Approved for manual export." : "Rejected. Revision required."), ...(status === "approved" ? { approved_at: new Date().toISOString() } : {}) }; approvals.set(approvalId, approval); return approval; }
export function listTelegramApprovals() { return [...approvals.values()].sort((a, b) => b.requested_at.localeCompare(a.requested_at)); }
export function telegramPreviewMessage(input: TelegramApprovalInput) { return [`Title: ${input.contentTitle}`, `Platform: ${input.platform}`, `Objective: ${input.objective}`, `Risk Level: ${input.riskLevel}`, `Metadata Summary: ${input.metadataSummary}`, "", "Approve", "Reject"].join("\n"); }
