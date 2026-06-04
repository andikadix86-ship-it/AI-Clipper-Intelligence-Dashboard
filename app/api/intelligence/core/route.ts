import { apiError, apiSuccess, parseJsonBody } from "@/lib/api-response";
import { buildCoreIntelligence } from "@/lib/intelligence/core-engine";
import type { CoreIntelligenceInput } from "@/lib/intelligence/core-engine";
import { serverLogger } from "@/lib/server-logger";
import { ingestKnowledge } from "@/lib/intelligence/knowledge-base";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await parseJsonBody<CoreIntelligenceInput>(request);
  if (!body?.topic?.trim()) return apiError("Topic is required.", 400);
  try {
    const intelligence = buildCoreIntelligence(body);
    const knowledgeBase = await ingestKnowledge(intelligence);
    serverLogger.info("intelligence.core.generated", { topic: intelligence.topic, platform: intelligence.platform, opportunityScore: intelligence.opportunity_score });
    return apiSuccess("Structured intelligence generated.", {
      intelligence,
      knowledgeBase
    }, { intelligence, knowledgeBase });
  } catch (error) {
    serverLogger.error("intelligence.core.failed", error);
    return apiError("Structured intelligence could not be generated.", 500, error);
  }
}
