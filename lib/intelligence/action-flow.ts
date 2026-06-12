import type { AffiliateProductInsightDto, IntelligenceRecommendationDto, IntelligenceResultDto } from "@/lib/intelligence/types";

const opportunityKey = "saved_opportunities";
const campaignKey = "affiliate_campaigns";
const generatedContentKey = "affiliate_generated_content";
const generatedPlanKey = "affiliate_generated_plans";
const legacyOpportunityKey = "open-director:saved-opportunities";
const legacyCampaignKey = "open-director:affiliate-campaigns";

export type StudioInsightContext = {
  campaignId?: string;
  generatedContentId?: string;
  topic: string;
  keyword: string;
  source: string;
  sourceUrl?: string;
  score: number;
  confidence: number;
  platform: string;
  reason: string;
  recommendedContentAngle: string;
  isDemo: boolean;
  notes: string;
  suggestedHook: string;
  suggestedCaption: string;
  script?: string;
  cta?: string;
  generationType: "IMAGE" | "MOTION_IMAGE" | "AI_VIDEO";
};

export type SavedOpportunity = {
  id: string;
  topic: string;
  type: "content_topic" | "affiliate_product";
  source: string;
  sourceUrl?: string;
  score: number;
  confidence: number;
  platform: string;
  reason: string;
  notes: string;
  createdAt: string;
  isDemo: boolean;
  status: "saved";
  dataSource?: "database" | "local";
};

export type AffiliateCampaignDraft = {
  id: string;
  productId?: string;
  dataMode?: "DEMO DATA" | "MANUAL DATA" | "CSV IMPORT" | "REAL API";
  missingProductFields?: string[];
  campaignName: string;
  productName: string;
  targetAudience?: string;
  contentObjective?: string;
  targetPlatforms?: string[];
  budget?: string;
  affiliateAccountIds?: string[];
  affiliateAccounts?: AffiliateAccountDto[];
  platform: string;
  category: string;
  trendScore: number;
  competitionLevel: string;
  commissionEstimate: string;
  priceRange: string;
  contentPotentialScore: number;
  source: string;
  sourceUrl?: string;
  notes: string;
  status: "draft" | "testing" | "active" | "winner" | "paused";
  dataSource?: "database" | "local";
  isDemo: boolean;
  createdAt: string;
};

export type AffiliateAccountDto = {
  id: string;
  programId?: string | null;
  platform: string;
  accountName: string;
  handle: string;
  niche: string;
  role: string;
  status: string;
  affiliateDashboardUrl?: string;
  affiliateLink?: string;
  commissionInfo: string;
  notes: string;
};

export type AffiliateCampaignInput = Omit<AffiliateCampaignDraft, "id" | "createdAt" | "status"> & { status?: AffiliateCampaignDraft["status"] };

export type AffiliateContentKit = {
  campaignId: string;
  productId?: string;
  dataMode?: AffiliateCampaignDraft["dataMode"];
  targetAudience: string;
  mainBenefit: string;
  problem: string;
  tone: string;
  contentAngle: string;
  hooks: string[];
  scripts: string[];
  captions: string[];
  hashtags: string[];
  ctas: string[];
  voiceOverScripts: string[];
  scenePlans: string[];
  videoPrompts: string[];
  updatedAt: string;
};

function readLocal<T>(key: string, legacyKey?: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const current = window.localStorage.getItem(key);
    if (current) return JSON.parse(current) as T[];
    const legacy = legacyKey ? window.localStorage.getItem(legacyKey) : null;
    if (!legacy) return [];
    const parsed = JSON.parse(legacy) as T[];
    writeLocal(key, parsed);
    return parsed;
  } catch {
    return [];
  }
}

function writeLocal<T>(key: string, items: T[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(items));
}

function localId(prefix: string) {
  return `${prefix}_${Date.now()}`;
}

export function getSavedOpportunities() {
  return readLocal<SavedOpportunity>(opportunityKey, legacyOpportunityKey);
}

// TODO: migrate local opportunities to a database model when the campaign domain is finalized.
export function saveOpportunity(input: Omit<SavedOpportunity, "id" | "createdAt" | "status">) {
  const current = getSavedOpportunities();
  const existing = current.find((item) => item.topic === input.topic && item.source === input.source);
  if (existing) return existing;
  const opportunity: SavedOpportunity = { ...input, id: localId("opportunity"), createdAt: new Date().toISOString(), status: "saved", dataSource: "local" };
  writeLocal(opportunityKey, [opportunity, ...current]);
  return opportunity;
}

export function getCampaignDrafts() {
  return readLocal<AffiliateCampaignDraft>(campaignKey, legacyCampaignKey).map((campaign) => ({
    ...campaign,
    campaignName: campaign.campaignName ?? `${campaign.productName} Campaign`,
    targetAudience: campaign.targetAudience ?? "",
    contentObjective: campaign.contentObjective ?? "",
    targetPlatforms: campaign.targetPlatforms ?? [],
    affiliateAccountIds: campaign.affiliateAccountIds ?? []
  }));
}

// TODO: migrate local campaign drafts to a database model after the affiliate workflow is validated.
export function createCampaignDraft(input: AffiliateCampaignInput) {
  const current = getCampaignDrafts();
  const existing = current.find((item) => item.productName === input.productName && item.platform === input.platform);
  if (existing) return existing;
  const campaign: AffiliateCampaignDraft = { ...input, id: localId("campaign"), createdAt: new Date().toISOString(), status: input.status ?? "draft", dataSource: "local" };
  writeLocal(campaignKey, [campaign, ...current]);
  return campaign;
}

export function putLocalCampaign(campaign: AffiliateCampaignDraft) {
  const current = getCampaignDrafts();
  writeLocal(campaignKey, [campaign, ...current.filter((item) => item.id !== campaign.id && !(item.productName === campaign.productName && item.platform === campaign.platform))]);
}

export function putLocalOpportunity(opportunity: SavedOpportunity) {
  const current = getSavedOpportunities();
  writeLocal(opportunityKey, [opportunity, ...current.filter((item) => item.id !== opportunity.id && !(item.topic === opportunity.topic && item.source === opportunity.source))]);
}

export function getCampaignDraft(id: string) {
  return getCampaignDrafts().find((campaign) => campaign.id === id);
}

export function getGeneratedContent(campaignId: string) {
  return readLocal<AffiliateContentKit>(generatedContentKey).find((kit) => kit.campaignId === campaignId);
}

// TODO: Move to database when campaign backend is ready.
export function saveGeneratedContent(kit: AffiliateContentKit) {
  const current = readLocal<AffiliateContentKit>(generatedContentKey);
  writeLocal(generatedContentKey, [kit, ...current.filter((item) => item.campaignId !== kit.campaignId)]);
  return kit;
}

export function markAffiliatePlanReady(campaignId: string) {
  if (typeof window === "undefined") return;
  const campaignIds = readLocal<string>(generatedPlanKey);
  writeLocal(generatedPlanKey, [...new Set([campaignId, ...campaignIds])]);
}

export function isAffiliatePlanReady(campaignId: string) {
  return readLocal<string>(generatedPlanKey).includes(campaignId);
}

export function studioHref(context: StudioInsightContext) {
  return `/creative-studio?context=${encodeURIComponent(JSON.stringify(context))}`;
}

export function trendStudioContext(trend: IntelligenceResultDto): StudioInsightContext {
  return {
    topic: trend.topic,
    keyword: trend.keyword,
    source: trend.source,
    sourceUrl: trend.sourceUrl,
    score: trend.score,
    confidence: trend.confidence,
    platform: trend.socialPlatform,
    reason: trend.viralReason,
    recommendedContentAngle: trend.opportunity,
    isDemo: trend.isDemo,
    notes: trend.notes,
    suggestedHook: `Tunggu dulu. Ini cara sederhana memakai ${trend.keyword} untuk hasil yang lebih cepat.`,
    suggestedCaption: `${trend.opportunity} ${trend.hashtag}`,
    generationType: "AI_VIDEO"
  };
}

export function recommendationStudioContext(item: IntelligenceRecommendationDto): StudioInsightContext {
  return {
    topic: item.recommendedTopic,
    keyword: item.keyword,
    source: item.sourceBreakdown.map((source) => source.source).join(", "),
    sourceUrl: item.sourceUrl,
    score: item.score,
    confidence: item.confidence,
    platform: item.socialPlatform,
    reason: item.reason,
    recommendedContentAngle: item.contentAngle,
    isDemo: item.isDemo,
    notes: item.notes,
    suggestedHook: `Jangan lewatkan ${item.recommendedTopic}. Ini angle yang paling mudah dicoba.`,
    suggestedCaption: `${item.contentAngle} Ikuti untuk ide konten berikutnya.`,
    generationType: "AI_VIDEO"
  };
}

export function productStudioContext(product: AffiliateProductInsightDto): StudioInsightContext {
  return {
    topic: product.productName,
    keyword: product.productName,
    source: product.source,
    sourceUrl: product.sourceUrl,
    score: product.trendScore,
    confidence: product.confidence,
    platform: product.platform,
    reason: product.notes,
    recommendedContentAngle: `Tampilkan problem-solution dan benefit utama ${product.productName}, lalu arahkan penonton untuk klik keranjang kuning.`,
    isDemo: product.isDemo,
    notes: product.notes,
    suggestedHook: `Produk kecil ini ternyata bikin aktivitas harian jauh lebih praktis.`,
    suggestedCaption: `${product.productName}: solusi praktis dengan demo singkat. Cek produknya di keranjang kuning.`,
    generationType: "AI_VIDEO"
  };
}

export function affiliateCampaignFromProduct(product: AffiliateProductInsightDto) {
  return createCampaignDraft({
    productId: product.id,
    dataMode: product.dataMode,
    missingProductFields: product.missingFields,
    campaignName: `${product.productName} Campaign`,
    productName: product.productName,
    platform: product.platform,
    category: product.category,
    trendScore: product.trendScore,
    competitionLevel: product.competitionLevel,
    commissionEstimate: product.commissionEstimate,
    priceRange: product.priceRange,
    contentPotentialScore: product.contentPotentialScore,
    source: product.source,
    sourceUrl: product.sourceUrl,
    notes: product.notes,
    isDemo: product.isDemo
  });
}

export function campaignTemplates(campaign: AffiliateCampaignDraft) {
  return generateContentKit(campaign);
}

export function defaultCampaignInsight(campaign: AffiliateCampaignDraft) {
  return {
    problem: `Aktivitas harian terasa lebih lambat tanpa solusi praktis untuk kategori ${campaign.category}.`,
    targetAudience: campaign.targetAudience || `Pembeli pemula yang mencari produk ${campaign.category.toLowerCase()} praktis dengan harga terjangkau.`,
    mainBenefit: `${campaign.productName} membantu menyederhanakan aktivitas harian dengan penggunaan yang mudah.`,
    contentAngle: `Tampilkan masalah nyata, demo singkat ${campaign.productName}, lalu arahkan penonton ke keranjang kuning.`,
    riskNote: `${campaign.competitionLevel} competition. Gunakan demo produk yang jelas agar konten tidak terasa generik.`
  };
}

export function generateContentKit(campaign: AffiliateCampaignDraft, previous?: Partial<AffiliateContentKit>): AffiliateContentKit {
  const insight = defaultCampaignInsight(campaign);
  const problem = previous?.problem ?? insight.problem;
  const targetAudience = previous?.targetAudience ?? insight.targetAudience;
  const mainBenefit = previous?.mainBenefit ?? insight.mainBenefit;
  const tone = previous?.tone ?? "Helpful and direct";
  const contentAngle = previous?.contentAngle ?? insight.contentAngle;
  const ctas = platformCtas(campaign.targetPlatforms?.length ? campaign.targetPlatforms : [campaign.platform]);
  return {
    campaignId: campaign.id,
    productId: campaign.productId,
    dataMode: campaign.dataMode,
    targetAudience,
    mainBenefit,
    problem,
    tone,
    contentAngle,
    hooks: previous?.hooks ?? [
      `Masih capek dengan masalah ini? ${campaign.productName} bisa jadi solusi praktisnya.`,
      `Produk kecil ini ternyata bikin aktivitas harian jauh lebih cepat.`,
      `Kalau kamu sering ribet di rumah, coba lihat ${campaign.productName}.`,
      `Sebelum beli produk ${campaign.category.toLowerCase()}, cek solusi sederhana ini.`,
      `Tidak perlu cara rumit. Ini alasan ${campaign.productName} layak dicoba.`
    ],
    scripts: previous?.scripts ?? [
      `Opening 3 detik: tunjukkan masalah. Middle 7 detik: demo ${campaign.productName} dan jelaskan benefit utama. Closing 5 detik: ajak penonton klik keranjang kuning.`
    ],
    captions: previous?.captions ?? [
      `${campaign.productName} cocok untuk kamu yang butuh solusi simpel dan cepat. Cek produknya sebelum stok habis.`,
      `Satu produk, satu solusi praktis. Lihat cara pakai ${campaign.productName} lalu cek keranjang kuning.`,
      `Masih cari produk ${campaign.category.toLowerCase()} yang mudah dipakai? Mulai dari ${campaign.productName}.`,
      `Demo singkat ${campaign.productName}. Simpan video ini sebelum menentukan pilihan.`,
      `${mainBenefit} Klik produk untuk lihat detailnya.`
    ],
    hashtags: previous?.hashtags ?? [
      `#AffiliateIndonesia #ReviewProduk #${campaign.category.replaceAll(" ", "")}`,
      `#KeranjangKuning #RekomendasiProduk #${campaign.category.replaceAll(" ", "")}`
    ],
    ctas: previous?.ctas ?? ctas,
    voiceOverScripts: previous?.voiceOverScripts ?? [`Pernah merasa aktivitas harian jadi ribet? ${campaign.productName} bisa membantu dengan cara yang praktis. Lihat demonya, cek manfaatnya, lalu ${ctas[0].toLowerCase()}`],
    scenePlans: previous?.scenePlans ?? ["Scene 1: tampilkan masalah audience dalam 2-3 detik.", `Scene 2: close-up ${campaign.productName}.`, "Scene 3: demo pemakaian dan benefit utama.", `Scene 4: tampilkan CTA: ${ctas[0]}`],
    videoPrompts: previous?.videoPrompts ?? [
      `Buat video affiliate vertikal 15 detik untuk ${campaign.productName}. Highlight problem-solution, demo benefit utama, dan CTA klik keranjang kuning.`,
      `Buat video review ${campaign.productName} dengan opening masalah, close-up produk, demo pemakaian, lalu CTA singkat.`,
      `Buat video UGC vertikal untuk ${campaign.productName}, tone ${tone.toLowerCase()}, fokus pada ${contentAngle}`
    ],
    updatedAt: new Date().toISOString()
  };
}

function platformCtas(platforms: string[]) {
  const values = platforms.map((item) => item.toLowerCase());
  const ctas: string[] = [];
  if (values.some((item) => item.includes("youtube"))) ctas.push("Like, subscribe, comment, dan watch next.");
  if (values.some((item) => item.includes("tiktok"))) ctas.push("Follow, like, save, comment, dan cek keranjang kuning jika relevan.");
  if (values.some((item) => item.includes("instagram"))) ctas.push("Save, share, follow, DM, dan comment untuk detail produk.");
  if (values.some((item) => item.includes("facebook"))) ctas.push("Share, comment, follow page, dan hubungi WhatsApp atau contact jika relevan.");
  if (!ctas.length) ctas.push("Klik affiliate link untuk melihat detail produk dan promo yang tersedia.");
  return ctas;
}
