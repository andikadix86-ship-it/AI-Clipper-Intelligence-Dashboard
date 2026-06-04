import { GeminiClientError } from "../providers/gemini-client";
import { requestStructuredText } from "../providers/structured-text";

export type IntelligenceBriefInput = {
  niche: string;
  platform: string;
  contentObjective: string;
  targetAudience: string;
  language: string;
  contentType: string;
  keyword?: string;
};

export type IntelligenceBrief = {
  topic: string;
  niche: string;
  platform: string;
  trend_score: number;
  opportunity_score: number;
  competition_level: "low" | "medium" | "high";
  audience_intent: string;
  recommended_angle: string;
  hook_ideas: string[];
  content_format: string;
  suggested_duration: string;
  caption_direction: string;
  cta_direction: string;
  policy_risk: "low" | "medium" | "high";
  policy_notes: string[];
  originality_notes: string[];
  knowledge_base_tags: string[];
  next_actions: string[];
};

export type IntelligenceBriefMeta = {
  provider: "gemini" | "dummy";
  mode: "real" | "fallback";
  error_reason?: string;
  generated_at: string;
};

type BriefEngineOptions = {
  apiKey?: string;
  mode?: "REAL" | "DUMMY";
  timeoutMs?: number;
  fetchImpl?: (input: string, init?: RequestInit) => Promise<Response>;
};

export async function generateIntelligenceBrief(input: IntelligenceBriefInput, options: BriefEngineOptions = {}) {
  validateBriefInput(input);
  const fallback = buildDummyIntelligenceBrief(input);
  if (options.mode !== "REAL" || !options.apiKey) {
    return { data: fallback, meta: fallbackMeta(options.mode === "REAL" ? "API_KEY_MISSING" : "DUMMY_MODE_REQUESTED") };
  }
  try {
    const brief = normalizeBrief(await requestStructuredText<Partial<IntelligenceBrief>>(briefPrompt(input), { ...options, timeoutMs: options.timeoutMs ?? 8000 }), input);
    return { data: brief, meta: { provider: "gemini" as const, mode: "real" as const, generated_at: new Date().toISOString() } };
  } catch (error) {
    return { data: fallback, meta: fallbackMeta(error instanceof GeminiClientError ? error.code : "INVALID_RESPONSE") };
  }
}

export function validateBriefInput(input: Partial<IntelligenceBriefInput>) {
  for (const field of ["niche", "platform", "contentObjective", "targetAudience", "language", "contentType"] as const) {
    if (!input[field]?.trim()) throw new IntelligenceBriefValidationError(`${field} is required.`);
  }
}

export class IntelligenceBriefValidationError extends Error {
  code = "VALIDATION_ERROR" as const;
}

export function buildDummyIntelligenceBrief(input: IntelligenceBriefInput): IntelligenceBrief {
  const keyword = input.keyword?.trim() || input.contentObjective.trim();
  const topic = `${keyword} untuk ${input.targetAudience}`;
  const policyRisk = /medical|finance|guarantee|copyright|reupload|before after/i.test(topic) ? "medium" : "low";
  return normalizeBrief({
    topic,
    niche: input.niche,
    platform: input.platform,
    trend_score: 76,
    opportunity_score: 82,
    competition_level: "medium",
    audience_intent: `Mencari ${input.contentObjective.toLowerCase()} yang praktis dan relevan.`,
    recommended_angle: `Mulai dengan masalah utama ${input.targetAudience}, tampilkan hasil, lalu jelaskan langkah yang dapat diterapkan.`,
    hook_ideas: [`Jangan mulai ${keyword} sebelum cek ini.`, `Tiga kesalahan yang membuat ${keyword} kurang efektif.`, `Cara sederhana meningkatkan ${keyword} tanpa workflow rumit.`],
    content_format: input.contentType,
    suggested_duration: input.platform.toLowerCase().includes("youtube") ? "35-55 seconds" : "20-40 seconds",
    caption_direction: `Gunakan caption ringkas dalam ${input.language} dengan satu manfaat utama, proof point, dan keyword ${keyword}.`,
    cta_direction: "Arahkan audience untuk menyimpan konten, mengikuti akun, dan mencoba langkah pertama.",
    policy_risk: policyRisk,
    policy_notes: policyRisk === "low" ? ["Hindari klaim absolut.", "Pastikan sumber visual dan audio aman digunakan."] : ["Perlu review manual untuk klaim sensitif.", "Tambahkan konteks dan disclosure bila diperlukan."],
    originality_notes: ["Gunakan contoh, voice-over, dan visual original.", "Tambahkan perspektif FVN agar konten tidak menyerupai reused content."],
    knowledge_base_tags: [],
    next_actions: ["Validasi trend signal.", "Buat script pendek.", "Review policy risk.", "Kirim ke Content Creator atau Clipper Center."]
  }, input);
}

function normalizeBrief(value: Partial<IntelligenceBrief>, input: IntelligenceBriefInput): IntelligenceBrief {
  const fallbackTags = knowledgeBaseTags(input, value.policy_risk ?? "low");
  return {
    topic: text(value.topic, input.keyword || input.contentObjective),
    niche: text(value.niche, input.niche),
    platform: text(value.platform, input.platform),
    trend_score: score(value.trend_score, 72),
    opportunity_score: score(value.opportunity_score, 78),
    competition_level: level(value.competition_level),
    audience_intent: text(value.audience_intent, input.targetAudience),
    recommended_angle: text(value.recommended_angle, `Create a practical ${input.contentObjective} angle.`),
    hook_ideas: list(value.hook_ideas, [`Cara praktis memulai ${input.contentObjective}.`]),
    content_format: text(value.content_format, input.contentType),
    suggested_duration: text(value.suggested_duration, "20-40 seconds"),
    caption_direction: text(value.caption_direction, "Use a concise benefit-led caption."),
    cta_direction: text(value.cta_direction, "Ask the audience to save and follow."),
    policy_risk: risk(value.policy_risk),
    policy_notes: list(value.policy_notes, ["Review claims and content rights."]),
    originality_notes: list(value.originality_notes, ["Use original framing and creator perspective."]),
    knowledge_base_tags: unique([...(value.knowledge_base_tags ?? []), ...fallbackTags]),
    next_actions: list(value.next_actions, ["Create script", "Review policy", "Send to workflow"])
  };
}

function briefPrompt(input: IntelligenceBriefInput) {
  return `Return only valid JSON for an intelligence brief. Required keys: topic, niche, platform, trend_score, opportunity_score, competition_level, audience_intent, recommended_angle, hook_ideas, content_format, suggested_duration, caption_direction, cta_direction, policy_risk, policy_notes, originality_notes, knowledge_base_tags, next_actions.\nInput: ${JSON.stringify(input)}`;
}

function knowledgeBaseTags(input: IntelligenceBriefInput, policyRisk: string) {
  return unique([`platform-algorithm:${input.platform}`, `niche:${input.niche}`, `content-archetype:${input.contentType}`, `policy:${policyRisk}`, input.keyword ? `keyword:${input.keyword}` : "objective-driven"]);
}

function text(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function list(value: unknown, fallback: string[]) {
  return Array.isArray(value) && value.some((entry) => typeof entry === "string" && entry.trim()) ? value.filter((entry): entry is string => typeof entry === "string" && Boolean(entry.trim())).map((entry) => entry.trim()) : fallback;
}

function score(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : fallback;
}

function level(value: unknown): IntelligenceBrief["competition_level"] {
  return value === "low" || value === "high" ? value : "medium";
}

function risk(value: unknown): IntelligenceBrief["policy_risk"] {
  return value === "medium" || value === "high" ? value : "low";
}

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.toLowerCase().replace(/\s+/g, "-")).filter(Boolean))];
}

function fallbackMeta(errorReason: string): IntelligenceBriefMeta {
  return { provider: "dummy", mode: "fallback", error_reason: errorReason, generated_at: new Date().toISOString() };
}
