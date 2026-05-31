import { NextResponse } from "next/server";
import { fallbackLibraryItems } from "@/lib/content-library";
import { getLibraryItem } from "@/lib/library-service";
import { prisma } from "@/lib/prisma";
import type { ContentStatus, LibraryAssetStatus, SocialPlatform } from "@/lib/types";

export const runtime = "nodejs";

type UpdateRequest = {
  title?: string;
  description?: string;
  caption?: string;
  tags?: string[];
  status?: ContentStatus;
  platform?: SocialPlatform;
  assetStatus?: LibraryAssetStatus;
  versionNotes?: string;
};

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const item = await getLibraryItem(params.id);
    if (!item) return NextResponse.json({ error: "Content item not found." }, { status: 404 });
    return NextResponse.json({ item });
  } catch (error) {
    const item = fallbackLibraryItems.find((fallback) => fallback.id === params.id);
    if (item) {
      return NextResponse.json({
        item,
        warning: error instanceof Error ? error.message : "Using fallback content item."
      });
    }
    return NextResponse.json({ error: "Content item not found." }, { status: 404 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  let body: UpdateRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const updated = await prisma.contentItem.update({
      where: { id: params.id },
      data: {
        title: body.title,
        description: body.description,
        caption: body.caption,
        tags: body.tags,
        status: body.status,
        workflowStatus: body.status,
        platform: body.platform,
        assetStatus: body.assetStatus,
        versionNotes: body.versionNotes
      }
    });

    const item = await getLibraryItem(updated.id);
    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Content item could not be saved." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.contentItem.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Content item could not be deleted." },
      { status: 500 }
    );
  }
}
