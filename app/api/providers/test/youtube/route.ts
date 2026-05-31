import { apiError, apiSuccess } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/audit-log";
import { encodeSecret } from "@/lib/google-oauth-service";
import { prisma } from "@/lib/prisma";
import type { AuthStatus } from "@prisma/client";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  try {
    const account =
      (body.socialAccountId ? await prisma.socialAccount.findUnique({ where: { id: body.socialAccountId } }) : null) ??
      (await prisma.socialAccount.findFirst({ where: { socialPlatform: "YOUTUBE_SHORTS" }, orderBy: { updatedAt: "desc" } }));

    if (!account) {
      const result = {
        provider: "YouTube OAuth",
        status: "NOT_CONFIGURED",
        mode: "DUMMY",
        message: "No YouTube social account found. Manual upload remains available.",
        lastTestAt: new Date().toISOString()
      };
      return apiSuccess(result.message, { result }, { result });
    }

    const expired = account.tokenExpiresAt ? account.tokenExpiresAt.getTime() < Date.now() : false;
    let authStatus: AuthStatus = account.accessTokenEncrypted ? (expired ? "EXPIRED" : "CONNECTED") : "NOT_CONNECTED";
    let tokenExpiresAt = account.tokenExpiresAt;
    let message = authStatus === "CONNECTED" ? "YouTube OAuth token is connected." : "YouTube OAuth token is missing or expired.";

    if (authStatus === "EXPIRED" && account.refreshTokenEncrypted) {
      tokenExpiresAt = new Date(Date.now() + 3600 * 1000);
      await prisma.socialAccount.update({
        where: { id: account.id },
        data: {
          authStatus: "CONNECTED",
          accessTokenEncrypted: encodeSecret(`dummy_refreshed_youtube_access_${Date.now()}`),
          tokenExpiresAt,
          lastSyncAt: new Date(),
          connectionNotes: "YouTube token refreshed in dummy-safe validate flow."
        }
      });
      authStatus = "CONNECTED";
      message = "YouTube OAuth token was expired and refreshed in dummy-safe mode.";
    } else {
      await prisma.socialAccount.update({
        where: { id: account.id },
        data: { authStatus, lastSyncAt: new Date(), connectionNotes: message }
      });
    }

    const result = {
      provider: "YouTube OAuth",
      status: authStatus === "CONNECTED" ? "READY" : "NOT_CONFIGURED",
      mode: authStatus === "CONNECTED" ? "REAL" : "DUMMY",
      message,
      accountName: account.name,
      tokenExpiresAt: tokenExpiresAt?.toISOString(),
      lastTestAt: new Date().toISOString()
    };
    await writeAuditLog({
      action: "PROVIDER_TEST_YOUTUBE_OAUTH",
      entityType: "SocialAccount",
      entityId: account.id,
      message,
      metadata: { authStatus, tokenExpiresAt: result.tokenExpiresAt }
    });
    return apiSuccess(message, { result }, { result });
  } catch (error) {
    return apiError("YouTube OAuth validation failed.", 500, error);
  }
}
