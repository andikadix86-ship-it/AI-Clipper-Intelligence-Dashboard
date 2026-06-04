import { GeminiClientError } from "../providers/gemini-client";
import { requestStructuredText } from "../providers/structured-text";
import type { IntelligenceBrief } from "../intelligence/intelligence-engine";

export type ContentCreatorInput = {
  intelligenceBrief?: IntelligenceBrief;
  niche: string;
  platform: string;
  contentObjective: string;
  targetAudience: string;
  language: string;
  contentType: string;
  tone: string;
  duration: string;
};

export type ContentPackage = {
  title_options: string[];
  hook_options: string[];
  script: { opening: string; body: string[]; closing: string };
  scene_plan: Array<{ scene: number; visual_direction: string; narration: string; broll_idea: string; text_overlay: string }>;
  voice_over_direction: string;
  subtitle_style: string;
  caption: string;
  hashtags: string[];
  description: string;
  cta: string;
  platform_metadata: { platform: string; title: string; caption: string; hashtags: string[]; description: string; cta: string };
  policy_check: { risk_level: "low" | "medium" | "high"; notes: string[]; ai_disclosure_recommended: boolean; originality_notes: string[] };
  export_checklist: string[];
  next_actions: string[];
};

export type ContentPackageMeta = {
  provider: "gemini" | "dummy";
  mode: "real" | "fallback";
  error_reason?: string;
  generated_at: string;
};

type CreatorEngineOptions = {
  apiKey?: string;
  mode?: "REAL" | "DUMMY";
  timeoutMs?: number;
  fetchImpl?: (input: string, init?: RequestInit) => Promise<Response>;
};

export async function generateContentPackage(input: ContentCreatorInput, options: CreatorEngineOptions = {}) {
  validateContentCreatorInput(input);
  const fallback = buildDummyContentPackage(input);
  if (options.mode !== "REAL" || !options.apiKey) return { data: fallback, meta: fallbackMeta(options.mode === "REAL" ? "API_KEY_MISSING" : "DUMMY_MODE_REQUESTED") };
  try {
    const contentPackage = normalizeContentPackage(await requestStructuredText<Partial<ContentPackage>>(creatorPrompt(input), options), input);
    return { data: contentPackage, meta: { provider: "gemini" as const, mode: "real" as const, generated_at: new Date().toISOString() } };
  } catch (error) {
    return { data: fallback, meta: fallbackMeta(error instanceof GeminiClientError ? error.code : "INVALID_RESPONSE") };
  }
}

export function validateContentCreatorInput(input: Partial<ContentCreatorInput>) {
  for (const field of ["niche", "platform", "contentObjective", "targetAudience", "language", "contentType", "tone", "duration"] as const) {
    if (!input[field]?.trim()) throw new ContentCreatorValidationError(`${field} is required.`);
  }
}

export class ContentCreatorValidationError extends Error {
  code = "VALIDATION_ERROR" as const;
}

export function buildDummyContentPackage(input: ContentCreatorInput): ContentPackage {
  const topic = input.intelligenceBrief?.topic || input.contentObjective;
  const angle = input.intelligenceBrief?.recommended_angle || `Jelaskan ${topic} dengan pendekatan praktis dan relevan untuk ${input.targetAudience}.`;
  const cta = platformCta(input.platform, /affiliate|produk|product/i.test(`${input.niche} ${input.contentObjective}`));
  const riskLevel = policyRisk(`${input.niche} ${input.contentObjective} ${topic} ${angle}`);
  return normalizeContentPackage({
    title_options: [`Cara Praktis ${topic}`, `${topic}: Mulai dari Langkah Ini`, `Kesalahan Umum Saat Menerapkan ${topic}`],
    hook_options: input.intelligenceBrief?.hook_ideas ?? [`Jangan mulai ${topic} sebelum cek ini.`, `Tiga langkah yang membuat ${topic} lebih efektif.`, `Ini cara sederhana memperbaiki ${topic}.`],
    script: { opening: `Pernah merasa ${topic} terlalu rumit? Mulai dari satu langkah ini.`, body: [`Tentukan masalah utama ${input.targetAudience}.`, `Tampilkan proses ringkas dan bukti yang relevan.`, `Tutup dengan langkah kecil yang bisa langsung dicoba.`], closing: cta },
    scene_plan: [
      { scene: 1, visual_direction: "Close-up creator atau visual hasil utama.", narration: `Mulai dengan masalah utama ${topic}.`, broll_idea: "Before-after preview", text_overlay: "Mulai dari sini" },
      { scene: 2, visual_direction: "Screen recording atau langkah kerja singkat.", narration: angle, broll_idea: "Workflow steps", text_overlay: "3 langkah praktis" },
      { scene: 3, visual_direction: "Result shot dan CTA platform.", narration: cta, broll_idea: "Final result proof", text_overlay: "Simpan untuk dicoba" }
    ],
    voice_over_direction: `${input.tone} voice-over dalam ${input.language}; jelas, natural, dan tidak terburu-buru.`,
    subtitle_style: "Bold creator subtitles, maximum two lines, highlight keyword with FVN cyan accent.",
    caption: `${topic} tidak harus rumit. Mulai dari langkah paling relevan, ukur hasilnya, lalu iterasi.`,
    hashtags: hashtags(input.niche, topic),
    description: `Konten ${input.contentType} untuk ${input.targetAudience} dengan objective ${input.contentObjective}.`,
    cta,
    policy_check: policyGuardrail(riskLevel),
    export_checklist: ["Review script dan scene plan.", "Pastikan visual serta audio memiliki hak penggunaan.", "Tambahkan subtitle.", "Review CTA sesuai platform.", "Lakukan policy check sebelum export."],
    next_actions: ["Pilih satu judul dan hook.", "Generate asset visual atau clip.", "Review originality.", "Export draft untuk approval."]
  }, input);
}

export function platformCta(platform: string, affiliate = false) {
  const normalized = platform.toUpperCase();
  if (normalized.includes("YOUTUBE")) return "Like video ini, subscribe, tulis pendapatmu di komentar, lalu lanjutkan ke video berikutnya.";
  if (normalized.includes("TIKTOK")) return `Follow untuk tips berikutnya, like, simpan, dan tulis pertanyaanmu di komentar${affiliate ? ", lalu cek keranjang kuning untuk detail produk" : ""}.`;
  if (normalized.includes("INSTAGRAM")) return "Simpan Reels ini, share ke temanmu, follow untuk insight berikutnya, lalu kirim DM atau komentar jika butuh panduan.";
  if (normalized.includes("FACEBOOK")) return "Bagikan Reels ini, tulis komentar, follow Page, diskusikan di grup, dan hubungi WhatsApp jika membutuhkan informasi lanjutan.";
  return "Simpan konten ini dan lanjutkan ke langkah berikutnya.";
}

function normalizeContentPackage(value: Partial<ContentPackage>, input: ContentCreatorInput): ContentPackage {
  const fallback = value === undefined ? buildDummyContentPackage(input) : undefined;
  const cta = platformCta(input.platform, /affiliate|produk|product/i.test(`${input.niche} ${input.contentObjective}`));
  const riskLevel = policyRisk(`${input.niche} ${input.contentObjective} ${input.intelligenceBrief?.topic ?? ""} ${value.caption ?? ""}`);
  const hashtagsValue = list(value.hashtags, fallback?.hashtags ?? hashtags(input.niche, input.contentObjective));
  const caption = text(value.caption, fallback?.caption ?? `${input.contentObjective} untuk ${input.targetAudience}.`);
  const description = text(value.description, fallback?.description ?? `${input.contentType} content package.`);
  return {
    title_options: list(value.title_options, [`Cara Praktis ${input.contentObjective}`]),
    hook_options: list(value.hook_options, input.intelligenceBrief?.hook_ideas ?? [`Mulai ${input.contentObjective} dari langkah ini.`]),
    script: {
      opening: text(value.script?.opening, `Mulai ${input.contentObjective} dari masalah utama audience.`),
      body: list(value.script?.body, ["Jelaskan masalah.", "Tampilkan langkah praktis.", "Berikan bukti dan arah tindakan."]),
      closing: cta
    },
    scene_plan: scenes(value.scene_plan),
    voice_over_direction: text(value.voice_over_direction, `${input.tone} voice-over dalam ${input.language}.`),
    subtitle_style: text(value.subtitle_style, "Bold creator subtitle with highlighted keywords."),
    caption,
    hashtags: hashtagsValue,
    description,
    cta,
    platform_metadata: { platform: input.platform, title: list(value.title_options, [`Cara Praktis ${input.contentObjective}`])[0], caption, hashtags: hashtagsValue, description, cta },
    policy_check: policyGuardrail(riskLevel, value.policy_check),
    export_checklist: list(value.export_checklist, ["Review script", "Review policy", "Add subtitles", "Export draft"]),
    next_actions: list(value.next_actions, ["Pick title", "Generate assets", "Request approval"])
  };
}

function policyGuardrail(riskLevel: ContentPackage["policy_check"]["risk_level"], provided?: Partial<ContentPackage["policy_check"]>) {
  const notes = ["Check repetitive content risk.", "Avoid exaggerated claims.", "Review finance or health claims manually.", "Confirm platform safety before export."];
  return { risk_level: riskLevel, notes: list(provided?.notes, notes), ai_disclosure_recommended: provided?.ai_disclosure_recommended ?? true, originality_notes: list(provided?.originality_notes, ["Use original narration, examples, and visual treatment.", "Avoid reused-content patterns and duplicated captions."]) };
}

function policyRisk(value: string): ContentPackage["policy_check"]["risk_level"] {
  return /finance|health|medical|guarantee|profit pasti|copyright|reupload/i.test(value) ? "medium" : "low";
}

function creatorPrompt(input: ContentCreatorInput) {
  return `Return only valid JSON for a complete content package. Required keys: title_options, hook_options, script, scene_plan, voice_over_direction, subtitle_style, caption, hashtags, description, cta, platform_metadata, policy_check, export_checklist, next_actions. CTA must match ${input.platform}. Input: ${JSON.stringify(input)}`;
}

function scenes(value: unknown): ContentPackage["scene_plan"] {
  if (!Array.isArray(value) || !value.length) return [{ scene: 1, visual_direction: "Opening visual", narration: "Opening narration", broll_idea: "Relevant b-roll", text_overlay: "Main hook" }];
  return value.map((item, index) => {
    const scene = item as Partial<ContentPackage["scene_plan"][number]>;
    return { scene: typeof scene.scene === "number" ? scene.scene : index + 1, visual_direction: text(scene.visual_direction, "Relevant visual"), narration: text(scene.narration, "Narration"), broll_idea: text(scene.broll_idea, "Relevant b-roll"), text_overlay: text(scene.text_overlay, "Key point") };
  });
}

function hashtags(niche: string, topic: string) {
  return [`#${slug(niche)}`, `#${slug(topic)}`, "#FVNAIStudio", "#ContentCreator"];
}

function slug(value: string) {
  return value.replace(/[^a-z0-9]+/gi, "").slice(0, 28);
}

function text(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function list(value: unknown, fallback: string[]) {
  return Array.isArray(value) && value.some((entry) => typeof entry === "string" && entry.trim()) ? value.filter((entry): entry is string => typeof entry === "string" && Boolean(entry.trim())).map((entry) => entry.trim()) : fallback;
}

function fallbackMeta(errorReason: string): ContentPackageMeta {
  return { provider: "dummy", mode: "fallback", error_reason: errorReason, generated_at: new Date().toISOString() };
}
