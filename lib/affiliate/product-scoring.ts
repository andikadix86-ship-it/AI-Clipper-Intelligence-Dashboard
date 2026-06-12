import type { AffiliateProductInsightDto, ProductContentFormat, ProductOpportunityScore } from "@/lib/intelligence/types";

export type AffiliateProductScoreInput = Partial<Pick<AffiliateProductInsightDto, "productName" | "platform" | "category" | "salesVolume" | "trendScore" | "competitionLevel" | "commissionRate" | "contentPotentialScore" | "opportunityScore" | "sourceType" | "confidence">> & {
  price?: number;
  revenue?: number;
  rating?: number;
  reviewCount?: number;
  rawData?: unknown;
};

export type AffiliateProductScoreResult = ProductOpportunityScore & {
  marginPotential: number;
  viralPotential: number;
  contentEase: number;
  policySafety: number;
  opportunityLabel: OpportunityLabel;
};

export type OpportunityLabel = "HIGH OPPORTUNITY" | "MEDIUM OPPORTUNITY" | "LOW OPPORTUNITY" | "MONITOR ONLY";
export type ContentRecommendation = ProductContentFormat;

export function calculateAffiliateProductScore(product: AffiliateProductScoreInput): AffiliateProductScoreResult {
  const raw = asRecord(product.rawData);
  const rating = product.rating ?? numberValue(raw?.rating);
  const reviewCount = product.reviewCount ?? numberValue(raw?.reviewCount);
  const demandScore = demandFromSales(product.salesVolume, product.revenue, product.opportunityScore);
  const marginScore = marginFromCommission(product.commissionRate, stringValue(raw?.marginLevel), product.opportunityScore);
  const competitionScore = competitionOpportunity(product.competitionLevel, product.opportunityScore);
  const trendScore = bounded(product.trendScore ?? product.opportunityScore ?? 55);
  const contentEaseScore = bounded(product.contentPotentialScore && product.contentPotentialScore > 0 ? product.contentPotentialScore : contentEaseFromCategory(product.category));
  const trustScore = trustFromRating({ rating, reviewCount, sourceType: product.sourceType, confidence: product.confidence });
  const finalOpportunityScore = bounded(
    demandScore * 0.25 +
    marginScore * 0.20 +
    competitionScore * 0.15 +
    trendScore * 0.15 +
    contentEaseScore * 0.15 +
    trustScore * 0.10
  );

  return {
    demand: demandScore,
    competition: competitionRisk(product.competitionLevel, product.opportunityScore),
    commission: marginScore,
    contentPotential: contentEaseScore,
    trend: trendScore,
    opportunity: finalOpportunityScore,
    demandScore,
    marginScore,
    competitionScore,
    trendScore,
    contentEaseScore,
    trustScore,
    finalOpportunityScore,
    marginPotential: marginScore,
    viralPotential: trendScore,
    contentEase: contentEaseScore,
    policySafety: trustScore,
    opportunityLabel: opportunityLabel(finalOpportunityScore)
  };
}

export function opportunityLabel(score: number): OpportunityLabel {
  const value = bounded(score);
  if (value >= 80) return "HIGH OPPORTUNITY";
  if (value >= 60) return "MEDIUM OPPORTUNITY";
  if (value >= 40) return "LOW OPPORTUNITY";
  return "MONITOR ONLY";
}

export function productOpportunityInsight(product: AffiliateProductScoreInput, score = calculateAffiliateProductScore(product)) {
  const demand = level(score.demandScore);
  const margin = level(score.marginScore);
  const competition = product.competitionLevel ?? "Medium";
  if (score.finalOpportunityScore < 40 || competition === "High") return "Produk ini lebih cocok dimonitor karena kompetisi tinggi atau sinyal demand belum cukup kuat.";
  if (demand === "High" && competition === "Medium") return "Produk ini cocok untuk konten review natural karena demand tinggi dan kompetisi sedang.";
  if (margin === "High" && demand !== "High") return "Produk ini perlu dites ringan karena margin bagus tapi demand belum kuat.";
  if (score.contentEaseScore >= 76) return "Produk ini mudah dijadikan konten praktis karena angle demo dan review cukup jelas.";
  return "Produk ini layak diuji dengan konten ringan sambil memvalidasi demand, margin, dan kompetitor.";
}

export function productContentRecommendation(product: AffiliateProductScoreInput, score = calculateAffiliateProductScore(product)): ContentRecommendation {
  const category = product.category?.toLowerCase() ?? "";
  if (/fashion muslim|muslim|hijab|modest/.test(category)) return "Islamic soft selling";
  if (/beauty|personal care|skincare|serum|sunscreen/.test(category)) return "Beauty transformation";
  if (/mom|baby|kids|ibu|anak|bayi/.test(category)) return "Mom solution";
  if (/home|living|kitchen|rumah|dapur/.test(category)) return "Home improvement";
  if (product.competitionLevel === "High") return "Comparison video";
  if (/education|edukasi|course|digital|ai tools|software|saas|template|ebook|membership/.test(category)) return "Educational soft selling";
  if (/health/.test(category)) return "Problem solution demo";
  if (score.trustScore >= 78 && score.demandScore >= 70) return "Review natural";
  if (score.contentEaseScore >= 74) return "UGC style";
  return "Story selling";
}

function demandFromSales(salesVolume?: number, revenue?: number, fallback?: number) {
  if (Number.isFinite(salesVolume ?? NaN) && (salesVolume ?? 0) > 0) return bounded((Math.log10((salesVolume ?? 0) + 1) / Math.log10(5000)) * 100);
  if (Number.isFinite(revenue ?? NaN) && (revenue ?? 0) > 0) return bounded((Math.log10((revenue ?? 0) + 1) / Math.log10(750_000_000)) * 100);
  return bounded(fallback ?? 45);
}

function marginFromCommission(commissionRate?: number, marginLevel?: string, fallback?: number) {
  if (Number.isFinite(commissionRate ?? NaN) && (commissionRate ?? 0) > 0) return bounded((commissionRate ?? 0) * 5);
  const normalized = marginLevel?.toLowerCase() ?? "";
  if (/high|tinggi/.test(normalized)) return 82;
  if (/medium|sedang/.test(normalized)) return 62;
  if (/low|rendah/.test(normalized)) return 38;
  return bounded(fallback ? fallback * 0.72 : 45);
}

function competitionOpportunity(level?: AffiliateProductInsightDto["competitionLevel"], fallback?: number) {
  if (level === "Low") return 90;
  if (level === "Medium") return 62;
  if (level === "High") return 25;
  return bounded(fallback ?? 58);
}

function competitionRisk(level?: AffiliateProductInsightDto["competitionLevel"], fallback?: number) {
  if (level === "Low") return 24;
  if (level === "Medium") return 55;
  if (level === "High") return 85;
  return bounded(fallback ? 100 - fallback * 0.45 : 58);
}

function contentEaseFromCategory(category?: string) {
  const value = category?.toLowerCase() ?? "";
  if (/fashion muslim/.test(value)) return 82;
  if (/beauty|personal care|mom|baby|home|kitchen|food|snack/.test(value)) return 78;
  if (/fashion|health|digital|accessories/.test(value)) return 70;
  return 62;
}

function trustFromRating(input: { rating?: number; reviewCount?: number; sourceType?: AffiliateProductInsightDto["sourceType"]; confidence?: number }) {
  if (Number.isFinite(input.rating ?? NaN) && (input.rating ?? 0) > 0) {
    const ratingScore = bounded(((input.rating ?? 0) / 5) * 100);
    const reviewScore = Number.isFinite(input.reviewCount ?? NaN) && (input.reviewCount ?? 0) > 0 ? bounded((Math.log10((input.reviewCount ?? 0) + 1) / Math.log10(1000)) * 100) : 45;
    return bounded(ratingScore * 0.7 + reviewScore * 0.3);
  }
  if (input.sourceType === "REAL_API") return bounded(Math.max(78, input.confidence ?? 78));
  if (input.sourceType === "MANUAL") return bounded(Math.max(68, input.confidence ?? 68));
  if (input.sourceType === "CSV_IMPORT") return bounded(Math.max(62, input.confidence ?? 62));
  return 45;
}

function level(value: number) {
  if (value >= 72) return "High";
  if (value >= 52) return "Medium";
  return "Low";
}

function bounded(value: number) {
  return Math.min(100, Math.max(0, Math.round(Number.isFinite(value) ? value : 0)));
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : undefined;
}
