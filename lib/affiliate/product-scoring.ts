import type { AffiliateProductInsightDto, ProductOpportunityScore } from "@/lib/intelligence/types";

export type AffiliateProductScoreInput = Partial<Pick<AffiliateProductInsightDto, "productName" | "platform" | "category" | "salesVolume" | "trendScore" | "competitionLevel" | "commissionRate" | "contentPotentialScore" | "opportunityScore" | "sourceType" | "confidence">> & {
  price?: number;
  revenue?: number;
  policySafetyScore?: number;
};

export type AffiliateProductScoreResult = ProductOpportunityScore & {
  marginPotential: number;
  viralPotential: number;
  contentEase: number;
  policySafety: number;
};

export function calculateAffiliateProductScore(product: AffiliateProductScoreInput): AffiliateProductScoreResult {
  const demand = bounded(product.salesVolume ? 38 + product.salesVolume / 16 : product.revenue ? 46 + product.revenue / 1_200_000 : product.opportunityScore ?? 52);
  const marginPotential = bounded(product.commissionRate ? product.commissionRate * 5 : product.opportunityScore ? product.opportunityScore * 0.72 : 48);
  const viralPotential = bounded(product.trendScore ?? product.opportunityScore ?? 55);
  const competition = competitionScore(product.competitionLevel, product.opportunityScore);
  const contentEase = bounded(product.contentPotentialScore ?? contentEaseFromCategory(product.category));
  const policySafety = bounded(product.policySafetyScore ?? policySafetyFromSource(product.sourceType, product.confidence));
  const opportunity = bounded((demand * 0.25) + (marginPotential * 0.20) + (viralPotential * 0.20) + ((100 - competition) * 0.15) + (contentEase * 0.10) + (policySafety * 0.10));

  return {
    demand,
    competition,
    commission: marginPotential,
    contentPotential: contentEase,
    trend: viralPotential,
    opportunity,
    marginPotential,
    viralPotential,
    contentEase,
    policySafety
  };
}

function competitionScore(level?: AffiliateProductInsightDto["competitionLevel"], fallback?: number) {
  if (level === "Low") return 28;
  if (level === "High") return 78;
  if (level === "Medium") return 55;
  return bounded(fallback ? 100 - fallback * 0.45 : 58);
}

function contentEaseFromCategory(category?: string) {
  const value = category?.toLowerCase() ?? "";
  if (/beauty|personal care|mom|baby|home|kitchen|food|snack/.test(value)) return 78;
  if (/fashion|health|digital|accessories/.test(value)) return 70;
  return 62;
}

function policySafetyFromSource(sourceType?: AffiliateProductInsightDto["sourceType"], confidence?: number) {
  if (sourceType === "REAL_API" || sourceType === "MANUAL" || sourceType === "CSV_IMPORT") return Math.max(72, confidence ?? 78);
  return 62;
}

function bounded(value: number) {
  return Math.min(100, Math.max(0, Math.round(Number.isFinite(value) ? value : 0)));
}
