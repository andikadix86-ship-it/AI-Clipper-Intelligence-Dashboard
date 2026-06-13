import { demoProductRecommendations } from "@/lib/demo/demoRecommendations";
import { getRiskNote } from "@/lib/intelligence/source-utils";
import { calculateRecommendationScore } from "@/lib/intelligence/scoring";
import type { IntelligenceRecommendationDto, IntelligenceResultDto, RecommendationScoreBreakdown } from "@/lib/intelligence/types";
import { prisma } from "@/lib/prisma";

const competitionOpportunity = { Low: 90, Medium: 65, High: 38 };

function recencyScore(collectedAt: string) {
  const hours = Math.max(0, (Date.now() - new Date(collectedAt).getTime()) / 3600000);
  return Math.max(0, Math.min(100, Math.round(100 - Math.min(hours, 720) * 0.12)));
}

function recommendationFromSignal(signal: IntelligenceResultDto, historicalPerformance: number): IntelligenceRecommendationDto {
  const rawPotential = signal.rawData?.contentPotential;
  const rawPlatformFit = signal.rawData?.platformFit;
  const breakdown: RecommendationScoreBreakdown = {
    trendStrength: signal.score,
    contentPotential: typeof rawPotential === "number" ? rawPotential : 72,
    competitionOpportunity: competitionOpportunity[signal.competitionLevel],
    recency: recencyScore(signal.collectedAt),
    platformFit: typeof rawPlatformFit === "number" ? rawPlatformFit : signal.socialPlatform === "YOUTUBE_SHORTS" ? 86 : 78,
    historicalPerformance
  };
  const score = calculateRecommendationScore(breakdown);
  return {
    id: `recommendation_${signal.id}`,
    recommendedTopic: signal.topic,
    reason: `${signal.viralReason} ${signal.isDemo ? "Demo Source. Not used in real-only mode." : "This recommendation uses a collected public signal."}`,
    contentAngle: signal.opportunity,
    platformFit: signal.socialPlatform.replaceAll("_", " "),
    score,
    confidence: signal.isDemo ? Math.min(35, signal.confidence) : Math.min(90, signal.confidence),
    recommendedAction: score >= 78 ? "Create short video" : score >= 64 ? "Send to Creative Studio" : "Monitor first",
    sourceBreakdown: [{ source: signal.source, label: signal.keyword, value: `${signal.score}/100 trend signal`, isDemo: signal.isDemo }],
    scoreBreakdown: breakdown,
    collectedAt: signal.collectedAt,
    isDemo: signal.isDemo,
    notes: signal.notes,
    keyword: signal.keyword,
    socialPlatform: signal.socialPlatform,
    sourceUrl: signal.sourceUrl,
    riskNote: signal.isDemo ? getRiskNote(signal.source) : historicalPerformance ? "Historical performance is included, but validate creative execution before scaling." : getRiskNote(signal.source)
  };
}

function mapStoredYouTube(row: {
  id: string; keyword: string; topic: string; platform: string; source: string; sourceUrl: string | null; score: number; confidence: number;
  volumeLabel: string; trendDirection: string; category: string; region: string; language: string; collectedAt: Date; rawData: unknown; isDemo: boolean; notes: string;
}): IntelligenceResultDto {
  return {
    ...row,
    sourceUrl: row.sourceUrl ?? undefined,
    collectedAt: row.collectedAt.toISOString(),
    rawData: row.rawData && typeof row.rawData === "object" && !Array.isArray(row.rawData) ? row.rawData as Record<string, unknown> : {},
    trendDirection: row.trendDirection as IntelligenceResultDto["trendDirection"],
    hashtag: "#YouTubeShorts",
    competitionLevel: "Medium",
    monetizationPotential: "Medium",
    viralReason: `Public YouTube signal collected for keyword "${row.keyword}".`,
    opportunity: "Create an original short video angle based on the public signal.",
    socialPlatform: "YOUTUBE_SHORTS"
  };
}

export async function generateIntelligenceRecommendations(input?: { niche?: string; includeDemo?: boolean }) {
  const [storedYouTube, analytics, campaigns] = await Promise.all([
    prisma.intelligenceResult.findMany({ where: { platform: "YOUTUBE", isDemo: false }, orderBy: { collectedAt: "desc" }, take: 12 }),
    prisma.postAnalytics.findMany({ select: { engagementRate: true, views: true, averageViewDuration: true }, take: 50 }),
    prisma.affiliateCampaign.findMany({ select: { productName: true } })
  ]);
  const historicalPerformance = analytics.length
    ? Math.min(100, Math.round(analytics.reduce((sum, row) => sum + Math.min(100, row.engagementRate * 7 + Math.log10(Math.max(1, row.views)) * 8 + row.averageViewDuration * 2), 0) / analytics.length))
    : 0;
  const readyCampaigns = new Set(campaigns.map((campaign) => campaign.productName.toLowerCase()));
  const candidates = storedYouTube.map(mapStoredYouTube)
    .filter((item) => !input?.niche || `${item.topic} ${item.category} ${item.keyword}`.toLowerCase().includes(input.niche.toLowerCase()))
    .map((signal) => recommendationFromSignal(signal, historicalPerformance));
  const demoCandidates = input?.includeDemo ? demoProductRecommendations(readyCampaigns) : [];
  return [...candidates, ...demoCandidates].sort((a, b) => b.score - a.score).slice(0, 10);
}
