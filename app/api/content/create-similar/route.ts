import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runTextWorkflow } from "@/lib/text-ai-service";

export const runtime = "nodejs";

type CreateSimilarRequest = {
  contentItemId?: string;
  recommendationTitle?: string;
};

export async function POST(request: Request) {
  let body: CreateSimilarRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const content = body.contentItemId
      ? await prisma.contentItem.findUnique({
          where: { id: body.contentItemId },
          include: {
            project: true,
            socialAccount: true,
            analytics: { orderBy: { recordedAt: "desc" }, take: 1 }
          }
        })
      : null;

    const title = content?.title ?? body.recommendationTitle ?? "High performing creator workflow";
    const platform = content?.platform ?? content?.trendPlatform ?? "YOUTUBE_SHORTS";
    const analytics = content?.analytics[0];
    const viralReason = analytics
      ? `${analytics.views} views, ${analytics.engagementRate}% engagement, ${analytics.saves} saves, and ${analytics.shares} shares indicate this angle has repeat potential.`
      : "Dummy insight: this content pattern has strong proof-first structure and clear educational value.";

    const baseKeyword = content?.trendKeyword || title.split(" ").slice(0, 4).join(" ");
    const provider = await runTextWorkflow({
      operation: "SIMILAR_CONTENT",
      topic: JSON.stringify({
        title,
        platform,
        project: content?.project?.name,
        socialAccount: content?.socialAccount?.name,
        analytics,
        viralReason
      }),
      platform,
      projectId: content?.projectId
    });
    const providerText = provider.result.script ?? provider.result.caption ?? provider.result.description;
    const ideas = Array.from({ length: 5 }, (_, index) => {
      const n = index + 1;
      return {
        id: `similar_${Date.now()}_${n}`,
        title: `${baseKeyword}: variation ${n} with a stronger payoff`,
        hook: n % 2 === 0
          ? `I rebuilt this ${baseKeyword} workflow and the result surprised me.`
          : `Stop scrolling. This ${baseKeyword} idea can save you hours this week.`,
        caption: `A practical follow-up inspired by ${title}. Save this before your next content batch.`,
        hashtag: "#AIWorkflow #CreatorTips #Shorts",
        cta: n % 2 === 0 ? "Comment 'workflow' if you want the checklist." : "Save this and test it tonight.",
        contentAngle: n % 2 === 0
          ? "Before-after comparison with proof in the first 3 seconds."
          : "Step-by-step educational breakdown with a direct creator payoff.",
        suggestedDuration: n <= 2 ? 30 : n === 3 ? 45 : 60,
        targetPlatform: platform,
        viralScorePrediction: Math.min(98, 78 + n * 3 + (analytics?.engagementRate ?? 6)),
        notes: provider.mode === "REAL" && n === 1 ? providerText : `Generated from source content: ${title}`
      };
    });

    return NextResponse.json({
      reference: {
        id: content?.id,
        title,
        platform,
        projectId: content?.projectId,
        project: content?.project?.name ?? "Unassigned",
        socialAccountId: content?.socialAccountId,
        socialAccount: content?.socialAccount?.name ?? "Unassigned",
        views: analytics?.views ?? 0,
        engagementRate: analytics?.engagementRate ?? 0,
        viralReason
      },
      ideas,
      provider: {
        mode: provider.mode,
        warning: provider.warning,
        generationJobId: provider.jobId,
        output: providerText
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Similar content ideas could not be generated." },
      { status: 500 }
    );
  }
}
