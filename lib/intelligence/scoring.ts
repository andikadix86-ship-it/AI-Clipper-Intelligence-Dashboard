import type { RecommendationScoreBreakdown, TrendScoreInput } from "@/lib/intelligence/types";

const competitionScore = {
  Low: 100,
  Medium: 65,
  High: 35
};

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function calculateTrendScore(input: TrendScoreInput) {
  const recencyScore = clamp(100 - Math.min(input.recencyHours, 168) * 0.45);
  const score =
    input.trendSignal * 0.34 +
    input.contentPotential * 0.26 +
    competitionScore[input.competitionLevel] * 0.16 +
    recencyScore * 0.14 +
    input.platformFit * 0.1;

  return clamp(score);
}

export const trendScoreExplanation =
  "Score dihitung dari sinyal trend, potensi konten, kompetisi, recency, dan kecocokan platform.";

export function calculateYouTubeScore(input: {
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  recencyHours: number;
  keyword: string;
  title: string;
}) {
  const views = input.viewCount ?? 0;
  const likes = input.likeCount ?? 0;
  const comments = input.commentCount ?? 0;
  const viewScore = clamp(Math.log10(Math.max(views, 1)) * 16);
  const recencyScore = clamp(100 - Math.min(input.recencyHours, 720) * 0.12);
  const engagementRate = views > 0 ? ((likes + comments * 2) / views) * 100 : 0;
  const engagementScore = clamp(engagementRate * 12);
  const keywordTokens = input.keyword.toLowerCase().split(/\s+/).filter(Boolean);
  const normalizedTitle = input.title.toLowerCase();
  const matchedTokens = keywordTokens.filter((token) => normalizedTitle.includes(token)).length;
  const relevanceScore = clamp(keywordTokens.length ? (matchedTokens / keywordTokens.length) * 100 : 0);
  const score = clamp(viewScore * 0.4 + recencyScore * 0.25 + engagementScore * 0.2 + relevanceScore * 0.15);

  return { score, viewScore, recencyScore, engagementScore, relevanceScore, engagementRate };
}

export const youtubeScoreExplanation =
  "YouTube Score = 40% views, 25% recency, 20% engagement, dan 15% keyword relevance.";

export function calculateGoogleTrendsScore(input: {
  interestValue: number;
  relatedQueryGrowth: number;
  recencyHours: number;
  trendDirection: "RISING" | "STABLE" | "FALLING";
}) {
  const interestScore = clamp(input.interestValue);
  const relatedQueryScore = clamp(input.relatedQueryGrowth);
  const recencyScore = clamp(100 - Math.min(input.recencyHours, 720) * 0.12);
  const directionScore = input.trendDirection === "RISING" ? 100 : input.trendDirection === "STABLE" ? 65 : 30;
  const score = clamp(interestScore * 0.45 + relatedQueryScore * 0.25 + recencyScore * 0.15 + directionScore * 0.15);
  return { score, interestScore, relatedQueryScore, recencyScore, directionScore };
}

export const googleTrendsScoreExplanation =
  "Google Trends Demo Score = 45% interest, 25% related query growth, 15% recency, dan 15% trend direction.";

export function calculateRecommendationScore(breakdown: RecommendationScoreBreakdown) {
  if (typeof breakdown.commissionPotential === "number" || typeof breakdown.campaignReadiness === "number") {
    return clamp(
      breakdown.trendStrength * 0.25 +
      breakdown.contentPotential * 0.23 +
      (breakdown.commissionPotential ?? 0) * 0.17 +
      breakdown.competitionOpportunity * 0.15 +
      breakdown.platformFit * 0.1 +
      (breakdown.campaignReadiness ?? 0) * 0.1
    );
  }
  return clamp(
    breakdown.trendStrength * 0.3 +
    breakdown.contentPotential * 0.22 +
    breakdown.competitionOpportunity * 0.16 +
    breakdown.recency * 0.1 +
    breakdown.platformFit * 0.1 +
    (breakdown.historicalPerformance ?? 0) * 0.12
  );
}

export const recommendationScoreExplanation =
  "Creator Score = trend strength, content potential, competition opportunity, recency, platform fit, dan historical performance. Affiliate Score = trend, content potential, commission estimate, competition, platform fit, dan campaign readiness.";
