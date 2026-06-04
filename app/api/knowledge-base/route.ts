import { apiError, apiFallback, apiSuccess, parseJsonBody } from "@/lib/api-response";
import type { CoreIntelligenceOutput } from "@/lib/intelligence/core-engine";
import { ingestKnowledge, listKnowledgeEntries } from "@/lib/intelligence/knowledge-base";
import { getKnowledgeByCategory, recommendKnowledge, saveKnowledge, searchKnowledge } from "@/lib/knowledge-base/repository";
import type { KnowledgeCategory, KnowledgeInput } from "@/lib/knowledge-base/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const take = Number(params.get("take") ?? 40);
  const query = params.get("query"), category = params.get("category") as KnowledgeCategory | null;
  if (params.get("recommend") === "true") return apiSuccess("Knowledge recommendations loaded.", { entries: await recommendKnowledge({ platform: params.get("platform") ?? undefined, niche: params.get("niche") ?? undefined, tags: params.getAll("tag"), take }) });
  if (category) return apiSuccess("Knowledge category loaded.", { entries: await getKnowledgeByCategory(category) });
  if (query) return apiSuccess("Knowledge search loaded.", { entries: await searchKnowledge(query, { take, platform: params.get("platform") ?? undefined, niche: params.get("niche") ?? undefined }) });
  const result = await listKnowledgeEntries(take);
  if (result.source === "fallback") return apiFallback(result.message, "DATABASE_UNAVAILABLE", { entries: [] }, "knowledge entries");
  return apiSuccess("Knowledge entries loaded.", { entries: result.entries }, { entries: result.entries });
}

export async function POST(request: Request) {
  const body = await parseJsonBody<{ intelligence?: CoreIntelligenceOutput; sourceType?: string; entry?: KnowledgeInput }>(request);
  if (body?.entry) return apiSuccess("Knowledge entry persisted.", { knowledgeBase: await saveKnowledge(body.entry) });
  if (!body?.intelligence?.topic) return apiError("Structured intelligence payload is required.", 400);
  const result = await ingestKnowledge(body.intelligence, body.sourceType);
  if (result.status === "FALLBACK_PERSISTED") return apiSuccess(result.message, { knowledgeBase: result }, { knowledgeBase: result });
  return apiSuccess("Knowledge entry persisted.", { knowledgeBase: result }, { knowledgeBase: result });
}
