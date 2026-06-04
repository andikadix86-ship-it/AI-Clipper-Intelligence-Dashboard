import { apiError, apiSuccess, parseJsonBody } from "@/lib/api-response";
import { withTimeout } from "@/lib/db-timeout";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit-log";

export const runtime = "nodejs";

export async function GET() {
  try {
    const campaigns = await withTimeout(prisma.affiliateCampaign.findMany({ include: { campaignAccounts: { include: { affiliateAccount: true } } }, orderBy: { updatedAt: "desc" } }));
    return apiSuccess("Affiliate campaigns loaded.", { campaigns }, { campaigns });
  } catch {
    return apiError("Database belum tersedia. Campaign lokal tetap dapat digunakan.", 503);
  }
}

export async function POST(request: Request) {
  const body = await parseJsonBody<Record<string, unknown>>(request);
  if (!body || !required(body, ["campaignName", "productName", "platform", "category", "source"])) return apiError("Campaign payload tidak lengkap.", 400);
  try {
    const affiliateAccountIds = strings(body.affiliateAccountIds);
    if (!affiliateAccountIds.length) return apiError("Pilih minimal satu affiliate account.", 400);
    const existing = await withTimeout(prisma.affiliateCampaign.findFirst({ where: { productName: String(body.productName), platform: String(body.platform) } }));
    const campaign = await withTimeout(prisma.$transaction(async (tx) => {
      const saved = existing
        ? await tx.affiliateCampaign.update({ where: { id: existing.id }, data: campaignData(body) })
        : await tx.affiliateCampaign.create({ data: campaignData(body) });
      await tx.campaignAccount.deleteMany({ where: { campaignId: saved.id } });
      await tx.campaignAccount.createMany({ data: affiliateAccountIds.map((affiliateAccountId) => ({ campaignId: saved.id, affiliateAccountId })) });
      return tx.affiliateCampaign.findUniqueOrThrow({ where: { id: saved.id }, include: { campaignAccounts: { include: { affiliateAccount: true } } } });
    }));
    if (!existing) {
      await writeAuditLog({ action: "AFFILIATE_CAMPAIGN_CREATED", entityType: "AffiliateCampaign", entityId: campaign.id, message: `Affiliate campaign created: ${campaign.campaignName}.`, metadata: { platform: campaign.platform, productName: campaign.productName, isDemo: campaign.isDemo } });
    }
    return apiSuccess(existing ? "Campaign database diperbarui." : "Campaign tersimpan ke database.", { campaign }, { campaign }, existing ? 200 : 201);
  } catch {
    return apiError("Database belum tersedia. Data disimpan sementara secara lokal.", 503);
  }
}

function campaignData(body: Record<string, unknown>) {
  const metadata = json(body.metadata);
  return {
    campaignName: String(body.campaignName),
    productName: String(body.productName),
    platform: String(body.platform),
    category: String(body.category),
    trendScore: number(body.trendScore),
    competitionLevel: String(body.competitionLevel ?? "Medium"),
    commissionEstimate: String(body.commissionEstimate ?? ""),
    priceRange: String(body.priceRange ?? ""),
    contentPotentialScore: number(body.contentPotentialScore),
    source: String(body.source),
    sourceUrl: optional(body.sourceUrl),
    notes: String(body.notes ?? ""),
    isDemo: body.isDemo !== false,
    status: String(body.status ?? "draft"),
    metadata: {
      ...metadata,
      targetAudience: String(body.targetAudience ?? metadata?.targetAudience ?? ""),
      contentObjective: String(body.contentObjective ?? metadata?.contentObjective ?? ""),
      targetPlatforms: strings(body.targetPlatforms),
      budget: String(body.budget ?? metadata?.budget ?? "")
    }
  };
}

function required(body: Record<string, unknown>, fields: string[]) { return fields.every((field) => typeof body[field] === "string" && body[field]); }
function number(value: unknown) { return Number.isFinite(Number(value)) ? Number(value) : 0; }
function optional(value: unknown) { return typeof value === "string" && value ? value : undefined; }
function json(value: unknown) { return value && typeof value === "object" ? value as Record<string, unknown> : undefined; }
function strings(value: unknown) { return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).map((item) => item.trim()) : []; }
