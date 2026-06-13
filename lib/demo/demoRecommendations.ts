import { demoAffiliateProductInsights } from "@/lib/intelligence/products";
import { calculateRecommendationScore } from "@/lib/intelligence/scoring";
import type { AffiliateProductInsightDto, IntelligenceRecommendationDto, RecommendationScoreBreakdown } from "@/lib/intelligence/types";

const competitionOpportunity = { Low: 90, Medium: 65, High: 38 };

export function demoProductRecommendations(readyCampaigns: Set<string>) {
  return demoAffiliateProductInsights.map((product) => recommendationFromProduct(product, readyCampaigns));
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
    id: `demo_recommendation_${product.id}`,
    recommendedTopic: product.productName,
    reason: "NOT CONNECTED sample source based on content potential and commission estimate.",
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
    sourceUrl: product.sourceUrl,
    riskNote: "Demo marketplace insight. Validate commission, stock, and seller quality manually before launch."
  };
}

function recencyScore(collectedAt: string) {
  const hours = Math.max(0, (Date.now() - new Date(collectedAt).getTime()) / 3600000);
  return Math.max(0, Math.min(100, Math.round(100 - Math.min(hours, 720) * 0.12)));
}

function commissionPotential(estimate: string) {
  const values = estimate.match(/\d+(?:[.,]\d+)?/g)?.map((value) => Number(value.replace(",", "."))) ?? [];
  return Math.max(25, Math.min(95, Math.round((values[0] ?? 5) * 8)));
}
