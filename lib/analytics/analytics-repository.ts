import type { PerformanceRecommendation, PerformanceRecommendationMeta } from "@/lib/analytics/analytics-engine";
const recommendations = new Map<string, { id: string; data: PerformanceRecommendation; meta: PerformanceRecommendationMeta }>();
export function savePerformanceRecommendationToMemory(data: PerformanceRecommendation, meta: PerformanceRecommendationMeta) { const id = `analytics_recommendation_${Date.now()}_${recommendations.size + 1}`; const entry = { id, data, meta }; recommendations.set(id, entry); return entry; }
