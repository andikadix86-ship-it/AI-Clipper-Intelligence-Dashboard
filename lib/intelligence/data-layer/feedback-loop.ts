import { saveKnowledge } from "../../knowledge-base/repository";
import type { TrendSignal, TrendSourceInput, TrendSourceOptions } from "./types";

export async function persistHighConfidenceSignals(input: TrendSourceInput, signals: TrendSignal[], options: TrendSourceOptions = {}) {
  const eligible = signals.filter((signal) => signal.mode !== "fallback" && signal.trend_score >= 80);
  await Promise.all(eligible.map((signal) => saveKnowledge({
    category: "algorithm-knowledge",
    platform: input.platform,
    niche: input.niche,
    title: signal.keyword,
    content: `${signal.source} trend signal scored ${signal.trend_score}/100 with ${signal.confidence_score}% confidence.`,
    tags: ["trend-signal", signal.source.toLowerCase().replaceAll(" ", "-"), input.niche],
    confidence_score: signal.confidence_score,
    source_type: signal.mode === "real" ? "real" : "data-driven"
  }, options.knowledgeOptions)));
  return { saved: eligible.length, skipped: signals.length - eligible.length };
}
