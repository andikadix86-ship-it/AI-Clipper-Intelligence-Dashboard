import { GeminiClientError } from "../providers/gemini-client";
import { requestStructuredText } from "../providers/structured-text";

export type PublishingInput = {
  contentPackage?: object;
  clipPlan?: object;
  affiliatePlan?: object;
  platform: "youtube" | "tiktok" | "instagram" | "facebook" | "shopee";
  contentTitle: string;
  contentObjective: string;
  language: string;
  schedulePreference?: string;
  approvalRequired?: boolean;
};

export type PublishingPackage = {
  publishing_status: "draft" | "ready_for_review" | "approved" | "ready_to_export";
  platform: string;
  final_metadata: { title: string; caption: string; description: string; hashtags: string[]; cta: string };
  approval_flow: { required: boolean; status: "not_required" | "pending" | "approved" | "rejected"; reviewer: string; telegram_preview_message: string };
  export_package: { video_file_status: "missing" | "ready" | "not_applicable"; metadata_file_status: "ready"; thumbnail_status: "missing" | "ready" | "optional"; export_format: string[]; folder_suggestion: string };
  schedule_plan: { recommended_time: string; reason: string; timezone: string };
  platform_checklist: string[];
  policy_check: { risk_level: "low" | "medium" | "high"; notes: string[]; disclosure_recommended: boolean };
  next_actions: string[];
};

export type PublishingPackageMeta = { provider: "gemini" | "dummy"; mode: "real" | "fallback"; error_reason?: string; generated_at: string };
type PublishingEngineOptions = { apiKey?: string; mode?: "REAL" | "DUMMY"; timeoutMs?: number; fetchImpl?: (input: string, init?: RequestInit) => Promise<Response> };

export async function generatePublishingPackage(input: PublishingInput, options: PublishingEngineOptions = {}) {
  validatePublishingInput(input);
  const fallback = buildDummyPublishingPackage(input);
  if (options.mode !== "REAL" || !options.apiKey) return { data: fallback, meta: fallbackMeta(options.mode === "REAL" ? "API_KEY_MISSING" : "DUMMY_MODE_REQUESTED") };
  try {
    return { data: normalizePublishingPackage(await requestStructuredText<Partial<PublishingPackage>>(publishingPrompt(input), options), input), meta: { provider: "gemini" as const, mode: "real" as const, generated_at: new Date().toISOString() } };
  } catch (error) {
    return { data: fallback, meta: fallbackMeta(error instanceof GeminiClientError ? error.code : "INVALID_RESPONSE") };
  }
}

export function validatePublishingInput(input: Partial<PublishingInput>) {
  for (const field of ["platform", "contentTitle", "contentObjective", "language"] as const) if (!input[field]?.trim()) throw new PublishingValidationError(`${field} is required.`);
}
export class PublishingValidationError extends Error { code = "VALIDATION_ERROR" as const; }

export function buildDummyPublishingPackage(input: PublishingInput): PublishingPackage {
  const approval = input.approvalRequired ?? true;
  const cta = publishingPlatformCta(input.platform);
  const status = approval ? "ready_for_review" : "ready_to_export";
  return {
    publishing_status: status, platform: input.platform,
    final_metadata: { title: input.contentTitle, caption: `${input.contentTitle}. ${input.contentObjective}.`, description: `Konten ${input.language} yang disiapkan untuk export manual ke ${input.platform}.`, hashtags: [`#${slug(input.platform)}`, "#FVNAIStudio", "#ContentWorkflow"], cta },
    approval_flow: { required: approval, status: approval ? "pending" : "not_required", reviewer: approval ? "FVN Content Operator" : "Not required", telegram_preview_message: `Approval request: ${input.contentTitle} untuk ${input.platform}. Review metadata, CTA, dan policy check sebelum export.` },
    export_package: { video_file_status: "missing", metadata_file_status: "ready", thumbnail_status: input.platform === "youtube" ? "missing" : "optional", export_format: ["video.mp4", "metadata.json", "caption.txt", "checklist.md"], folder_suggestion: `exports/${slug(input.platform)}/${slug(input.contentTitle)}` },
    schedule_plan: { recommended_time: input.schedulePreference?.trim() || "19:00", reason: "Gunakan jam aktif audience dan review kembali setelah data performa tersedia.", timezone: "Asia/Jakarta" },
    platform_checklist: publishingChecklist(input.platform),
    policy_check: { risk_level: "low", notes: ["Pastikan footage dan audio memiliki hak penggunaan.", "Review klaim serta konteks sebelum export.", "Gunakan disclosure jika konten affiliate atau AI membutuhkannya."], disclosure_recommended: Boolean(input.affiliatePlan) },
    next_actions: approval ? ["Review metadata final.", "Kirim Telegram approval preview.", "Lengkapi video file.", "Export bundle setelah approval."] : ["Review metadata final.", "Lengkapi video file.", "Export bundle untuk posting manual."]
  };
}

export function publishingPlatformCta(platform: PublishingInput["platform"]) {
  if (platform === "youtube") return "Like, subscribe, tulis komentar, lalu cek video berikutnya.";
  if (platform === "tiktok") return "Follow, like, simpan, lalu tulis pertanyaanmu di komentar.";
  if (platform === "instagram") return "Simpan, share, follow, lalu kirim DM atau komentar.";
  if (platform === "facebook") return "Bagikan, tulis komentar, follow Page, dan hubungi WhatsApp jika relevan.";
  return "Cek voucher, tambah ke keranjang, follow toko, lalu checkout saat promo terverifikasi.";
}

function normalizePublishingPackage(value: Partial<PublishingPackage>, input: PublishingInput): PublishingPackage {
  const fallback = buildDummyPublishingPackage(input); const approval = input.approvalRequired ?? true;
  return { publishing_status: publishStatus(value.publishing_status, fallback.publishing_status), platform: input.platform, final_metadata: { title: text(value.final_metadata?.title, fallback.final_metadata.title), caption: text(value.final_metadata?.caption, fallback.final_metadata.caption), description: text(value.final_metadata?.description, fallback.final_metadata.description), hashtags: list(value.final_metadata?.hashtags, fallback.final_metadata.hashtags), cta: publishingPlatformCta(input.platform) }, approval_flow: { required: approval, status: approval ? approvalStatus(value.approval_flow?.status, "pending") : "not_required", reviewer: text(value.approval_flow?.reviewer, fallback.approval_flow.reviewer), telegram_preview_message: text(value.approval_flow?.telegram_preview_message, fallback.approval_flow.telegram_preview_message) }, export_package: { video_file_status: fileStatus(value.export_package?.video_file_status, fallback.export_package.video_file_status), metadata_file_status: "ready", thumbnail_status: thumbnailStatus(value.export_package?.thumbnail_status, fallback.export_package.thumbnail_status), export_format: list(value.export_package?.export_format, fallback.export_package.export_format), folder_suggestion: text(value.export_package?.folder_suggestion, fallback.export_package.folder_suggestion) }, schedule_plan: { recommended_time: text(value.schedule_plan?.recommended_time, fallback.schedule_plan.recommended_time), reason: text(value.schedule_plan?.reason, fallback.schedule_plan.reason), timezone: text(value.schedule_plan?.timezone, "Asia/Jakarta") }, platform_checklist: list(value.platform_checklist, fallback.platform_checklist), policy_check: { risk_level: risk(value.policy_check?.risk_level, "low"), notes: list(value.policy_check?.notes, fallback.policy_check.notes), disclosure_recommended: value.policy_check?.disclosure_recommended ?? fallback.policy_check.disclosure_recommended }, next_actions: list(value.next_actions, fallback.next_actions) };
}
function publishingChecklist(platform: PublishingInput["platform"]) { return ["Review metadata dan CTA.", "Pastikan policy check selesai.", "Export video dan metadata untuk posting manual.", ...(platform === "youtube" ? ["Siapkan thumbnail dan description."] : platform === "shopee" ? ["Verifikasi voucher dan promo."] : ["Review cover frame dan subtitle."])]; }
function publishingPrompt(input: PublishingInput) { return `Return only valid JSON for a manual export publishing package. Required keys: publishing_status, platform, final_metadata, approval_flow, export_package, schedule_plan, platform_checklist, policy_check, next_actions. MVP does not auto-post. Input: ${JSON.stringify(input)}`; }
function slug(value: string) { return value.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 48); }
function text(value: unknown, fallback: string) { return typeof value === "string" && value.trim() ? value.trim() : fallback; }
function list(value: unknown, fallback: string[]) { return Array.isArray(value) && value.some((item) => typeof item === "string" && item.trim()) ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).map((item) => item.trim()) : fallback; }
function risk(value: unknown, fallback: "low" | "medium" | "high") { return value === "low" || value === "medium" || value === "high" ? value : fallback; }
function publishStatus(value: unknown, fallback: PublishingPackage["publishing_status"]) { return value === "draft" || value === "ready_for_review" || value === "approved" || value === "ready_to_export" ? value : fallback; }
function approvalStatus(value: unknown, fallback: PublishingPackage["approval_flow"]["status"]) { return value === "not_required" || value === "pending" || value === "approved" || value === "rejected" ? value : fallback; }
function fileStatus(value: unknown, fallback: PublishingPackage["export_package"]["video_file_status"]) { return value === "missing" || value === "ready" || value === "not_applicable" ? value : fallback; }
function thumbnailStatus(value: unknown, fallback: PublishingPackage["export_package"]["thumbnail_status"]) { return value === "missing" || value === "ready" || value === "optional" ? value : fallback; }
function fallbackMeta(errorReason: string): PublishingPackageMeta { return { provider: "dummy", mode: "fallback", error_reason: errorReason, generated_at: new Date().toISOString() }; }
