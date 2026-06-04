import { NextResponse } from "next/server";
import { runTextWorkflow } from "@/lib/text-ai-service";
import type { AIProviderName, ProviderMode, SocialPlatform } from "@/lib/types";
import { buildCoreIntelligence } from "@/lib/intelligence/core-engine";
import { ingestKnowledge } from "@/lib/intelligence/knowledge-base";
import { platformCta } from "@/lib/content-creator/content-creator-engine";
import { prisma } from "@/lib/prisma";
import { withTimeout } from "@/lib/db-timeout";
import { sanitizeErrorMessage } from "@/lib/security";
import { serverLogger } from "@/lib/server-logger";

export const runtime = "nodejs";

type AnalysisRequest = {
  niche: string;
  keyword: string;
  hashtag?: string;
  platform: SocialPlatform;
  videoSourceId?: string;
  projectId?: string;
  provider?: AIProviderName;
  mode?: ProviderMode;
  affiliate?: boolean;
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

const sourcePlatform = {
  YOUTUBE: "YOUTUBE_SHORTS",
  TIKTOK: "TIKTOK",
  INSTAGRAM: "INSTAGRAM_REELS"
} as const;

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

  try {
    const source = body.videoSourceId
      ? await withTimeout(prisma.videoSource.findUnique({ where: { id: body.videoSourceId } }), 5000)
      : null;
    if (body.videoSourceId && !source) {
      return NextResponse.json({ error: "Video source tidak ditemukan. Upload ulang video sebelum menjalankan analisis." }, { status: 404 });
    }
    const platform = source ? sourcePlatform[source.platform] : body.platform;
    const keyword = source?.title || body.keyword;
    const hashtag = body.hashtag?.trim() || "#FVNAIStudio";
    const mode = body.mode ?? "DUMMY";
    const fypScore = body.viralityScore ?? (platform === "TIKTOK" ? 78 : platform === "YOUTUBE_SHORTS" ? 74 : 70);
    const provider = await runTextWorkflow({
      operation: "AI_ANALYSIS",
      topic: JSON.stringify({
        niche: body.niche,
        keyword,
        hashtag,
        platform,
        competitionLevel: body.competitionLevel,
        monetizationPotential: body.monetizationPotential,
        viralReason: body.viralReason,
        opportunity: body.opportunity,
        videoSourceId: source?.id
      }),
      platform,
      projectId: source?.projectId ?? body.projectId,
      provider: body.provider ?? "GEMINI_VEO",
      mode,
      failOnRealProviderError: mode === "REAL"
    });
    const providerText = provider.result.analysis ?? provider.result.script ?? provider.result.caption ?? provider.result.description;
    const cta = platformCta(platform, body.affiliate === true);
    const analysis = {
      viralTitle: `I Tested This ${keyword} System So You Do Not Have To`,
      hook: `Stop scrolling. This ${body.niche.toLowerCase()} workflow can save hours this week.`,
      caption: `A practical ${keyword} breakdown for creators who want faster output without adding more tools.`,
      hashtag: `${hashtag} #AIWorkflow #CreatorTips`,
      cta,
      description: `Metadata package for ${keyword}: proof-first short-form analysis with platform-specific CTA.`,
      targetAudience: "Creators, solopreneurs, editors, and small teams building short-form content systems.",
      contentAngle: `Proof-first education angle: show result, then reveal the ${keyword} workflow in steps.`,
      editingStyle: "Fast cuts, bold captions, screen proof in first 3 seconds, teal highlight callouts.",
      suggestedDuration: platform === "FACEBOOK_REELS" ? 60 : platform === "YOUTUBE_SHORTS" ? 45 : 30,
      fypScore,
      postingTimeRecommendation: platformPostingTime[platform],
      viralReason: body.viralReason ?? "The topic combines practical payoff with a clear curiosity gap.",
      competition: body.competitionLevel ?? "Medium",
      opportunity: body.opportunity ?? "Package the idea as a repeatable workflow with a clear before-after moment.",
      monetizationPotential: body.monetizationPotential ?? "Medium",
      notes: provider.mode === "REAL" ? providerText : "Dummy mode dipilih secara eksplisit. Tidak ada external AI provider yang dipanggil.",
      providerOutput: providerText,
      providerMode: provider.mode,
      providerWarning: provider.warning,
      generationJobId: provider.jobId
    };
    const coreIntelligence = buildCoreIntelligence({ topic: keyword, niche: body.niche, platform, trendSignal: fypScore, competitionLevel: normalizeCompetition(body.competitionLevel) });
    const knowledgeBase = await ingestKnowledge(coreIntelligence, "AI_ANALYSIS");
    const savedItem = source
      ? await withTimeout(prisma.contentItem.create({
          data: {
            projectId: source.projectId ?? body.projectId,
            type: "CLIP_PLAN",
            title: analysis.viralTitle,
            description: analysis.description,
            caption: analysis.caption,
            thumbnail: source.thumbnail,
            status: "DRAFT",
            workflowStatus: "DRAFT",
            sourceType: "UPLOAD_AI_ANALYSIS",
            contentAngle: analysis.contentAngle,
            trendKeyword: keyword,
            trendPlatform: platform,
            fypScore,
            hook: analysis.hook,
            cta,
            targetAudience: analysis.targetAudience,
            editingStyle: analysis.editingStyle,
            suggestedDuration: analysis.suggestedDuration,
            notes: `Video source: ${source.id}\n${analysis.notes}`,
            platform,
            tags: analysis.hashtag.split(/\s+/).map((tag) => tag.replace(/^#/, "").trim()).filter(Boolean)
          }
        }), 5000)
      : null;

    return NextResponse.json({
      success: true,
      input: { ...body, keyword, platform },
      analysis,
      persistence: savedItem ? { status: "saved", contentItemId: savedItem.id, source: "supabase" } : { status: "not_requested" },
      intelligence: {
        source: body.source ?? (source ? "Uploaded video" : "Sample analysis input"),
        sourceUrl: body.sourceUrl ?? source?.url,
        collectedAt: body.collectedAt ?? new Date().toISOString(),
        confidence: body.confidence ?? 25,
        isDemo: body.isDemo !== false,
        notes: body.isDemo === false ? "Analysis is based on a real public signal." : "Analysis is based on demo/sample intelligence."
      },
      coreIntelligence,
      knowledgeBase
    });
  } catch (error) {
    serverLogger.warn("ai_analysis.generate.failed", { videoSourceId: body.videoSourceId, mode: body.mode ?? "DUMMY" }, error);
    return NextResponse.json(
      {
        success: false,
        error: sanitizeErrorMessage(error),
        message: body.mode === "REAL"
          ? "AI Analysis REAL gagal. Tidak ada dummy fallback yang digunakan."
          : "AI Analysis tidak dapat diselesaikan."
      },
      { status: body.mode === "REAL" ? 502 : 503 }
    );
  }
}

function normalizeCompetition(value?: string) {
  const normalized = value?.toUpperCase();
  return normalized === "LOW" || normalized === "HIGH" ? normalized : "MEDIUM";
}
