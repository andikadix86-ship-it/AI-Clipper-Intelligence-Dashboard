import { apiError, apiSuccess } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/audit-log";
import { getGoogleOAuthSetting, saveGoogleOAuthSetting } from "@/lib/google-oauth-service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const setting = await getGoogleOAuthSetting();
    return apiSuccess("Google OAuth settings loaded.", { setting }, { setting });
  } catch (error) {
    return apiError("Google OAuth settings could not be loaded.", 500, error);
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  try {
    const setting = await saveGoogleOAuthSetting({ clientId: body.clientId, clientSecret: body.clientSecret, redirectUri: body.redirectUri });
    await writeAuditLog({
      action: "SAVE_GOOGLE_OAUTH_SETTINGS",
      entityType: "GoogleOAuthSetting",
      entityId: setting.id,
      message: "Google OAuth settings saved.",
      metadata: { hasClientId: Boolean(body.clientId), hasClientSecret: Boolean(body.clientSecret), redirectUri: body.redirectUri }
    });
    return apiSuccess("Google OAuth settings saved.", { setting }, { setting });
  } catch (error) {
    return apiError("Google OAuth settings could not be saved.", 500, error);
  }
}
