import { NextResponse } from "next/server";
import { buildYouTubeOAuthUrl, getGoogleOAuthRuntime } from "@/lib/google-oauth-service";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const socialAccountId = searchParams.get("socialAccountId");
  if (!socialAccountId) return NextResponse.json({ error: "socialAccountId is required." }, { status: 400 });

  const account = await prisma.socialAccount.findUnique({ where: { id: socialAccountId } });
  if (!account) return NextResponse.json({ error: "Social account not found." }, { status: 404 });
  if (account.socialPlatform !== "YOUTUBE_SHORTS") return NextResponse.json({ error: "Only YouTube Shorts accounts can use YouTube OAuth." }, { status: 400 });

  const runtime = await getGoogleOAuthRuntime();
  if (!runtime.configured) {
    return NextResponse.json({ error: "Google OAuth credentials are not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI in Settings or .env." }, { status: 400 });
  }

  const state = Buffer.from(JSON.stringify({ socialAccountId, ts: Date.now() }), "utf8").toString("base64url");
  return NextResponse.redirect(buildYouTubeOAuthUrl({ clientId: runtime.clientId, redirectUri: runtime.redirectUri, state }));
}
