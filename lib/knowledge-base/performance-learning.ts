import type { PerformanceRecommendation } from "@/lib/analytics/analytics-engine";
import { saveKnowledge } from "@/lib/knowledge-base/repository";
export async function savePerformanceLearning(input: { platform: string; niche?: string; contentTitle: string; recommendation: PerformanceRecommendation }, options: { disableDatabase?: boolean; localFile?: string; disableLocalJson?: boolean } = {}) {
  const insight = input.recommendation;
  if (!insight.knowledge_base_updates.should_save) return { saved: false as const, reason: "PERFORMANCE_SCORE_TOO_LOW" };
  const result = await saveKnowledge({ category: "performance-learning", platform: input.platform, niche: input.niche || "general", title: input.contentTitle, content: insight.knowledge_base_updates.learned_pattern, tags: insight.knowledge_base_updates.tags, confidence_score: insight.scorecard.overall_score, source_type: "data-driven" }, options);
  return { saved: true as const, ...result };
}
