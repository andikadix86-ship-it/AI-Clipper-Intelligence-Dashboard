import { GeminiClientError } from "../providers/gemini-client";
import { requestStructuredText } from "../providers/structured-text";

export type AffiliateInput = {
  campaignId?: string;
  productId?: string;
  dataMode?: "DEMO DATA" | "MANUAL DATA" | "CSV IMPORT" | "REAL API";
  isDemo?: boolean;
  productName?: string;
  productCategory: string;
  platform: "tiktok" | "youtube" | "instagram" | "facebook" | "shopee";
  targetAudience: string;
  priceRange?: string;
  commissionRate?: string;
  contentObjective: string;
  language: string;
  affiliateAccounts?: Array<{ platform: string; handle: string; role: string }>;
};

export type AffiliatePlan = {
  product_research: { product_name: string; category: string; target_audience: string; main_problem_solved: string; buying_triggers: string[]; objections: string[]; competitor_angle: string[] };
  product_score: { demand_score: number; competition_score: number; commission_score: number; content_potential_score: number; overall_score: number; recommendation: "avoid" | "test" | "promote" | "scale" };
  content_strategy: { recommended_angle: string; soft_selling_hooks: string[]; content_formats: string[]; video_ideas: string[]; trust_builder_points: string[] };
  affiliate_cta: { platform: string; cta_options: string[]; disclosure_note: string };
  account_recommendation: string[];
  campaign_plan: Array<{ day: number; content_idea: string; hook: string; format: string; goal: string }>;
  risk_check: { exaggerated_claim_risk: "low" | "medium" | "high"; policy_notes: string[]; disclosure_recommended: boolean; prohibited_claim_warning: string[] };
  next_actions: string[];
};

export type AffiliatePlanMeta = { provider: "gemini" | "dummy"; mode: "real" | "fallback"; error_reason?: string; generated_at: string };

type AffiliateEngineOptions = {
  apiKey?: string;
  mode?: "REAL" | "DUMMY";
  timeoutMs?: number;
  fetchImpl?: (input: string, init?: RequestInit) => Promise<Response>;
};

export async function generateAffiliatePlan(input: AffiliateInput, options: AffiliateEngineOptions = {}) {
  validateAffiliateInput(input);
  const fallback = buildDummyAffiliatePlan(input);
  if (options.mode !== "REAL" || !options.apiKey) return { data: fallback, meta: fallbackMeta(options.mode === "REAL" ? "API_KEY_MISSING" : "DUMMY_MODE_REQUESTED") };
  try {
    return { data: normalizeAffiliatePlan(await requestStructuredText<Partial<AffiliatePlan>>(affiliatePrompt(input), options), input), meta: { provider: "gemini" as const, mode: "real" as const, generated_at: new Date().toISOString() } };
  } catch (error) {
    return { data: fallback, meta: fallbackMeta(error instanceof GeminiClientError ? error.code : "INVALID_RESPONSE") };
  }
}

export function validateAffiliateInput(input: Partial<AffiliateInput>) {
  for (const field of ["productCategory", "platform", "targetAudience", "contentObjective", "language"] as const) {
    if (!input[field]?.trim()) throw new AffiliateValidationError(`${field} is required.`);
  }
}

export class AffiliateValidationError extends Error {
  code = "VALIDATION_ERROR" as const;
}

export function buildDummyAffiliatePlan(input: AffiliateInput): AffiliatePlan {
  const product = input.productName?.trim() || `Produk ${input.productCategory}`;
  const cta = affiliatePlatformCtas(input.platform);
  return {
    product_research: { product_name: product, category: input.productCategory, target_audience: input.targetAudience, main_problem_solved: `${product} membantu audience menyelesaikan kebutuhan praktis dalam kategori ${input.productCategory}.`, buying_triggers: ["Manfaat mudah dipahami", "Demonstrasi penggunaan nyata", "Harga dan value terlihat jelas"], objections: ["Apakah produk benar-benar dibutuhkan?", "Apakah kualitas sesuai harga?", "Bagaimana cara penggunaannya?"], competitor_angle: ["Demo jujur sebelum-after", "Use case spesifik audience", "Perbandingan fitur tanpa klaim berlebihan"] },
    product_score: { demand_score: 82, competition_score: 64, commission_score: commissionScore(input.commissionRate), content_potential_score: 88, overall_score: 81, recommendation: "promote" },
    content_strategy: { recommended_angle: `Gunakan demo praktis ${product} untuk menunjukkan manfaat tanpa hard selling.`, soft_selling_hooks: [`Sebelum membeli ${product}, cek tiga hal ini.`, `Ini use case ${product} yang paling relevan untuk ${input.targetAudience}.`, `${product} cocok untuk siapa? Mari lihat penggunaan nyatanya.`], content_formats: ["Problem-solution demo", "Honest review", "Comparison checklist"], video_ideas: ["Demo penggunaan sehari-hari", "Tiga fitur paling berguna", "Siapa yang cocok dan tidak cocok memakai produk ini"], trust_builder_points: ["Tampilkan batasan produk.", "Gunakan footage penggunaan nyata.", "Tambahkan disclosure affiliate dengan jelas."] },
    affiliate_cta: { platform: input.platform, cta_options: cta, disclosure_note: "Konten ini dapat mengandung link affiliate. Saya dapat menerima komisi tanpa biaya tambahan untuk pembeli." },
    account_recommendation: input.affiliateAccounts?.length ? input.affiliateAccounts.map((account) => `${account.platform} ${account.handle} (${account.role})`) : [`Gunakan account ${input.platform} dengan audience fit paling relevan.`],
    campaign_plan: Array.from({ length: 5 }, (_, index) => ({ day: index + 1, content_idea: ["Problem awareness", "Demo produk", "Honest comparison", "FAQ dan objection handling", "Recap use case terbaik"][index], hook: [`Pernah mengalami masalah ini?`, `Begini cara kerja ${product}.`, `Sebelum checkout, bandingkan ini dulu.`, `Pertanyaan paling sering tentang ${product}.`, `Ini alasan ${product} layak diuji.`][index], format: ["Short demo", "Tutorial", "Comparison", "FAQ", "Review recap"][index], goal: ["Awareness", "Consideration", "Trust", "Objection handling", "Conversion"][index] })),
    risk_check: { exaggerated_claim_risk: "low", policy_notes: ["Jangan membuat klaim berlebihan.", "Hindari hard selling berulang.", "Jangan menggunakan urgency yang menyesatkan.", "Tambahkan disclosure affiliate."], disclosure_recommended: true, prohibited_claim_warning: ["Jangan membuat klaim kesehatan atau keuangan tanpa bukti.", "Jangan menjanjikan hasil pasti.", "Jangan menyatakan stok atau promo terbatas tanpa verifikasi."] },
    next_actions: ["Review product score.", "Pilih dua hook untuk diuji.", "Rekam demo original.", "Tambahkan disclosure.", "Export campaign draft untuk approval."]
  };
}

export function affiliatePlatformCtas(platform: AffiliateInput["platform"]) {
  if (platform === "tiktok") return ["Follow untuk review berikutnya.", "Like dan simpan agar mudah ditemukan.", "Tulis pertanyaan di komentar.", "Cek keranjang kuning untuk detail produk."];
  if (platform === "youtube") return ["Like dan subscribe untuk review berikutnya.", "Tulis pertanyaan di komentar.", "Cek link di deskripsi untuk detail produk."];
  if (platform === "instagram") return ["Simpan dan share Reels ini.", "Follow untuk rekomendasi berikutnya.", "Kirim DM jika butuh detail produk."];
  if (platform === "facebook") return ["Bagikan posting ini.", "Tulis pertanyaan di komentar.", "Follow Page untuk update berikutnya.", "Hubungi WhatsApp atau contact jika butuh detail."];
  return ["Cek voucher sebelum checkout.", "Tambah produk ke keranjang.", "Follow toko untuk update promo.", "Checkout saat promo masih berlaku."];
}

function normalizeAffiliatePlan(value: Partial<AffiliatePlan>, input: AffiliateInput): AffiliatePlan {
  const fallback = buildDummyAffiliatePlan(input);
  const providedScore = value.product_score;
  const scores = { demand_score: score(providedScore?.demand_score, fallback.product_score.demand_score), competition_score: score(providedScore?.competition_score, fallback.product_score.competition_score), commission_score: score(providedScore?.commission_score, fallback.product_score.commission_score), content_potential_score: score(providedScore?.content_potential_score, fallback.product_score.content_potential_score), overall_score: score(providedScore?.overall_score, fallback.product_score.overall_score) };
  return {
    product_research: { product_name: text(value.product_research?.product_name, fallback.product_research.product_name), category: text(value.product_research?.category, input.productCategory), target_audience: text(value.product_research?.target_audience, input.targetAudience), main_problem_solved: text(value.product_research?.main_problem_solved, fallback.product_research.main_problem_solved), buying_triggers: list(value.product_research?.buying_triggers, fallback.product_research.buying_triggers), objections: list(value.product_research?.objections, fallback.product_research.objections), competitor_angle: list(value.product_research?.competitor_angle, fallback.product_research.competitor_angle) },
    product_score: { ...scores, recommendation: recommendation(providedScore?.recommendation, scores.overall_score) },
    content_strategy: { recommended_angle: text(value.content_strategy?.recommended_angle, fallback.content_strategy.recommended_angle), soft_selling_hooks: list(value.content_strategy?.soft_selling_hooks, fallback.content_strategy.soft_selling_hooks), content_formats: list(value.content_strategy?.content_formats, fallback.content_strategy.content_formats), video_ideas: list(value.content_strategy?.video_ideas, fallback.content_strategy.video_ideas), trust_builder_points: list(value.content_strategy?.trust_builder_points, fallback.content_strategy.trust_builder_points) },
    affiliate_cta: { platform: input.platform, cta_options: affiliatePlatformCtas(input.platform), disclosure_note: text(value.affiliate_cta?.disclosure_note, fallback.affiliate_cta.disclosure_note) },
    account_recommendation: list(value.account_recommendation, fallback.account_recommendation),
    campaign_plan: normalizeCampaign(value.campaign_plan, fallback.campaign_plan),
    risk_check: { exaggerated_claim_risk: risk(value.risk_check?.exaggerated_claim_risk, "low"), policy_notes: list(value.risk_check?.policy_notes, fallback.risk_check.policy_notes), disclosure_recommended: value.risk_check?.disclosure_recommended ?? true, prohibited_claim_warning: list(value.risk_check?.prohibited_claim_warning, fallback.risk_check.prohibited_claim_warning) },
    next_actions: list(value.next_actions, fallback.next_actions)
  };
}

function normalizeCampaign(value: unknown, fallback: AffiliatePlan["campaign_plan"]) {
  if (!Array.isArray(value) || !value.length) return fallback;
  return value.slice(0, 5).map((item, index) => {
    const row = item as Partial<AffiliatePlan["campaign_plan"][number]>;
    const base = fallback[index] ?? fallback[0];
    return { day: typeof row.day === "number" ? row.day : index + 1, content_idea: text(row.content_idea, base.content_idea), hook: text(row.hook, base.hook), format: text(row.format, base.format), goal: text(row.goal, base.goal) };
  });
}

function affiliatePrompt(input: AffiliateInput) {
  return `Return only valid JSON for an affiliate soft-selling plan. Required keys: product_research, product_score, content_strategy, affiliate_cta, account_recommendation, campaign_plan, risk_check, next_actions. Never use exaggerated, misleading, unsupported health, or unsupported finance claims. Input: ${JSON.stringify(input)}`;
}

function commissionScore(rate?: string) { const amount = Number(rate?.replace(/[^0-9.]/g, "")); return Number.isFinite(amount) && amount > 0 ? score(amount * 5, 72) : 72; }
function recommendation(value: unknown, overall: number): AffiliatePlan["product_score"]["recommendation"] { if (value === "avoid" || value === "test" || value === "promote" || value === "scale") return value; return overall >= 90 ? "scale" : overall >= 70 ? "promote" : overall >= 50 ? "test" : "avoid"; }
function text(value: unknown, fallback: string) { return typeof value === "string" && value.trim() ? value.trim() : fallback; }
function list(value: unknown, fallback: string[]) { return Array.isArray(value) && value.some((entry) => typeof entry === "string" && entry.trim()) ? value.filter((entry): entry is string => typeof entry === "string" && Boolean(entry.trim())).map((entry) => entry.trim()) : fallback; }
function score(value: unknown, fallback: number) { return typeof value === "number" && Number.isFinite(value) ? Math.min(100, Math.max(0, Math.round(value))) : fallback; }
function risk(value: unknown, fallback: "low" | "medium" | "high") { return value === "low" || value === "medium" || value === "high" ? value : fallback; }
function fallbackMeta(errorReason: string): AffiliatePlanMeta { return { provider: "dummy", mode: "fallback", error_reason: errorReason, generated_at: new Date().toISOString() }; }
