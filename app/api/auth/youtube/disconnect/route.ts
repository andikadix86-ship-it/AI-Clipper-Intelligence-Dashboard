import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!body.socialAccountId) return NextResponse.json({ error: "socialAccountId is required." }, { status: 400 });
  const account = await prisma.socialAccount.update({
    where: { id: body.socialAccountId },
    data: {
      authStatus: "NOT_CONNECTED",
      accessTokenEncrypted: null,
      refreshTokenEncrypted: null,
      tokenExpiresAt: null,
      lastSyncAt: new Date(),
      connectionNotes: "YouTube OAuth disconnected by admin."
    }
  });
  await prisma.oAuthCredential.deleteMany({ where: { socialAccountId: account.id, provider: "YOUTUBE" } });
  return NextResponse.json({ ok: true, authStatus: account.authStatus });
}
