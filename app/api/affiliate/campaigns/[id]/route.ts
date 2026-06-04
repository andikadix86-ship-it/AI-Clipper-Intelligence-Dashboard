import { apiError, apiSuccess, parseJsonBody } from "@/lib/api-response";
import { withTimeout } from "@/lib/db-timeout";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const campaign = await withTimeout(prisma.affiliateCampaign.findUnique({ where: { id: params.id }, include: { generatedContent: { orderBy: { createdAt: "asc" } }, campaignAccounts: { include: { affiliateAccount: true } } } }));
    return campaign ? apiSuccess("Campaign loaded.", { campaign }, { campaign }) : apiError("Campaign tidak ditemukan.", 404);
  } catch { return apiError("Database belum tersedia. Campaign lokal tetap dapat digunakan.", 503); }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await parseJsonBody<Record<string, unknown>>(request);
  if (!body) return apiError("Invalid JSON body.", 400);
  try {
    const campaign = await withTimeout(prisma.affiliateCampaign.update({ where: { id: params.id }, data: { campaignName: string(body.campaignName), notes: string(body.notes), status: string(body.status), metadata: json(body.metadata) } }));
    return apiSuccess("Campaign updated.", { campaign }, { campaign });
  } catch { return apiError("Gagal memperbarui campaign.", 500); }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try { await withTimeout(prisma.affiliateCampaign.delete({ where: { id: params.id } })); return apiSuccess("Campaign deleted."); }
  catch { return apiError("Gagal menghapus campaign.", 500); }
}

function string(value: unknown) { return typeof value === "string" ? value : undefined; }
function json(value: unknown) { return value && typeof value === "object" ? value as object : undefined; }
