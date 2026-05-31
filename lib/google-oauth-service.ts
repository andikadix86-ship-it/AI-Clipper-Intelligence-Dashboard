import { prisma } from "@/lib/prisma";
import { decodeSecret, encodeSecret, maskSecret } from "@/lib/security";
import type { GoogleOAuthSettingDto } from "@/lib/types";

export const youtubeScopes = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.readonly"
];

export { decodeSecret, encodeSecret };

function mask(value?: string | null) {
  const decoded = decodeSecret(value);
  if (!decoded) return "";
  return maskSecret(decoded);
}

function mapSetting(setting: { id: string; clientIdEncrypted: string; clientSecretEncrypted: string; redirectUri: string; status: "CONNECTED" | "NOT_CONNECTED"; lastTestAt: Date | null }): GoogleOAuthSettingDto {
  return {
    id: setting.id,
    clientIdMasked: mask(setting.clientIdEncrypted),
    clientSecretMasked: mask(setting.clientSecretEncrypted),
    redirectUri: setting.redirectUri,
    status: setting.status,
    statusLabel: setting.status === "CONNECTED" ? "Connected" : "Not Connected",
    lastTestAt: setting.lastTestAt?.toISOString()
  };
}

export async function getGoogleOAuthSetting(): Promise<GoogleOAuthSettingDto> {
  const setting = await prisma.googleOAuthSetting.findFirst({ orderBy: { updatedAt: "desc" } });
  if (!setting) {
    return {
      clientIdMasked: process.env.GOOGLE_CLIENT_ID ? "env_***set" : "",
      clientSecretMasked: process.env.GOOGLE_CLIENT_SECRET ? "env_***set" : "",
      redirectUri: process.env.GOOGLE_REDIRECT_URI ?? "",
      status: process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? "CONNECTED" : "NOT_CONNECTED",
      statusLabel: process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? "Connected" : "Not Connected"
    };
  }
  return mapSetting(setting);
}

export async function saveGoogleOAuthSetting(input: { clientId?: string; clientSecret?: string; redirectUri?: string }) {
  const current = await prisma.googleOAuthSetting.findFirst({ orderBy: { updatedAt: "desc" } });
  const clientIdEncrypted = input.clientId ? encodeSecret(input.clientId) : current?.clientIdEncrypted ?? "";
  const clientSecretEncrypted = input.clientSecret ? encodeSecret(input.clientSecret) : current?.clientSecretEncrypted ?? "";
  const redirectUri = input.redirectUri ?? current?.redirectUri ?? "";
  const status = clientIdEncrypted && clientSecretEncrypted && redirectUri ? "CONNECTED" : "NOT_CONNECTED";
  const setting = current
    ? await prisma.googleOAuthSetting.update({ where: { id: current.id }, data: { clientIdEncrypted, clientSecretEncrypted, redirectUri, status } })
    : await prisma.googleOAuthSetting.create({ data: { clientIdEncrypted, clientSecretEncrypted, redirectUri, status } });
  return mapSetting(setting);
}

export async function getGoogleOAuthRuntime() {
  const setting = await prisma.googleOAuthSetting.findFirst({ orderBy: { updatedAt: "desc" } });
  const clientId = process.env.GOOGLE_CLIENT_ID || decodeSecret(setting?.clientIdEncrypted);
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || decodeSecret(setting?.clientSecretEncrypted);
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || setting?.redirectUri || "";
  return {
    clientId,
    clientSecret,
    redirectUri,
    configured: Boolean(clientId && clientSecret && redirectUri)
  };
}

export function buildYouTubeOAuthUrl(input: { clientId: string; redirectUri: string; state: string }) {
  const params = new URLSearchParams({
    client_id: input.clientId,
    redirect_uri: input.redirectUri,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: youtubeScopes.join(" "),
    state: input.state
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}
