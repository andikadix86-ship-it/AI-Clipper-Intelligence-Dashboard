import type { AnalysisLevel } from "@/lib/intelligence/analysis-engine/types";
import type { IntelligenceSearchResult } from "@/lib/intelligence/search-engine/types";

export function analyzeRisk(result: IntelligenceSearchResult) {
  const risk: AnalysisLevel = result.isDemo || result.confidence < 40 ? "HIGH" : result.competitionScore > 70 ? "MEDIUM" : "LOW";
  const note = result.isDemo
    ? "Demo source only. Validate demand, availability, and platform context manually before production."
    : result.competitionScore > 70
      ? "Competition is elevated. Use a specific hook and original proof to avoid a generic angle."
      : "Public signal is usable, but validate the creative angle before scaling.";
  return { risk, note };
}

