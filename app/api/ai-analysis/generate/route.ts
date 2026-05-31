import { NextResponse } from "next/server";
import { runTextWorkflow } from "@/lib/text-ai-service";
import type { SocialPlatform } from "@/lib/types";

export const runtime = "nodejs";

type AnalysisRequest = {
  niche: string;
  keyword: string;
  hashtag: string;
  platform: SocialPlatform;
  competitionLevel?: string;
  monetizationPotential?: string;
  viralReason?: string;
  opportunity?: string;
  viralityScore?: number;
  source?: string;
  sourceUrl?: string;
  collectedAt?: string;
  confidence?: number;
  isDemo?: boolean;
};

const platformPostingTime: Record<SocialPlatform, string> = {
  TIKTOK: "19:00-21:00 Asia/Jakarta",
  YOUTUBE_SHORTS: "18:30-20:30 Asia/Jakarta",
  INSTAGRAM_REELS: "11:30-13:00 or 19:00-21:00 Asia/Jakarta",
  FACEBOOK_REELS: "20:00-22:00 Asia/Jakarta"
};

export async function POST(request: Request) {
  let body: AnalysisRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.niche || !body.keyword || !body.platform) {
    return NextResponse.json({ error: "Niche, keyword, and platform are required." }, { status: 400 });
  }

  const fypScore = body.viralityScore ?? (body.platform === "TIKTOK" ? 78 : body.platform === "YOUTUBE_SHORTS" ? 74 : 70);
  const provider = await runTextWorkflow({
    operation: "AI_ANALYSIS",
    topic: JSON.stringify({
      niche: body.niche,
      keyword: body.keyword,
      hashtag: body.hashtag,
      platform: body.platform,
      competitionLevel: body.competitionLevel,
      monetizationPotential: body.monetizationPotential,
      viralReason: body.viralReason,
      opportunity: body.opportunity
    }),
    platform: body.platform
  });
  const providerText = provider.result.analysis ?? provider.result.script ?? provider.result.caption ?? provider.result.description;

  return NextResponse.json({
    input: body,
    analysis: {
      viralTitle: `I Tested This ${body.keyword} System So You Do Not Have To`,
      hook: `Stop scrolling. This ${body.niche.toLowerCase()} workflow can save hours this week.`,
      caption: `A practical ${body.keyword} breakdown for creators who want faster output without adding more tools.`,
      hashtag: `${body.hashtag} #AIWorkflow #CreatorTips`,
      cta: "Save this and test it on your next content batch.",
      targetAudience: "Creators, solopreneurs, editors, and small teams building short-form content systems.",
      contentAngle: `Proof-first education angle: show result, then reveal the ${body.keyword} workflow in steps.`,
      editingStyle: "Fast cuts, bold captions, screen proof in first 3 seconds, teal highlight callouts.",
      suggestedDuration: body.platform === "FACEBOOK_REELS" ? 60 : body.platform === "YOUTUBE_SHORTS" ? 45 : 30,
      fypScore,
      postingTimeRecommendation: platformPostingTime[body.platform],
      viralReason: body.viralReason ?? "The topic combines practical payoff with a clear curiosity gap.",
      competition: body.competitionLevel ?? "Medium",
      opportunity: body.opportunity ?? "Package the idea as a repeatable workflow with a clear before-after moment.",
      monetizationPotential: body.monetizationPotential ?? "Medium",
      notes: provider.mode === "REAL" ? providerText : "Dummy AI analysis. No external AI provider was called.",
      providerOutput: providerText,
      providerMode: provider.mode,
      providerWarning: provider.warning,
      generationJobId: provider.jobId
    },
    intelligence: {
      source: body.source ?? "Sample analysis input",
      sourceUrl: body.sourceUrl,
      collectedAt: body.collectedAt ?? new Date().toISOString(),
      confidence: body.confidence ?? 25,
      isDemo: body.isDemo !== false,
      notes: body.isDemo === false ? "Analysis is based on a real public signal." : "Analysis is based on demo/sample intelligence."
    }
  });
}
