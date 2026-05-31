import { NextResponse } from "next/server";
import { validateSocialOAuth } from "@/lib/social-oauth-flow";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!body.socialAccountId) return NextResponse.json({ error: "socialAccountId is required." }, { status: 400 });
  try {
    const account = await validateSocialOAuth(body.socialAccountId, "META");
    return NextResponse.json({ ok: account.authStatus === "CONNECTED", authStatus: account.authStatus, permissionStatus: account.permissionStatus, lastSyncAt: account.lastSyncAt });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Meta validation failed." }, { status: 400 });
  }
}
