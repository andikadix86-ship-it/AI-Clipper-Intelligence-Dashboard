import type { Prisma } from "@prisma/client";
import { withTimeout } from "@/lib/db-timeout";
import type { CoreIntelligenceOutput } from "@/lib/intelligence/core-engine";
import { knowledgeEntryDraft } from "@/lib/intelligence/knowledge-entry-draft";
import { prisma } from "@/lib/prisma";
import { serverLogger } from "@/lib/server-logger";
import { saveKnowledge } from "@/lib/knowledge-base/repository";

export async function ingestKnowledge(intelligence: CoreIntelligenceOutput, sourceType = "ENGINE") {
  const draft = knowledgeEntryDraft(intelligence, sourceType);
  try {
    const entry = await withTimeout(prisma.knowledgeEntry.upsert({
      where: { fingerprint: draft.fingerprint },
      update: { content: draft.content as unknown as Prisma.InputJsonValue, tags: draft.tags, confidence: draft.confidence, sourceType: draft.sourceType },
      create: { ...draft, content: draft.content as unknown as Prisma.InputJsonValue }
    }), 3500);
    return { status: "PERSISTED" as const, entry, tags: draft.tags };
  } catch (error) {
    serverLogger.warn("knowledge_base.ingest.fallback", { topic: draft.topic, platform: draft.platform }, error);
    const fallback = await saveKnowledge({ category: draft.category === "POLICY_REVIEW" ? "policy-rules" : "algorithm-knowledge", platform: draft.platform, niche: draft.niche, title: draft.topic, content: JSON.stringify(draft.content), tags: draft.tags, confidence_score: draft.confidence, source_type: "engine" }, { disableDatabase: true });
    return { status: "FALLBACK_PERSISTED" as const, entry: fallback.entry, tags: draft.tags, storage: fallback.storage, message: "Supabase unavailable. Knowledge persisted using fallback storage." };
  }
}

export async function listKnowledgeEntries(take = 40) {
  try {
    const entries = await withTimeout(prisma.knowledgeEntry.findMany({ orderBy: { updatedAt: "desc" }, take: Math.min(Math.max(take, 1), 100) }), 3500);
    return { entries, source: "database" as const };
  } catch (error) {
    serverLogger.warn("knowledge_base.list.fallback", undefined, error);
    return { entries: [], source: "fallback" as const, message: "Database unavailable, using empty knowledge entry list." };
  }
}
