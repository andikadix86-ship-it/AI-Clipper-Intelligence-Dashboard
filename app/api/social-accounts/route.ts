import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encodeSecret } from "@/lib/security";
import { mapSocialAccount } from "@/lib/social-account-service";
import type { AuthStatus, PublishMode, SocialConnectionStatus, SocialPlatform, UploadMethod } from "@/lib/types";

export const runtime = "nodejs";

type SocialAccountRequest = {
  id?: string;
  projectId?: string;
  platform: SocialPlatform;
  name: string;
  handle: string;
  niche?: string;
  status: SocialConnectionStatus;
  uploadMethod?: UploadMethod;
  uploadMode?: PublishMode;
  authStatus?: AuthStatus;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
  connectionNotes?: string;
  permissionStatus?: string;
  loginNotes?: string;
  notes?: string;
  isActive: boolean;
};

export async function GET() {
  try {
    const [accounts, contentByProject] = await Promise.all([
      prisma.socialAccount.findMany({
        orderBy: { updatedAt: "desc" },
        include: {
          project: true,
          schedules: { select: { status: true } },
          _count: { select: { schedules: true } }
        }
      }),
      prisma.contentItem.groupBy({ by: ["projectId"], _count: { _all: true } })
    ]);
    const countMap = new Map(contentByProject.map((item) => [item.projectId, item._count._all]));
    return NextResponse.json({ accounts: accounts.map((account) => mapSocialAccount(account, countMap)) });
  } catch (error) {
    console.error("[social-accounts] Database unavailable while loading social accounts.", error);
    return NextResponse.json({ accounts: [], source: "fallback", message: "Database unavailable, using empty social account list." });
  }
}

export async function POST(request: Request) {
  let body: SocialAccountRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.name || !body.handle || !body.platform) {
    return NextResponse.json({ error: "Name, handle, and platform are required." }, { status: 400 });
  }

  try {
    const account = await prisma.socialAccount.create({
      data: {
        projectId: body.projectId || undefined,
        socialPlatform: body.platform,
        name: body.name,
        handle: body.handle,
        niche: body.niche,
        status: body.status,
        uploadMethod: body.uploadMethod ?? "MANUAL",
        uploadMode: body.uploadMode ?? "MANUAL",
        authStatus: body.authStatus ?? "NOT_CONNECTED",
        accessTokenEncrypted: body.accessToken ? encodeSecret(body.accessToken) : undefined,
        refreshTokenEncrypted: body.refreshToken ? encodeSecret(body.refreshToken) : undefined,
        tokenExpiresAt: body.tokenExpiresAt ? new Date(body.tokenExpiresAt) : undefined,
        connectionNotes: body.connectionNotes ?? "",
        permissionStatus: body.permissionStatus ?? "NOT_REQUESTED",
        loginNotes: body.loginNotes,
        notes: body.notes ?? "",
        isActive: body.status === "DISABLED" ? false : body.isActive,
        disabledAt: body.status === "DISABLED" || !body.isActive ? new Date() : undefined,
        lastActivityAt: new Date()
      },
      include: {
        project: true,
        schedules: { select: { status: true } },
        _count: { select: { schedules: true } }
      }
    });
    return NextResponse.json({ account: mapSocialAccount(account) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Social account could not be saved to Supabase." },
      { status: 500 }
    );
  }
}
