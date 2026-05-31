import { NextResponse } from "next/server";
import { getLibraryItem } from "@/lib/library-service";
import { prisma } from "@/lib/prisma";
import { demoPlaceholder } from "@/lib/demo-placeholder";
import type { SocialPlatform } from "@/lib/types";

export const runtime = "nodejs";

type SaveAnalysisRequest = {
  projectId: string;
  socialAccountId?: string;
  contentType: "IDEA" | "SCRIPT" | "CLIP_PLAN";
  platform: SocialPlatform;
  niche: string;
  keyword: string;
  hashtag: string;
  title: string;
  hook: string;
  caption: string;
  cta: string;
  targetAudience: string;
  contentAngle: string;
  editingStyle: string;
  suggestedDuration: number;
  fypScore: number;
  notes?: string;
};

export async function POST(request: Request) {
  let body: SaveAnalysisRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.projectId || !body.title || !body.keyword || !body.contentType) {
    return NextResponse.json({ error: "Project, title, keyword, and content type are required." }, { status: 400 });
  }

  try {
    const item = await prisma.contentItem.create({
      data: {
        projectId: body.projectId,
        socialAccountId: body.socialAccountId || undefined,
        type: body.contentType,
        title: body.title,
        description: body.contentAngle,
        caption: body.caption,
        thumbnail: demoPlaceholder("Analysis Draft"),
        status: "DRAFT",
        workflowStatus: "DRAFT",
        sourceType: "TRENDING_AI_ANALYSIS",
        contentAngle: body.contentAngle,
        trendKeyword: body.keyword,
        trendPlatform: body.platform,
        fypScore: body.fypScore,
        hook: body.hook,
        cta: body.cta,
        targetAudience: body.targetAudience,
        editingStyle: body.editingStyle,
        suggestedDuration: body.suggestedDuration,
        notes: body.notes ?? "",
        platform: body.platform,
        tags: body.hashtag.split(/\s+/).map((tag) => tag.replace(/^#/, "").trim()).filter(Boolean)
      }
    });

    const mapped = await getLibraryItem(item.id);
    return NextResponse.json({ item: mapped ?? item });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis content could not be saved to Supabase." },
      { status: 500 }
    );
  }
}
