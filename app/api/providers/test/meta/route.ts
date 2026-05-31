import { apiError, apiSuccess } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/audit-log";
import { validateSocialOAuth } from "@/lib/social-oauth-flow";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!body.socialAccountId) {
    return apiSuccess("Meta OAuth account is not selected. Manual upload remains available.", {
      result: { provider: "Meta OAuth", status: "NOT_CONFIGURED", mode: "DUMMY", message: "No Meta account selected.", lastTestAt: new Date().toISOString() }
    }, {
      result: { provider: "Meta OAuth", status: "NOT_CONFIGURED", mode: "DUMMY", message: "No Meta account selected.", lastTestAt: new Date().toISOString() }
    });
  }
  try {
    const account = await validateSocialOAuth(body.socialAccountId, "META");
    const result = {
      provider: "Meta OAuth",
      status: account.authStatus === "CONNECTED" ? "READY" : "NOT_CONFIGURED",
      mode: account.authStatus === "CONNECTED" ? "REAL" : "DUMMY",
      message: account.connectionNotes,
      lastTestAt: account.lastSyncAt?.toISOString() ?? new Date().toISOString()
    };
    await writeAuditLog({ action: "PROVIDER_TEST_META_OAUTH", entityType: "SocialAccount", entityId: account.id, message: result.message, metadata: { authStatus: account.authStatus } });
    return apiSuccess(result.message, { result }, { result });
  } catch (error) {
    return apiError("Meta OAuth validation failed.", 500, error);
  }
}
