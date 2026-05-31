import { apiError, apiSuccess } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/audit-log";
import { getOAuthProviderSetting, saveOAuthProviderSetting, type OAuthProvider } from "@/lib/oauth-provider-service";

export const runtime = "nodejs";

const providers: OAuthProvider[] = ["TIKTOK", "META"];

export async function GET() {
  try {
    const settings = await Promise.all(providers.map((provider) => getOAuthProviderSetting(provider)));
    return apiSuccess("OAuth provider settings loaded.", { settings }, { settings });
  } catch (error) {
    return apiError("OAuth provider settings could not be loaded.", 500, error);
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!providers.includes(body.provider)) return apiError("Provider must be TIKTOK or META.", 400);
  try {
    const setting = await saveOAuthProviderSetting(body.provider, { clientId: body.clientId, clientSecret: body.clientSecret, redirectUri: body.redirectUri });
    await writeAuditLog({
      action: "SAVE_OAUTH_PROVIDER_SETTINGS",
      entityType: "OAuthProviderSetting",
      entityId: setting.id,
      message: `${body.provider} OAuth settings saved.`,
      metadata: { provider: body.provider, hasClientId: Boolean(body.clientId), hasClientSecret: Boolean(body.clientSecret), redirectUri: body.redirectUri }
    });
    return apiSuccess("OAuth provider settings saved.", { setting }, { setting });
  } catch (error) {
    return apiError("OAuth provider settings could not be saved.", 500, error);
  }
}
