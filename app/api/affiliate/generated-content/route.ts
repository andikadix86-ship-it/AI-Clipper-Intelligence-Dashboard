import { apiError, apiSuccess, parseJsonBody } from "@/lib/api-response";
import { withTimeout } from "@/lib/db-timeout";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit-log";
import { createNotification } from "@/lib/notification-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const campaignId = url.searchParams.get("campaignId") ?? undefined;
  const opportunityId = url.searchParams.get("opportunityId") ?? undefined;
  try {
    const generatedContent = await withTimeout(prisma.generatedContent.findMany({ where: { campaignId, opportunityId }, orderBy: { createdAt: "asc" } }));
    return apiSuccess("Generated content loaded.", { generatedContent }, { generatedContent });
  } catch { return apiError("Database belum tersedia. Konten lokal tetap dapat digunakan.", 503); }
}

export async function POST(request: Request) {
  const body = await parseJsonBody<{ campaignId?: string; opportunityId?: string; platform?: string; tone?: string; source?: string; isDemo?: boolean; metadata?: object; items?: Array<{ contentType: string; title: string; body: string; metadata?: object }> }>(request);
  if (!body || (!body.campaignId && !body.opportunityId) || !body.items?.length) return apiError("Generated content payload tidak lengkap.", 400);
  try {
    const generatedContent = await withTimeout(prisma.$transaction(async (tx) => {
      await tx.generatedContent.deleteMany({ where: { campaignId: body.campaignId, opportunityId: body.opportunityId } });
      await tx.generatedContent.createMany({ data: body.items!.map((item) => ({ campaignId: body.campaignId, opportunityId: body.opportunityId, contentType: item.contentType, title: item.title, body: item.body, platform: body.platform ?? "", tone: body.tone ?? "", source: body.source ?? "Content Factory", isDemo: body.isDemo !== false, metadata: { ...(body.metadata ?? {}), ...(item.metadata ?? {}) } })) });
      return tx.generatedContent.findMany({ where: { campaignId: body.campaignId, opportunityId: body.opportunityId }, orderBy: { createdAt: "asc" } });
    }));
    await writeAuditLog({ action: "AFFILIATE_CONTENT_GENERATED", entityType: "GeneratedContent", entityId: body.campaignId ?? body.opportunityId, message: `${generatedContent.length} affiliate content items saved.`, metadata: { campaignId: body.campaignId, opportunityId: body.opportunityId, isDemo: body.isDemo !== false } });
    await createNotification({ title: "Campaign content generated", message: `${generatedContent.length} affiliate content items tersimpan.`, type: "CAMPAIGN_CONTENT_GENERATED", severity: "SUCCESS", source: "Content Factory", actionUrl: body.campaignId ? `/campaigns/${body.campaignId}` : "/content-factory" });
    return apiSuccess("Generated content tersimpan ke database.", { generatedContent }, { generatedContent }, 201);
  } catch { return apiError("Gagal menyimpan konten. Coba ulang.", 503); }
}
