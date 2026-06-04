import { aggregateTrendSignals, type TrendAggregationOptions } from "./aggregator";
import type { AggregatedTrendSignals } from "./types";

export async function generateContentOpportunities(input: { niche: string; platform: string; keyword?: string }, options: TrendAggregationOptions = {}) {
  const aggregate = await aggregateTrendSignals({ niche: input.niche, platform: input.platform, keyword: input.keyword?.trim() || input.niche }, options);
  return contentOpportunitiesFromAggregate(input, aggregate);
}

export function contentOpportunitiesFromAggregate(input: { niche: string; platform: string }, aggregate: AggregatedTrendSignals) {
  return aggregate.recommended_topics.slice(0, 6).map((topic, index) => ({
    topic,
    score: Math.max(0, Math.min(100, aggregate.opportunity_score - index * 3)),
    opportunity_reason: `Signal lintas sumber menunjukkan peluang ${aggregate.opportunity_score}/100 dengan confidence ${aggregate.confidence_score}/100.`,
    audience_intent: `Audience mencari insight ${input.niche} yang relevan untuk ${input.platform}.`,
    content_angle: index % 2 ? `Buat format checklist praktis tentang ${topic}.` : `Gunakan hook masalah lalu tunjukkan solusi original untuk ${topic}.`,
    estimated_difficulty: aggregate.competition_score >= 72 ? "high" : aggregate.competition_score >= 52 ? "medium" : "low"
  }));
}

export async function generateAffiliateOpportunities(input: { productCategory: string; platform: string }, options: TrendAggregationOptions = {}) {
  const aggregate = await aggregateTrendSignals({ niche: input.productCategory, platform: input.platform, keyword: input.productCategory }, options);
  return {
    product_category: input.productCategory,
    demand_score: aggregate.trend_score,
    content_potential: aggregate.opportunity_score,
    competition_level: aggregate.competition_score >= 72 ? "high" : aggregate.competition_score >= 52 ? "medium" : "low",
    affiliate_recommendation: aggregate.opportunity_score >= 78 ? "promote" : aggregate.opportunity_score >= 58 ? "test" : "observe",
    suggested_content_angles: aggregate.recommended_topics.slice(0, 5).map((topic) => `Demo original dan honest review: ${topic}`)
  };
}
