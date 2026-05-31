import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!body.socialAccountId) return NextResponse.json({ error: "socialAccountId is required." }, { status: 400 });
  const account = await prisma.socialAccount.findUnique({ where: { id: body.socialAccountId } });
  if (!account) return NextResponse.json({ error: "Social account not found." }, { status: 404 });
  const expired = account.tokenExpiresAt ? account.tokenExpiresAt.getTime() < Date.now() : false;
  const authStatus = account.accessTokenEncrypted ? (expired ? "EXPIRED" : "CONNECTED") : "NOT_CONNECTED";
  const updated = await prisma.socialAccount.update({
    where: { id: account.id },
    data: { authStatus, lastSyncAt: new Date(), connectionNotes: authStatus === "CONNECTED" ? "YouTube token placeholder is valid." : "YouTube token missing or expired." }
  });
  return NextResponse.json({ ok: authStatus === "CONNECTED", authStatus, tokenExpiresAt: updated.tokenExpiresAt, lastSyncAt: updated.lastSyncAt });
}
