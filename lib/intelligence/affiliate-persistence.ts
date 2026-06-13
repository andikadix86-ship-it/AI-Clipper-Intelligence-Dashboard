import {
  createCampaignDraft,
  getCampaignDraft,
  getCampaignDrafts,
  getGeneratedContent,
  getSavedOpportunities,
  putLocalCampaign,
  saveGeneratedContent,
  saveOpportunity,
  type AffiliateCampaignDraft,
  type AffiliateCampaignInput,
  type AffiliateContentKit,
  type SavedOpportunity
} from "@/lib/intelligence/action-flow";

type DataResult<T> = { items: T[]; source: "database" | "local"; message?: string };
type DbGeneratedContent = { contentType: string; body: string; tone?: string; metadata?: Record<string, unknown> | null };

export async function listCampaigns(): Promise<DataResult<AffiliateCampaignDraft>> {
  try {
    const response = await fetch("/api/affiliate/campaigns");
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    const database = (data.campaigns ?? []).map(mapCampaign);
    const local = getCampaignDrafts().filter((item) => !database.some((row: AffiliateCampaignDraft) => row.productName === item.productName && row.platform === item.platform));
    return { items: [...database, ...local], source: "database" };
  } catch {
    return { items: getCampaignDrafts(), source: "local", message: "Database belum tersedia. Data disimpan sementara secara lokal." };
  }
}

export async function loadCampaign(id: string) {
  try {
    const response = await fetch(`/api/affiliate/campaigns/${id}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return { item: mapCampaign(data.campaign), source: "database" as const };
  } catch {
    return { item: getCampaignDraft(id), source: "local" as const, message: "Database belum tersedia. Campaign lokal tetap dapat digunakan." };
  }
}

export async function persistCampaign(input: AffiliateCampaignInput) {
  const local = createCampaignDraft(input);
  try {
    const response = await fetch("/api/affiliate/campaigns", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(local) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    const campaign = mapCampaign(data.campaign);
    putLocalCampaign(campaign);
    window.dispatchEvent(new CustomEvent("affiliate:campaign-saved", { detail: campaign }));
    return { item: campaign, source: "database" as const, message: "Campaign tersimpan ke database." };
  } catch {
    return { item: local, source: "local" as const, message: "Database belum tersedia. Data disimpan sementara secara lokal." };
  }
}

export async function migrateLocalCampaigns() {
  const locals = getCampaignDrafts().filter((item) => item.dataSource !== "database");
  const results = await Promise.all(locals.map((item) => persistCampaign(item)));
  return { migrated: results.filter((item) => item.source === "database").length, total: locals.length };
}

export async function listOpportunities(): Promise<DataResult<SavedOpportunity>> {
  try {
    const response = await fetch("/api/affiliate/opportunities");
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    const database = (data.opportunities ?? []).map(mapOpportunity);
    return { items: database, source: "database" };
  } catch {
    return { items: getSavedOpportunities(), source: "local", message: "Database belum tersedia. Opportunity lokal tampil sebagai Local Draft / NOT CONNECTED." };
  }
}

export async function persistOpportunity(input: Omit<SavedOpportunity, "id" | "createdAt" | "status">) {
  try {
    const response = await fetch("/api/affiliate/opportunities", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...input, title: input.topic, metadata: { sourceType: input.sourceType } }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    const opportunity = mapOpportunity(data.opportunity);
    return { item: opportunity, source: "database" as const, message: "Opportunity tersimpan ke database." };
  } catch {
    const local = saveOpportunity({ ...input, notes: `${input.notes}\nLocal Draft / NOT CONNECTED: database save failed.`.trim(), dataSource: "local" });
    return { item: local, source: "local" as const, message: "Database belum tersedia. Data disimpan sebagai Local Draft / NOT CONNECTED." };
  }
}

export async function migrateLocalOpportunities() {
  const locals = getSavedOpportunities().filter((item) => item.dataSource !== "database");
  const results = await Promise.all(locals.map((item) => persistOpportunity(item)));
  return { migrated: results.filter((item) => item.source === "database").length, total: locals.length };
}

export async function loadContentKit(campaignId: string) {
  try {
    const response = await fetch(`/api/affiliate/generated-content?campaignId=${encodeURIComponent(campaignId)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    const rows = data.generatedContent as DbGeneratedContent[];
    const local = getGeneratedContent(campaignId);
    return { item: rows.length ? rowsToKit(campaignId, rows) : local, source: rows.length ? "database" as const : "local" as const };
  } catch {
    return { item: getGeneratedContent(campaignId), source: "local" as const, message: "Database belum tersedia. Konten lokal tetap dapat digunakan." };
  }
}

export async function persistContentKit(campaign: AffiliateCampaignDraft, kit: AffiliateContentKit) {
  saveGeneratedContent(kit);
  try {
    const response = await fetch("/api/affiliate/generated-content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ campaignId: campaign.id, platform: campaign.platform, tone: kit.tone, source: campaign.source, isDemo: campaign.isDemo, metadata: kitMeta(kit, campaign), items: kitItems(kit) }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return { source: "database" as const, message: "Generated content tersimpan ke database." };
  } catch {
    return { source: "local" as const, message: "Gagal menyimpan konten ke database. Data tetap aman secara lokal." };
  }
}

function mapCampaign(row: AffiliateCampaignDraft & { metadata?: Record<string, unknown> | null; campaignAccounts?: Array<{ affiliateAccount: NonNullable<AffiliateCampaignDraft["affiliateAccounts"]>[number] }> }) {
  return {
    ...row,
    targetAudience: row.targetAudience ?? String(row.metadata?.targetAudience ?? ""),
    contentObjective: row.contentObjective ?? String(row.metadata?.contentObjective ?? ""),
    targetPlatforms: row.targetPlatforms ?? stringList(row.metadata?.targetPlatforms),
    budget: row.budget ?? String(row.metadata?.budget ?? ""),
    affiliateAccounts: row.campaignAccounts?.map((item) => item.affiliateAccount) ?? row.affiliateAccounts ?? [],
    affiliateAccountIds: row.campaignAccounts?.map((item) => item.affiliateAccount.id) ?? row.affiliateAccountIds ?? [],
    productId: row.productId ?? String(row.metadata?.productId ?? ""),
    finalOpportunityScore: numberValue(row.finalOpportunityScore ?? row.metadata?.finalOpportunityScore),
    contentStrategy: objectValue(row.contentStrategy ?? row.metadata?.contentStrategy) as AffiliateCampaignDraft["contentStrategy"],
    campaignPlan: objectValue(row.campaignPlan ?? row.metadata?.campaignPlan) as AffiliateCampaignDraft["campaignPlan"],
    dataMode: dataMode(row.metadata?.dataMode),
    missingProductFields: stringList(row.metadata?.missingProductFields),
    status: campaignStatus(row.status),
    createdAt: String(row.createdAt),
    dataSource: "database" as const
  };
}
function stringList(value: unknown) { return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []; }
function campaignStatus(value: string): AffiliateCampaignDraft["status"] { return value === "testing" || value === "active" || value === "winner" || value === "paused" ? value : "draft"; }
function mapOpportunity(row: SavedOpportunity & { title?: string; metadata?: Record<string, unknown> | null }) { return { ...row, topic: row.topic ?? row.title ?? "", sourceType: productSourceType(row.sourceType ?? row.metadata?.sourceType), status: "saved" as const, createdAt: String(row.createdAt), dataSource: "database" as const }; }
function kitMeta(kit: AffiliateContentKit, campaign: AffiliateCampaignDraft) { return { targetAudience: kit.targetAudience, mainBenefit: kit.mainBenefit, problem: kit.problem, contentAngle: kit.contentAngle, updatedAt: kit.updatedAt, productId: campaign.productId, dataMode: campaign.dataMode, missingProductFields: campaign.missingProductFields, finalOpportunityScore: campaign.finalOpportunityScore, contentStrategy: campaign.contentStrategy, campaignPlan: campaign.campaignPlan, sourceType: campaign.campaignPlan ? "CAMPAIGN_PLAN" : campaign.isDemo ? "DEMO" : "MANUAL" }; }
function kitItems(kit: AffiliateContentKit) { return (Object.entries({ hook: kit.hooks, script: kit.scripts, caption: kit.captions, hashtag: kit.hashtags, cta: kit.ctas, voice_over: kit.voiceOverScripts, scene_plan: kit.scenePlans, video_prompt: kit.videoPrompts }) as Array<[string, string[]]>).flatMap(([contentType, values]) => values.map((body, index) => ({ contentType, title: `${contentType.replace("_", " ")} ${index + 1}`, body, metadata: { index } }))); }
function rowsToKit(campaignId: string, rows: DbGeneratedContent[]): AffiliateContentKit {
  const meta = rows[0]?.metadata ?? {};
  const group = (type: string) => rows.filter((row) => row.contentType === type).map((row) => row.body);
  return { campaignId, productId: String(meta.productId ?? ""), dataMode: dataMode(meta.dataMode), targetAudience: String(meta.targetAudience ?? ""), mainBenefit: String(meta.mainBenefit ?? ""), problem: String(meta.problem ?? ""), tone: String(rows[0]?.tone ?? "Helpful and direct"), contentAngle: String(meta.contentAngle ?? ""), hooks: group("hook"), scripts: group("script"), captions: group("caption"), hashtags: group("hashtag"), ctas: group("cta"), voiceOverScripts: group("voice_over"), scenePlans: group("scene_plan"), videoPrompts: group("video_prompt"), updatedAt: String(meta.updatedAt ?? new Date().toISOString()) };
}
function dataMode(value: unknown): AffiliateCampaignDraft["dataMode"] | undefined { return value === "DEMO DATA" || value === "MANUAL DATA" || value === "CSV IMPORT" || value === "REAL API" ? value : undefined; }
function numberValue(value: unknown) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : undefined; }
function objectValue(value: unknown) { return value && typeof value === "object" && !Array.isArray(value) ? value : undefined; }
function productSourceType(value: unknown): SavedOpportunity["sourceType"] | undefined { return value === "DEMO" || value === "MANUAL" || value === "CSV_IMPORT" || value === "REAL_API" ? value : undefined; }
