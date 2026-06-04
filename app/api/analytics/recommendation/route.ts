import { NextResponse } from "next/server";
import { AnalyticsValidationError, generatePerformanceRecommendation } from "@/lib/analytics/analytics-engine";
import type { AnalyticsInput } from "@/lib/analytics/analytics-engine";
import { savePerformanceRecommendationToMemory } from "@/lib/analytics/analytics-repository";
import { serverLogger } from "@/lib/server-logger";
import { savePerformanceLearning } from "@/lib/knowledge-base/performance-learning";
export const runtime = "nodejs";
export async function POST(request: Request) {
  let body: AnalyticsInput; try { body = await request.json(); } catch { return validationError("Invalid JSON body."); }
  try { const result = await generatePerformanceRecommendation(body, { apiKey: process.env.GEMINI_API_KEY, mode: process.env.GEMINI_API_KEY ? "REAL" : "DUMMY" }); const stored = savePerformanceRecommendationToMemory(result.data, result.meta); const learning = await savePerformanceLearning({ platform: body.platform, niche: body.niche, contentTitle: body.contentTitle, recommendation: result.data }); serverLogger.info("analytics.recommendation.generated", { provider: result.meta.provider, mode: result.meta.mode, decision: result.data.decision.action, recommendationId: stored.id, knowledgeStorage: learning.saved ? learning.storage : "skipped" }); return NextResponse.json({ success: true, data: result.data, learning, meta: { ...result.meta, recommendation_id: stored.id } }); }
  catch (error) { if (error instanceof AnalyticsValidationError) return validationError(error.message); serverLogger.error("analytics.recommendation.failed", error); return NextResponse.json({ success: false, error: { code: "ENGINE_ERROR", message: "Performance recommendation could not be generated." } }, { status: 500 }); }
}
function validationError(message: string) { return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message } }, { status: 400 }); }
