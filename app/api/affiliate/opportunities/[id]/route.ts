import { apiError, apiSuccess, parseJsonBody } from "@/lib/api-response";
import { withTimeout } from "@/lib/db-timeout";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await parseJsonBody<{ status?: string }>(request);
  if (!body?.status) return apiError("Status wajib diisi.", 400);
  try { const opportunity = await withTimeout(prisma.savedOpportunity.update({ where: { id: params.id }, data: { status: body.status } })); return apiSuccess("Opportunity updated.", { opportunity }, { opportunity }); }
  catch { return apiError("Gagal memperbarui opportunity.", 500); }
}
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try { await withTimeout(prisma.savedOpportunity.delete({ where: { id: params.id } })); return apiSuccess("Opportunity deleted."); }
  catch { return apiError("Gagal menghapus opportunity.", 500); }
}
