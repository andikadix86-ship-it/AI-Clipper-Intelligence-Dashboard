import { encodeSecret, decodeSecret } from "@/lib/google-oauth-service";
import { prisma } from "@/lib/prisma";
import { maskSecret } from "@/lib/security";
import type { OAuthProviderSettingDto } from "@/lib/types";

export type OAuthProvider = "TIKTOK" | "META";

const envMap: Record<OAuthProvider, { clientId: string; clientSecret: string; redirectUri: string }> = {
  TIKTOK: { clientId: "TIKTOK_CLIENT_KEY", clientSecret: "TIKTOK_CLIENT_SECRET", redirectUri: "TIKTOK_REDIRECT_URI" },
  META: { clientId: "META_APP_ID", clientSecret: "META_APP_SECRET", redirectUri: "META_REDIRECT_URI" }
};

export const oauthScopes: Record<OAuthProvider, string[]> = {
  TIKTOK: ["user.info.basic", "video.list"],
  META: ["pages_show_list", "pages_read_engagement", "pages_manage_posts", "instagram_basic", "instagram_content_publish"]
};

function mask(value?: string | null) {
  const decoded = decodeSecret(value);
  if (!decoded) return "";
  return maskSecret(decoded);
}

function envValue(provider: OAuthProvider, key: "clientId" | "clientSecret" | "redirectUri") {
  return process.env[envMap[provider][key]] ?? "";
}

function mapSetting(setting: { id: string; provider: string; clientIdEncrypted: string; clientSecretEncrypted: string; redirectUri: string; status: "CONNECTED" | "NOT_CONNECTED"; lastTestAt: Date | null }): OAuthProviderSettingDto {
  return {
    id: setting.id,
    provider: setting.provider as OAuthProvider,
    clientIdMasked: mask(setting.clientIdEncrypted),
    clientSecretMasked: mask(setting.clientSecretEncrypted),
    redirectUri: setting.redirectUri,
    status: setting.status,
    statusLabel: setting.status === "CONNECTED" ? "Connected" : "Not Connected",
    lastTestAt: setting.lastTestAt?.toISOString()
  };
}

export async function getOAuthProviderSetting(provider: OAuthProvider): Promise<OAuthProviderSettingDto> {
  const setting = await prisma.oAuthProviderSetting.findUnique({ where: { provider } });
  if (!setting) {
    const configured = Boolean(envValue(provider, "clientId") && envValue(provider, "clientSecret") && envValue(provider, "redirectUri"));
    return {
      provider,
      clientIdMasked: envValue(provider, "clientId") ? "env_***set" : "",
      clientSecretMasked: envValue(provider, "clientSecret") ? "env_***set" : "",
      redirectUri: envValue(provider, "redirectUri"),
      status: configured ? "CONNECTED" : "NOT_CONNECTED",
      statusLabel: configured ? "Connected" : "Not Connected"
    };
  }
  return mapSetting(setting);
}

export async function saveOAuthProviderSetting(provider: OAuthProvider, input: { clientId?: string; clientSecret?: string; redirectUri?: string }) {
  const current = await prisma.oAuthProviderSetting.findUnique({ where: { provider } });
  const clientIdEncrypted = input.clientId ? encodeSecret(input.clientId) : current?.clientIdEncrypted ?? "";
  const clientSecretEncrypted = input.clientSecret ? encodeSecret(input.clientSecret) : current?.clientSecretEncrypted ?? "";
  const redirectUri = input.redirectUri ?? current?.redirectUri ?? "";
  const status = clientIdEncrypted && clientSecretEncrypted && redirectUri ? "CONNECTED" : "NOT_CONNECTED";
  const setting = await prisma.oAuthProviderSetting.upsert({
    where: { provider },
    update: { clientIdEncrypted, clientSecretEncrypted, redirectUri, status },
    create: { provider, clientIdEncrypted, clientSecretEncrypted, redirectUri, status }
  });
  return mapSetting(setting);
}

export async function getOAuthRuntime(provider: OAuthProvider) {
  const setting = await prisma.oAuthProviderSetting.findUnique({ where: { provider } });
  const clientId = envValue(provider, "clientId") || decodeSecret(setting?.clientIdEncrypted);
  const clientSecret = envValue(provider, "clientSecret") || decodeSecret(setting?.clientSecretEncrypted);
  const redirectUri = envValue(provider, "redirectUri") || setting?.redirectUri || "";
  return { clientId, clientSecret, redirectUri, configured: Boolean(clientId && clientSecret && redirectUri) };
}

export function buildOAuthUrl(provider: OAuthProvider, input: { clientId: string; redirectUri: string; state: string; socialPlatform?: string }) {
  if (provider === "TIKTOK") {
    const params = new URLSearchParams({
      client_key: input.clientId,
      redirect_uri: input.redirectUri,
      response_type: "code",
      scope: oauthScopes.TIKTOK.join(","),
      state: input.state
    });
    return `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
  }

  const params = new URLSearchParams({
    client_id: input.clientId,
    redirect_uri: input.redirectUri,
    response_type: "code",
    scope: oauthScopes.META.join(","),
    state: input.state
  });
  return `https://www.facebook.com/v22.0/dialog/oauth?${params.toString()}`;
}

export function encodeOAuthState(state: Record<string, unknown>) {
  return Buffer.from(JSON.stringify({ ...state, ts: Date.now() }), "utf8").toString("base64url");
}

export function decodeOAuthState(state: string | null) {
  if (!state) return null;
  try {
    return JSON.parse(Buffer.from(state, "base64url").toString("utf8")) as { socialAccountId?: string; provider?: OAuthProvider };
  } catch {
    return null;
  }
}
