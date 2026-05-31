import { encodeSecret } from "@/lib/google-oauth-service";
import { buildOAuthUrl, decodeOAuthState, encodeOAuthState, getOAuthRuntime, oauthScopes, type OAuthProvider } from "@/lib/oauth-provider-service";
import { prisma } from "@/lib/prisma";
import { demoPlaceholder } from "@/lib/demo-placeholder";
import type { SocialPlatform } from "@/lib/types";

export function providerForPlatform(platform?: SocialPlatform | null): OAuthProvider | null {
  if (platform === "TIKTOK") return "TIKTOK";
  if (platform === "INSTAGRAM_REELS" || platform === "FACEBOOK_REELS") return "META";
  return null;
}

export async function startSocialOAuth(request: Request, provider: OAuthProvider) {
  const url = new URL(request.url);
  const socialAccountId = url.searchParams.get("socialAccountId");
  if (!socialAccountId) return Response.json({ error: "socialAccountId is required." }, { status: 400 });
  const account = await prisma.socialAccount.findUnique({ where: { id: socialAccountId } });
  if (!account) return Response.json({ error: "Social account not found." }, { status: 404 });
  if (providerForPlatform(account.socialPlatform) !== provider) return Response.json({ error: `${provider} OAuth is not valid for this account platform.` }, { status: 400 });
  const runtime = await getOAuthRuntime(provider);
  if (!runtime.configured) return Response.json({ error: `${provider} OAuth credentials not configured. Manual upload remains available.` }, { status: 400 });
  const state = encodeOAuthState({ socialAccountId, provider });
  return Response.redirect(buildOAuthUrl(provider, { clientId: runtime.clientId, redirectUri: runtime.redirectUri, state, socialPlatform: account.socialPlatform ?? undefined }));
}

export async function callbackSocialOAuth(request: Request, provider: OAuthProvider) {
  const url = new URL(request.url);
  const state = decodeOAuthState(url.searchParams.get("state"));
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  if (error) return Response.redirect(new URL(`/social-accounts?oauth=error&message=${encodeURIComponent(error)}`, url.origin));
  if (!state?.socialAccountId) return Response.json({ error: "Invalid OAuth state." }, { status: 400 });
  const account = await prisma.socialAccount.findUnique({ where: { id: state.socialAccountId } });
  if (!account) return Response.json({ error: "Social account not found." }, { status: 404 });
  const runtime = await getOAuthRuntime(provider);
  if (!runtime.configured) return Response.json({ error: `${provider} OAuth credentials not configured.` }, { status: 400 });

  let tokenPayload = {
    access_token: `dummy_${provider.toLowerCase()}_access_${Date.now()}`,
    refresh_token: `dummy_${provider.toLowerCase()}_refresh_${Date.now()}`,
    expires_in: 3600,
    scope: oauthScopes[provider].join(",")
  };

  if (code) {
    try {
      const endpoint = provider === "TIKTOK" ? "https://open.tiktokapis.com/v2/oauth/token/" : "https://graph.facebook.com/v22.0/oauth/access_token";
      const body = provider === "TIKTOK"
        ? new URLSearchParams({ client_key: runtime.clientId, client_secret: runtime.clientSecret, code, grant_type: "authorization_code", redirect_uri: runtime.redirectUri })
        : new URLSearchParams({ client_id: runtime.clientId, client_secret: runtime.clientSecret, code, redirect_uri: runtime.redirectUri });
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
      const data = await response.json().catch(() => ({}));
      if (response.ok) tokenPayload = { ...tokenPayload, ...(data.data ?? data) };
    } catch {
      // Keep callback safe during preparation phase.
    }
  }

  const expiresAt = new Date(Date.now() + Number(tokenPayload.expires_in ?? 3600) * 1000);
  const platformLabel = account.socialPlatform === "TIKTOK" ? "TikTok" : account.socialPlatform === "INSTAGRAM_REELS" ? "Instagram" : "Facebook";
  const updated = await prisma.socialAccount.update({
    where: { id: account.id },
    data: {
      authStatus: "CONNECTED",
      status: "CONNECTED",
      uploadMode: "AUTO",
      accessTokenEncrypted: encodeSecret(tokenPayload.access_token),
      refreshTokenEncrypted: tokenPayload.refresh_token ? encodeSecret(tokenPayload.refresh_token) : account.refreshTokenEncrypted,
      tokenExpiresAt: expiresAt,
      lastSyncAt: new Date(),
      platformAccountId: `${provider.toLowerCase()}_${account.id.slice(-8)}`,
      platformAccountName: `${platformLabel} Account Connected`,
      platformAccountAvatar: demoPlaceholder(`${provider} Account`, 160, 160),
      permissionStatus: "GRANTED",
      connectionNotes: `${provider} OAuth connected. Real upload remains disabled for this platform.`
    }
  });

  await prisma.oAuthCredential.create({
    data: {
      provider,
      socialAccountId: updated.id,
      accessTokenEncrypted: encodeSecret(tokenPayload.access_token),
      refreshTokenEncrypted: tokenPayload.refresh_token ? encodeSecret(tokenPayload.refresh_token) : undefined,
      scope: tokenPayload.scope,
      expiresAt
    }
  });

  return Response.redirect(new URL(`/social-accounts/${updated.id}?oauth=connected`, url.origin));
}

export async function validateSocialOAuth(socialAccountId: string, provider: OAuthProvider) {
  const account = await prisma.socialAccount.findUnique({ where: { id: socialAccountId } });
  if (!account) throw new Error("Social account not found.");
  if (providerForPlatform(account.socialPlatform) !== provider) throw new Error(`${provider} OAuth is not valid for this account platform.`);
  const expired = account.tokenExpiresAt ? account.tokenExpiresAt.getTime() < Date.now() : false;
  const authStatus = account.accessTokenEncrypted ? (expired ? "EXPIRED" : "CONNECTED") : "NOT_CONNECTED";
  return prisma.socialAccount.update({
    where: { id: account.id },
    data: {
      authStatus,
      permissionStatus: authStatus === "CONNECTED" ? account.permissionStatus || "GRANTED" : "MISSING",
      lastSyncAt: new Date(),
      connectionNotes: authStatus === "CONNECTED" ? `${provider} token placeholder is valid.` : `${provider} token missing or expired.`
    }
  });
}

export async function disconnectSocialOAuth(socialAccountId: string, provider: OAuthProvider) {
  const account = await prisma.socialAccount.update({
    where: { id: socialAccountId },
    data: {
      authStatus: "NOT_CONNECTED",
      accessTokenEncrypted: null,
      refreshTokenEncrypted: null,
      tokenExpiresAt: null,
      lastSyncAt: new Date(),
      permissionStatus: "REVOKED",
      connectionNotes: `${provider} OAuth disconnected by admin.`
    }
  });
  await prisma.oAuthCredential.deleteMany({ where: { socialAccountId, provider } });
  return account;
}

export async function refreshSocialOAuth(socialAccountId: string, provider: OAuthProvider) {
  const account = await prisma.socialAccount.findUnique({ where: { id: socialAccountId } });
  if (!account) throw new Error("Social account not found.");
  if (!account.refreshTokenEncrypted) throw new Error("Refresh token is not available. Reconnect account first.");
  return prisma.socialAccount.update({
    where: { id: account.id },
    data: {
      authStatus: "CONNECTED",
      accessTokenEncrypted: encodeSecret(`dummy_refreshed_${provider.toLowerCase()}_${Date.now()}`),
      tokenExpiresAt: new Date(Date.now() + 3600 * 1000),
      lastSyncAt: new Date(),
      permissionStatus: "GRANTED",
      connectionNotes: `${provider} token refreshed in dummy-safe mode.`
    }
  });
}
