import { NextResponse } from "next/server";
import { getLibraryItem } from "@/lib/library-service";
import { prisma } from "@/lib/prisma";
import { demoPlaceholder } from "@/lib/demo-placeholder";
import type { SocialPlatform } from "@/lib/types";

export const runtime = "nodejs";

type SaveSimilarRequest = {
  projectId?: string;
  socialAccountId?: string;
  linkedFromContentId?: string;
  title: string;
  hook: string;
  caption: string;
  hashtag: string;
  cta: string;
  contentAngle: string;
  suggestedDuration: number;
  targetPlatform: SocialPlatform;
  viralScorePrediction: number;
  notes?: string;
};

export async function POST(request: Request) {
  let body: SaveSimilarRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.title || !body.hook || !body.targetPlatform) {
    return NextResponse.json({ error: "Title, hook, and target platform are required." }, { status: 400 });
  }

  try {
    const source = body.linkedFromContentId
      ? await prisma.contentItem.findUnique({ where: { id: body.linkedFromContentId } })
      : null;

    const item = await prisma.contentItem.create({
      data: {
        projectId: body.projectId || source?.projectId || undefined,
        socialAccountId: body.socialAccountId || source?.socialAccountId || undefined,
        type: "CLIP_PLAN",
        title: body.title,
        description: body.contentAngle,
        caption: body.caption,
        thumbnail: demoPlaceholder("Similar Content"),
        status: "DRAFT",
        workflowStatus: "DRAFT",
        sourceType: "SIMILAR_CONTENT",
        linkedFromContentId: body.linkedFromContentId,
        viralScorePrediction: Math.round(body.viralScorePrediction),
        contentAngle: body.contentAngle,
        trendKeyword: source?.trendKeyword ?? "",
        trendPlatform: body.targetPlatform,
        hook: body.hook,
        cta: body.cta,
        targetAudience: source?.targetAudience ?? "Creators and short-form content operators",
        editingStyle: source?.editingStyle ?? "Fast proof-first edit with strong captions",
        suggestedDuration: body.suggestedDuration,
        notes: body.notes ?? "",
        platform: body.targetPlatform,
        tags: body.hashtag.split(/\s+/).map((tag) => tag.replace(/^#/, "").trim()).filter(Boolean)
      }
    });

    const mapped = await getLibraryItem(item.id);
    return NextResponse.json({ item: mapped ?? item });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Similar content could not be saved." },
      { status: 500 }
    );
  }
}
