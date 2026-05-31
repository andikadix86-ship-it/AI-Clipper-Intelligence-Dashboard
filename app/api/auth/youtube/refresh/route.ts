import { NextResponse } from "next/server";
import { encodeSecret } from "@/lib/google-oauth-service";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!body.socialAccountId) return NextResponse.json({ error: "socialAccountId is required." }, { status: 400 });
  const account = await prisma.socialAccount.findUnique({ where: { id: body.socialAccountId } });
  if (!account) return NextResponse.json({ error: "Social account not found." }, { status: 404 });
  if (!account.refreshTokenEncrypted) return NextResponse.json({ error: "Refresh token is not available. Reconnect YouTube first." }, { status: 400 });
  const expiresAt = new Date(Date.now() + 3600 * 1000);
  const updated = await prisma.socialAccount.update({
    where: { id: account.id },
    data: {
      authStatus: "CONNECTED",
      accessTokenEncrypted: encodeSecret(`dummy_refreshed_youtube_access_${Date.now()}`),
      tokenExpiresAt: expiresAt,
      lastSyncAt: new Date(),
      connectionNotes: "YouTube token refreshed in dummy-safe mode."
    }
  });
  return NextResponse.json({ ok: true, authStatus: updated.authStatus, tokenExpiresAt: updated.tokenExpiresAt, lastSyncAt: updated.lastSyncAt });
}
