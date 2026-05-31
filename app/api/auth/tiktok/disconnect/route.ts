import { NextResponse } from "next/server";
import { disconnectSocialOAuth } from "@/lib/social-oauth-flow";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!body.socialAccountId) return NextResponse.json({ error: "socialAccountId is required." }, { status: 400 });
  try {
    const account = await disconnectSocialOAuth(body.socialAccountId, "TIKTOK");
    return NextResponse.json({ ok: true, authStatus: account.authStatus, permissionStatus: account.permissionStatus });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "TikTok disconnect failed." }, { status: 400 });
  }
}
