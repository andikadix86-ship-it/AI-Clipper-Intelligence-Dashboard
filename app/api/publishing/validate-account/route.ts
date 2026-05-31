import { apiError, apiSuccess } from "@/lib/api-response";
import { getPublishingProvider } from "@/lib/publishing";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!body.socialAccountId) return apiError("socialAccountId is required.", 400);
  try {
    const account = await prisma.socialAccount.findUnique({ where: { id: body.socialAccountId } });
    if (!account) return apiError("Social account not found.", 404);
    const result = await getPublishingProvider(account.socialPlatform ?? "YOUTUBE_SHORTS").validateAccount(account.id);
    await prisma.socialAccount.update({ where: { id: account.id }, data: { authStatus: result.authStatus, lastSyncAt: new Date(), connectionNotes: result.message } });
    return apiSuccess("Social account validation completed.", { result }, { result });
  } catch (error) {
    return apiError("Social account validation failed.", 500, error);
  }
}
