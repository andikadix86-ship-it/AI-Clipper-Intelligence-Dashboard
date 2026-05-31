import { demoGoogleTrendsAdapter } from "@/lib/intelligence/google-trends";
import { demoAffiliateProductInsights } from "@/lib/intelligence/products";
import { calculateRecommendationScore } from "@/lib/intelligence/scoring";
import type { AffiliateProductInsightDto, IntelligenceRecommendationDto, IntelligenceResultDto, RecommendationScoreBreakdown } from "@/lib/intelligence/types";
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
    reason: `${signal.viralReason} ${signal.isDemo ? "This remains a demo recommendation until a real source is connected." : "This recommendation uses a collected public signal."}`,
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
    riskNote: signal.isDemo ? "Demo signal: validate the topic with real public data before production." : historicalPerformance ? "Historical performance is included, but validate creative execution before scaling." : "No historical performance is available yet."
  };
}

function commissionPotential(estimate: string) {
  const values = estimate.match(/\d+(?:[.,]\d+)?/g)?.map((value) => Number(value.replace(",", "."))) ?? [];
  return Math.max(25, Math.min(95, Math.round((values[0] ?? 5) * 8)));
}

function recommendationFromProduct(product: AffiliateProductInsightDto, readyCampaigns: Set<string>): IntelligenceRecommendationDto {
  const breakdown: RecommendationScoreBreakdown = {
    trendStrength: product.trendScore,
    contentPotential: product.contentPotentialScore,
    competitionOpportunity: competitionOpportunity[product.competitionLevel],
    recency: recencyScore(product.collectedAt),
    platformFit: 82,
    commissionPotential: commissionPotential(product.commissionEstimate),
    campaignReadiness: readyCampaigns.has(product.productName.toLowerCase()) ? 90 : 45
  };
  return {
    id: `recommendation_${product.id}`,
    recommendedTopic: product.productName,
    reason: "Demo product insight based on content potential and commission estimate.",
    contentAngle: `Create a product review showing one use case, one benefit, and one clear CTA for ${product.productName}.`,
    platformFit: product.platform,
    score: calculateRecommendationScore(breakdown),
    confidence: Math.min(30, product.confidence),
    recommendedAction: "Create product review",
    sourceBreakdown: [{ source: product.source, label: product.category, value: product.commissionEstimate, isDemo: true }],
    scoreBreakdown: breakdown,
    collectedAt: product.collectedAt,
    isDemo: true,
    notes: product.notes,
    keyword: product.productName,
    socialPlatform: "TIKTOK",
    riskNote: "Demo marketplace insight. Validate commission, stock, and seller quality manually before launch."
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

export async function generateIntelligenceRecommendations(input?: { niche?: string }) {
  const [google, storedYouTube, analytics, campaigns] = await Promise.all([
    demoGoogleTrendsAdapter.getTrendingSearches("ID"),
    prisma.intelligenceResult.findMany({ where: { platform: "YOUTUBE", isDemo: false }, orderBy: { collectedAt: "desc" }, take: 12 }),
    prisma.postAnalytics.findMany({ select: { engagementRate: true, views: true, averageViewDuration: true }, take: 50 }),
    prisma.affiliateCampaign.findMany({ select: { productName: true } })
  ]);
  const historicalPerformance = analytics.length
    ? Math.min(100, Math.round(analytics.reduce((sum, row) => sum + Math.min(100, row.engagementRate * 7 + Math.log10(Math.max(1, row.views)) * 8 + row.averageViewDuration * 2), 0) / analytics.length))
    : 0;
  const readyCampaigns = new Set(campaigns.map((campaign) => campaign.productName.toLowerCase()));
  const candidates = [...storedYouTube.map(mapStoredYouTube), ...google]
    .filter((item) => !input?.niche || `${item.topic} ${item.category} ${item.keyword}`.toLowerCase().includes(input.niche.toLowerCase()))
    .map((signal) => recommendationFromSignal(signal, historicalPerformance));
  const products = demoAffiliateProductInsights.map((product) => recommendationFromProduct(product, readyCampaigns));
  return [...candidates, ...products].sort((a, b) => b.score - a.score).slice(0, 10);
}
