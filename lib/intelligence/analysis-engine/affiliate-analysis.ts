import { competitionOpportunity } from "@/lib/intelligence/search-engine/scoring";
import type { IntelligenceSearchResult } from "@/lib/intelligence/search-engine/types";

export function affiliateBreakdown(result: IntelligenceSearchResult) {
  const buyerIntent = result.platform === "SHOPEE" || result.platform === "TOKOPEDIA" ? 76 : result.platform === "TIKTOK" ? 70 : 55;
  const commissionPotential = result.platform === "SHOPEE" || result.platform === "TOKOPEDIA" ? 58 : 45;
  const campaignReadiness = result.contentPotentialScore >= 70 ? 72 : 50;
  return {
    productTrend: result.trendScore,
    buyerIntent,
    contentPotential: result.contentPotentialScore,
    commissionPotential,
    competitionOpportunity: competitionOpportunity(result.competitionScore),
    campaignReadiness
  };
}

export function affiliateScore(result: IntelligenceSearchResult) {
  const value = affiliateBreakdown(result);
  return Math.round(value.productTrend * 0.25 + value.buyerIntent * 0.2 + value.contentPotential * 0.2 + value.commissionPotential * 0.15 + value.competitionOpportunity * 0.1 + value.campaignReadiness * 0.1);
}

