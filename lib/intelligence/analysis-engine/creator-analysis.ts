import { competitionOpportunity } from "@/lib/intelligence/search-engine/scoring";
import type { IntelligenceSearchResult } from "@/lib/intelligence/search-engine/types";

export function creatorBreakdown(result: IntelligenceSearchResult) {
  return {
    trendStrength: result.trendScore,
    contentPotential: result.contentPotentialScore,
    competitionOpportunity: competitionOpportunity(result.competitionScore),
    recency: result.recencyScore,
    platformFit: result.platformFitScore
  };
}

export function creatorScore(result: IntelligenceSearchResult) {
  const value = creatorBreakdown(result);
  return Math.round(value.trendStrength * 0.3 + value.contentPotential * 0.2 + value.competitionOpportunity * 0.2 + value.recency * 0.15 + value.platformFit * 0.15);
}

