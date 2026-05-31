import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encodeSecret } from "@/lib/security";
import { mapSocialAccount } from "@/lib/social-account-service";
import type { AuthStatus, PublishMode, SocialConnectionStatus, SocialPlatform, UploadMethod } from "@/lib/types";

export const runtime = "nodejs";

type SocialAccountPatch = {
  projectId?: string;
  platform?: SocialPlatform;
  name?: string;
  handle?: string;
  niche?: string;
  status?: SocialConnectionStatus;
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
  isActive?: boolean;
};

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const account = await prisma.socialAccount.findUnique({
      where: { id: params.id },
      include: {
        project: true,
        schedules: { include: { contentItem: true }, orderBy: { scheduledAt: "desc" } },
        analytics: { orderBy: { capturedAt: "desc" }, take: 12 },
        _count: { select: { schedules: true } }
      }
    });
    if (!account) return NextResponse.json({ error: "Social account not found." }, { status: 404 });

    const contentCount = account.projectId ? await prisma.contentItem.count({ where: { projectId: account.projectId } }) : 0;
    return NextResponse.json({
      account: mapSocialAccount(account, new Map([[account.projectId, contentCount]])),
      schedules: account.schedules.map((schedule) => ({
        id: schedule.id,
        title: schedule.contentItem?.title ?? "Untitled content",
        status: schedule.status,
        date: schedule.scheduledAt?.toISOString() ?? schedule.startDate.toISOString(),
        platform: schedule.socialPlatform ?? account.socialPlatform ?? "YOUTUBE_SHORTS"
      })),
      analytics: account.analytics
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Social account could not be loaded." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  let body: SocialAccountPatch;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const account = await prisma.socialAccount.update({
      where: { id: params.id },
      data: {
        projectId: body.projectId,
        socialPlatform: body.platform,
        name: body.name,
        handle: body.handle,
        niche: body.niche,
        status: body.status,
        uploadMethod: body.uploadMethod,
        uploadMode: body.uploadMode,
        authStatus: body.authStatus,
        accessTokenEncrypted: body.accessToken ? encodeSecret(body.accessToken) : undefined,
        refreshTokenEncrypted: body.refreshToken ? encodeSecret(body.refreshToken) : undefined,
        tokenExpiresAt: body.tokenExpiresAt ? new Date(body.tokenExpiresAt) : undefined,
        connectionNotes: body.connectionNotes,
        permissionStatus: body.permissionStatus,
        loginNotes: body.loginNotes,
        notes: body.notes,
        isActive: body.isActive,
        disabledAt: body.isActive === false || body.status === "DISABLED" ? new Date() : body.isActive === true ? null : undefined,
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
      { error: error instanceof Error ? error.message : "Social account could not be updated in Supabase." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.socialAccount.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Social account could not be deleted from Supabase." },
      { status: 500 }
    );
  }
}
