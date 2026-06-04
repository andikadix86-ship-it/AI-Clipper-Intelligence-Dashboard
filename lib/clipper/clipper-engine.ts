import { GeminiClientError } from "../providers/gemini-client";
import { requestStructuredText } from "../providers/structured-text";

export type ClipperInput = {
  sourceType: "upload" | "youtube_url" | "podcast_url" | "webinar_url";
  sourceTitle?: string;
  sourceUrl?: string;
  transcript?: string;
  duration?: string;
  platform: "youtube" | "tiktok" | "instagram" | "facebook";
  language: string;
  contentObjective: string;
  niche?: string;
};

export type ClipSegment = {
  segment_id: string;
  start_time: string;
  end_time: string;
  clip_title: string;
  hook_score: number;
  retention_score: number;
  platform_fit_score: number;
  reason: string;
  suggested_caption: string;
  suggested_cta: string;
  suggested_hashtags: string[];
  risk_notes: string[];
};

export type ClipPlan = {
  source_summary: string;
  best_segments: ClipSegment[];
  editing_direction: { pace: string; subtitle_style: string; broll_suggestions: string[]; cut_pattern: string; retention_tips: string[] };
  platform_metadata: { platform: string; title_options: string[]; caption: string; hashtags: string[]; description: string; cta: string };
  policy_check: { reused_content_risk: "low" | "medium" | "high"; copyright_reminder: string; originality_notes: string[]; ai_disclosure_recommended: boolean; platform_safety_notes: string[] };
  export_checklist: string[];
  next_actions: string[];
};

export type ClipPlanMeta = { provider: "gemini" | "dummy"; mode: "real" | "fallback"; error_reason?: string; generated_at: string };

type ClipperEngineOptions = {
  apiKey?: string;
  mode?: "REAL" | "DUMMY";
  timeoutMs?: number;
  fetchImpl?: (input: string, init?: RequestInit) => Promise<Response>;
};

export async function generateClipPlan(input: ClipperInput, options: ClipperEngineOptions = {}) {
  validateClipperInput(input);
  const fallback = buildDummyClipPlan(input);
  if (options.mode !== "REAL" || !options.apiKey) return { data: fallback, meta: fallbackMeta(options.mode === "REAL" ? "API_KEY_MISSING" : "DUMMY_MODE_REQUESTED") };
  try {
    return { data: normalizeClipPlan(await requestStructuredText<Partial<ClipPlan>>(clipperPrompt(input), options), input), meta: { provider: "gemini" as const, mode: "real" as const, generated_at: new Date().toISOString() } };
  } catch (error) {
    return { data: fallback, meta: fallbackMeta(error instanceof GeminiClientError ? error.code : "INVALID_RESPONSE") };
  }
}

export function validateClipperInput(input: Partial<ClipperInput>) {
  for (const field of ["sourceType", "platform", "language", "contentObjective"] as const) {
    if (!input[field]?.trim()) throw new ClipperValidationError(`${field} is required.`);
  }
}

export class ClipperValidationError extends Error {
  code = "VALIDATION_ERROR" as const;
}

export function buildDummyClipPlan(input: ClipperInput): ClipPlan {
  const subject = input.sourceTitle?.trim() || input.niche?.trim() || "long-form source";
  const cta = clipperPlatformCta(input.platform);
  const hashtags = clipperHashtags(input);
  const segment = (id: string, start: string, end: string, title: string, hook: number, retention: number, fit: number): ClipSegment => ({
    segment_id: id, start_time: start, end_time: end, clip_title: title, hook_score: hook, retention_score: retention, platform_fit_score: fit,
    reason: "Segment memiliki hook cepat, konteks mandiri, dan peluang retention yang baik.",
    suggested_caption: `${title}. Potong bagian paling relevan, pertahankan konteks, lalu arahkan audience ke langkah berikutnya.`,
    suggested_cta: cta, suggested_hashtags: hashtags, risk_notes: ["Pastikan hak penggunaan footage dan audio.", "Tambahkan framing atau insight original sebelum export."]
  });
  return {
    source_summary: `Analisis awal untuk ${subject}. ${input.transcript?.trim() ? "Transcript digunakan sebagai bahan utama segmentasi." : "Gunakan source title atau URL sebagai konteks awal sampai transcript tersedia."}`,
    best_segments: [segment("clip-01", "00:00:18", "00:00:48", `${subject}: insight utama`, 91, 86, 92), segment("clip-02", "00:02:10", "00:02:42", `Kesalahan umum pada ${subject}`, 87, 84, 89), segment("clip-03", "00:05:06", "00:05:38", `Langkah praktis ${subject}`, 84, 82, 88)],
    editing_direction: { pace: "Fast opening, controlled middle, decisive CTA ending.", subtitle_style: "Bold two-line subtitles with highlighted keywords.", broll_suggestions: ["Contextual close-up", "Screen recording", "Before-after proof"], cut_pattern: "Hook cut in first 2 seconds, pattern interrupt every 4-6 seconds.", retention_tips: ["Remove dead air.", "Show outcome early.", "Use subtitle emphasis sparingly."] },
    platform_metadata: { platform: input.platform, title_options: [`Insight penting dari ${subject}`, `Jangan lewatkan bagian ini: ${subject}`, `${subject} dalam kurang dari satu menit`], caption: `Cuplikan paling relevan dari ${subject}, diringkas agar mudah dipahami dan langsung bisa diterapkan.`, hashtags, description: `Optimized short clip untuk ${input.platform} dari ${subject}.`, cta },
    policy_check: { reused_content_risk: "medium", copyright_reminder: "Pastikan Anda memiliki izin untuk menggunakan sumber video, musik, dan visual.", originality_notes: ["Tambahkan narasi, framing, atau visual treatment original.", "Jangan mengunggah ulang clip tanpa transformasi bermakna."], ai_disclosure_recommended: true, platform_safety_notes: ["Review konteks agar potongan tidak menyesatkan.", "Hapus klaim yang tidak dapat diverifikasi."] },
    export_checklist: ["Review start dan end time.", "Tambahkan subtitle.", "Pastikan audio dan visual memiliki hak penggunaan.", "Review metadata dan CTA.", "Jalankan policy review sebelum export."],
    next_actions: ["Pilih segment prioritas.", "Edit clip draft.", "Tambahkan caption dan subtitle.", "Kirim untuk approval."]
  };
}

export function clipperPlatformCta(platform: ClipperInput["platform"]) {
  if (platform === "youtube") return "Like, subscribe, tulis komentar, lalu lanjutkan ke video berikutnya.";
  if (platform === "tiktok") return "Follow, like, simpan, dan tulis pendapatmu di komentar.";
  if (platform === "instagram") return "Simpan Reels ini, share, follow, lalu kirim DM atau komentar.";
  return "Bagikan Reels ini, tulis komentar, follow Page, dan hubungi WhatsApp jika relevan.";
}

function normalizeClipPlan(value: Partial<ClipPlan>, input: ClipperInput): ClipPlan {
  const fallback = buildDummyClipPlan(input);
  return {
    source_summary: text(value.source_summary, fallback.source_summary),
    best_segments: Array.isArray(value.best_segments) && value.best_segments.length ? value.best_segments.map((segment, index) => normalizeSegment(segment, fallback.best_segments[index] ?? fallback.best_segments[0], input)) : fallback.best_segments,
    editing_direction: { pace: text(value.editing_direction?.pace, fallback.editing_direction.pace), subtitle_style: text(value.editing_direction?.subtitle_style, fallback.editing_direction.subtitle_style), broll_suggestions: list(value.editing_direction?.broll_suggestions, fallback.editing_direction.broll_suggestions), cut_pattern: text(value.editing_direction?.cut_pattern, fallback.editing_direction.cut_pattern), retention_tips: list(value.editing_direction?.retention_tips, fallback.editing_direction.retention_tips) },
    platform_metadata: { platform: input.platform, title_options: list(value.platform_metadata?.title_options, fallback.platform_metadata.title_options), caption: text(value.platform_metadata?.caption, fallback.platform_metadata.caption), hashtags: list(value.platform_metadata?.hashtags, fallback.platform_metadata.hashtags), description: text(value.platform_metadata?.description, fallback.platform_metadata.description), cta: clipperPlatformCta(input.platform) },
    policy_check: { reused_content_risk: risk(value.policy_check?.reused_content_risk, "medium"), copyright_reminder: text(value.policy_check?.copyright_reminder, fallback.policy_check.copyright_reminder), originality_notes: list(value.policy_check?.originality_notes, fallback.policy_check.originality_notes), ai_disclosure_recommended: value.policy_check?.ai_disclosure_recommended ?? true, platform_safety_notes: list(value.policy_check?.platform_safety_notes, fallback.policy_check.platform_safety_notes) },
    export_checklist: list(value.export_checklist, fallback.export_checklist), next_actions: list(value.next_actions, fallback.next_actions)
  };
}

function normalizeSegment(value: Partial<ClipSegment>, fallback: ClipSegment, input: ClipperInput): ClipSegment {
  return { segment_id: text(value.segment_id, fallback.segment_id), start_time: text(value.start_time, fallback.start_time), end_time: text(value.end_time, fallback.end_time), clip_title: text(value.clip_title, fallback.clip_title), hook_score: score(value.hook_score, fallback.hook_score), retention_score: score(value.retention_score, fallback.retention_score), platform_fit_score: score(value.platform_fit_score, fallback.platform_fit_score), reason: text(value.reason, fallback.reason), suggested_caption: text(value.suggested_caption, fallback.suggested_caption), suggested_cta: clipperPlatformCta(input.platform), suggested_hashtags: list(value.suggested_hashtags, fallback.suggested_hashtags), risk_notes: list(value.risk_notes, fallback.risk_notes) };
}

function clipperPrompt(input: ClipperInput) {
  return `Return only valid JSON for a short clip plan. Required keys: source_summary, best_segments, editing_direction, platform_metadata, policy_check, export_checklist, next_actions. Use transcript as the primary source when present. Input: ${JSON.stringify(input)}`;
}

function clipperHashtags(input: ClipperInput) { return [`#${slug(input.niche || "Clipper")}`, `#${slug(input.platform)}`, "#FVNAIStudio", "#ShortVideo"]; }
function slug(value: string) { return value.replace(/[^a-z0-9]+/gi, "").slice(0, 28); }
function text(value: unknown, fallback: string) { return typeof value === "string" && value.trim() ? value.trim() : fallback; }
function list(value: unknown, fallback: string[]) { return Array.isArray(value) && value.some((entry) => typeof entry === "string" && entry.trim()) ? value.filter((entry): entry is string => typeof entry === "string" && Boolean(entry.trim())).map((entry) => entry.trim()) : fallback; }
function score(value: unknown, fallback: number) { return typeof value === "number" && Number.isFinite(value) ? Math.min(100, Math.max(0, Math.round(value))) : fallback; }
function risk(value: unknown, fallback: "low" | "medium" | "high") { return value === "low" || value === "medium" || value === "high" ? value : fallback; }
function fallbackMeta(errorReason: string): ClipPlanMeta { return { provider: "dummy", mode: "fallback", error_reason: errorReason, generated_at: new Date().toISOString() }; }
