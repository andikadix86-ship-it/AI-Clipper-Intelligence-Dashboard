import { trendSourceAdapters } from "./adapters";
import { persistHighConfidenceSignals } from "./feedback-loop";
import { clampScore } from "./fallback-data";
import { getIntelligenceSourceStatuses } from "../source-status";
import { serverLogger } from "../../server-logger";
import type { AggregatedTrendSignals, TrendSourceAdapter, TrendSourceInput, TrendSourceOptions } from "./types";

export type TrendAggregationOptions = TrendSourceOptions & {
  adapters?: TrendSourceAdapter[];
  persistFeedback?: boolean;
};

export async function aggregateTrendSignals(input: TrendSourceInput, options: TrendAggregationOptions = {}): Promise<AggregatedTrendSignals> {
  validate(input);
  const settled = await Promise.allSettled((options.adapters ?? trendSourceAdapters).map(async (adapter) => ({
    source: adapter.source,
    signals: await adapter.collect(input, options)
  })));
  const signals = settled.flatMap((result) => {
    if (result.status === "fulfilled") return result.value.signals;
    if (process.env.NODE_ENV === "development") serverLogger.error("intelligence.source.unhandled_error", result.reason);
    return [];
  });
  const trend = average(signals.map((signal) => signal.trend_score));
  const confidence = average(signals.map((signal) => signal.confidence_score));
  const competition = clampScore(35 + trend * .45);
  const opportunity = clampScore(trend * .62 + confidence * .28 + (100 - competition) * .1);
  const sorted = [...signals].sort((a, b) => b.trend_score - a.trend_score);
  const feedback = options.persistFeedback === false ? { saved: 0, skipped: signals.length } : await persistHighConfidenceSignals(input, signals, options);
  return {
    source: unique(signals.map((signal) => signal.source)) as AggregatedTrendSignals["source"],
    keyword: input.keyword,
    niche: input.niche,
    platform: input.platform,
    trend_score: trend,
    opportunity_score: opportunity,
    competition_score: competition,
    confidence_score: confidence,
    recommended_topics: unique(sorted.slice(0, 6).map((signal) => signal.keyword)),
    rising_keywords: unique(sorted.filter((signal) => signal.trend_score >= 75).slice(0, 6).map((signal) => signal.keyword)),
    declining_keywords: unique(sorted.filter((signal) => signal.trend_score < 70).slice(0, 6).map((signal) => signal.keyword)),
    collected_at: new Date().toISOString(),
    signals,
    source_statuses: await getIntelligenceSourceStatuses(),
    feedback
  };
}

function validate(input: TrendSourceInput) { for (const key of ["niche", "platform", "keyword"] as const) if (!input[key]?.trim()) throw new TrendAggregationValidationError(`${key} is required.`); }
function average(values: number[]) { return clampScore(values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0, 0); }
function unique(values: string[]) { return [...new Set(values.map((value) => value.trim()).filter(Boolean))]; }
export class TrendAggregationValidationError extends Error { code = "VALIDATION_ERROR" as const; }
