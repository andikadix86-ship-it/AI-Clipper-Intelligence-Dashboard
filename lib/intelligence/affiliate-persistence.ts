import {
  createCampaignDraft,
  getCampaignDraft,
  getCampaignDrafts,
  getGeneratedContent,
  getSavedOpportunities,
  putLocalCampaign,
  putLocalOpportunity,
  saveGeneratedContent,
  saveOpportunity,
  type AffiliateCampaignDraft,
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

export async function persistCampaign(input: Omit<AffiliateCampaignDraft, "id" | "createdAt" | "status">) {
  const local = createCampaignDraft(input);
  try {
    const response = await fetch("/api/affiliate/campaigns", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(local) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    const campaign = mapCampaign(data.campaign);
    putLocalCampaign(campaign);
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
    const local = getSavedOpportunities().filter((item) => !database.some((row: SavedOpportunity) => row.topic === item.topic && row.source === item.source));
    return { items: [...database, ...local], source: "database" };
  } catch {
    return { items: getSavedOpportunities(), source: "local", message: "Database belum tersedia. Opportunity lokal tetap dapat digunakan." };
  }
}

export async function persistOpportunity(input: Omit<SavedOpportunity, "id" | "createdAt" | "status">) {
  const local = saveOpportunity(input);
  try {
    const response = await fetch("/api/affiliate/opportunities", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...local, title: local.topic }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    const opportunity = mapOpportunity(data.opportunity);
    putLocalOpportunity(opportunity);
    return { item: opportunity, source: "database" as const, message: "Opportunity tersimpan ke database." };
  } catch {
    return { item: local, source: "local" as const, message: "Database belum tersedia. Data disimpan sementara secara lokal." };
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
    const response = await fetch("/api/affiliate/generated-content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ campaignId: campaign.id, platform: campaign.platform, tone: kit.tone, source: campaign.source, isDemo: campaign.isDemo, metadata: kitMeta(kit), items: kitItems(kit) }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return { source: "database" as const, message: "Generated content tersimpan ke database." };
  } catch {
    return { source: "local" as const, message: "Gagal menyimpan konten ke database. Data tetap aman secara lokal." };
  }
}

function mapCampaign(row: AffiliateCampaignDraft) { return { ...row, status: "draft" as const, createdAt: String(row.createdAt), dataSource: "database" as const }; }
function mapOpportunity(row: SavedOpportunity & { title?: string }) { return { ...row, topic: row.topic ?? row.title ?? "", status: "saved" as const, createdAt: String(row.createdAt), dataSource: "database" as const }; }
function kitMeta(kit: AffiliateContentKit) { return { targetAudience: kit.targetAudience, mainBenefit: kit.mainBenefit, problem: kit.problem, contentAngle: kit.contentAngle, updatedAt: kit.updatedAt }; }
function kitItems(kit: AffiliateContentKit) { return (Object.entries({ hook: kit.hooks, script: kit.scripts, caption: kit.captions, hashtag: kit.hashtags, cta: kit.ctas, video_prompt: kit.videoPrompts }) as Array<[string, string[]]>).flatMap(([contentType, values]) => values.map((body, index) => ({ contentType, title: `${contentType.replace("_", " ")} ${index + 1}`, body, metadata: { index } }))); }
function rowsToKit(campaignId: string, rows: DbGeneratedContent[]): AffiliateContentKit {
  const meta = rows[0]?.metadata ?? {};
  const group = (type: string) => rows.filter((row) => row.contentType === type).map((row) => row.body);
  return { campaignId, targetAudience: String(meta.targetAudience ?? ""), mainBenefit: String(meta.mainBenefit ?? ""), problem: String(meta.problem ?? ""), tone: String(rows[0]?.tone ?? "Helpful and direct"), contentAngle: String(meta.contentAngle ?? ""), hooks: group("hook"), scripts: group("script"), captions: group("caption"), hashtags: group("hashtag"), ctas: group("cta"), videoPrompts: group("video_prompt"), updatedAt: String(meta.updatedAt ?? new Date().toISOString()) };
}
