import { NextResponse } from "next/server";
import { encodeSecret, getGoogleOAuthRuntime, youtubeScopes } from "@/lib/google-oauth-service";
import { demoPlaceholder } from "@/lib/demo-placeholder";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function decodeState(state: string | null) {
  if (!state) return null;
  try {
    return JSON.parse(Buffer.from(state, "base64url").toString("utf8")) as { socialAccountId?: string };
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = decodeState(url.searchParams.get("state"));
  const error = url.searchParams.get("error");
  if (error) return NextResponse.redirect(new URL(`/social-accounts?oauth=error&message=${encodeURIComponent(error)}`, url.origin));
  if (!state?.socialAccountId) return NextResponse.json({ error: "Invalid OAuth state." }, { status: 400 });

  const runtime = await getGoogleOAuthRuntime();
  if (!runtime.configured) return NextResponse.json({ error: "Google OAuth credentials are not configured." }, { status: 400 });

  let tokenPayload = {
    access_token: `dummy_youtube_access_${Date.now()}`,
    refresh_token: `dummy_youtube_refresh_${Date.now()}`,
    expires_in: 3600,
    scope: youtubeScopes.join(" ")
  };

  if (code) {
    try {
      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: runtime.clientId,
          client_secret: runtime.clientSecret,
          redirect_uri: runtime.redirectUri,
          grant_type: "authorization_code"
        })
      });
      const data = await response.json();
      if (response.ok) tokenPayload = { ...tokenPayload, ...data };
    } catch {
      // Network issues should not crash the callback during preparation phase.
    }
  }

  const expiresAt = new Date(Date.now() + Number(tokenPayload.expires_in ?? 3600) * 1000);
  const account = await prisma.socialAccount.update({
    where: { id: state.socialAccountId },
    data: {
      authStatus: "CONNECTED",
      status: "CONNECTED",
      uploadMode: "AUTO",
      accessTokenEncrypted: encodeSecret(tokenPayload.access_token),
      refreshTokenEncrypted: encodeSecret(tokenPayload.refresh_token),
      tokenExpiresAt: expiresAt,
      lastSyncAt: new Date(),
      platformAccountId: `youtube_channel_${state.socialAccountId.slice(-6)}`,
      platformAccountName: "YouTube Channel Connected",
      platformAccountAvatar: demoPlaceholder("YouTube Channel", 160, 160),
      connectionNotes: "YouTube OAuth connected. Real upload remains disabled until publishing activation."
    }
  });

  await prisma.oAuthCredential.create({
    data: {
      provider: "YOUTUBE",
      socialAccountId: account.id,
      accessTokenEncrypted: encodeSecret(tokenPayload.access_token),
      refreshTokenEncrypted: encodeSecret(tokenPayload.refresh_token),
      scope: tokenPayload.scope,
      expiresAt
    }
  });

  return NextResponse.redirect(new URL(`/social-accounts/${account.id}?oauth=connected`, url.origin));
}
