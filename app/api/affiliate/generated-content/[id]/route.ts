import { apiError, apiSuccess, parseJsonBody } from "@/lib/api-response";
import { withTimeout } from "@/lib/db-timeout";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await parseJsonBody<{ body?: string }>(request);
  if (typeof body?.body !== "string") return apiError("Body konten wajib diisi.", 400);
  try { const generatedContent = await withTimeout(prisma.generatedContent.update({ where: { id: params.id }, data: { body: body.body } })); return apiSuccess("Generated content updated.", { generatedContent }, { generatedContent }); }
  catch { return apiError("Generated content tidak ditemukan.", 404); }
}
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try { await withTimeout(prisma.generatedContent.delete({ where: { id: params.id } })); return apiSuccess("Generated content deleted."); }
  catch { return apiError("Generated content tidak ditemukan.", 404); }
}
