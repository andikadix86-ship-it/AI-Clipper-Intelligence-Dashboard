import { apiError, apiSuccess } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/audit-log";
import { getGoogleOAuthSetting, saveGoogleOAuthSetting } from "@/lib/google-oauth-service";
import { serverLogger } from "@/lib/server-logger";

export const runtime = "nodejs";

export async function GET() {
  try {
    const setting = await getGoogleOAuthSetting();
    return apiSuccess("Google OAuth settings loaded.", { setting }, { setting });
  } catch (error) {
    serverLogger.warn("settings.google_oauth.database_fallback", undefined, error);
    const setting = {
      clientIdMasked: process.env.GOOGLE_CLIENT_ID ? "env_***set" : "",
      clientSecretMasked: process.env.GOOGLE_CLIENT_SECRET ? "env_***set" : "",
      redirectUri: process.env.GOOGLE_REDIRECT_URI ?? "",
      status: process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? "CONNECTED" : "NOT_CONNECTED",
      statusLabel: process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? "Connected" : "Provider belum dikonfigurasi"
    };
    return apiSuccess("Database unavailable, using Google OAuth fallback.", { setting }, { setting });
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
