import { NextResponse } from "next/server";
import { refreshSocialOAuth } from "@/lib/social-oauth-flow";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!body.socialAccountId) return NextResponse.json({ error: "socialAccountId is required." }, { status: 400 });
  try {
    const account = await refreshSocialOAuth(body.socialAccountId, "META");
    return NextResponse.json({ ok: true, authStatus: account.authStatus, permissionStatus: account.permissionStatus, tokenExpiresAt: account.tokenExpiresAt });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Meta refresh failed." }, { status: 400 });
  }
}
