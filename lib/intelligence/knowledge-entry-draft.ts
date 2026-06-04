import { createHash } from "node:crypto";
import type { CoreIntelligenceOutput } from "@/lib/intelligence/core-engine";

export type KnowledgeEntryDraft = {
  fingerprint: string;
  category: string;
  topic: string;
  niche: string;
  platform: string;
  content: CoreIntelligenceOutput;
  tags: string[];
  confidence: number;
  sourceType: string;
};

export function knowledgeEntryDraft(intelligence: CoreIntelligenceOutput, sourceType = "ENGINE"): KnowledgeEntryDraft {
  return {
    fingerprint: createHash("sha256").update([intelligence.topic, intelligence.niche, intelligence.platform, ...intelligence.knowledge_base_tags].join("|").toLowerCase()).digest("hex"),
    category: intelligence.policy_risk === "LOW" ? "CONTENT_OPPORTUNITY" : "POLICY_REVIEW",
    topic: intelligence.topic,
    niche: intelligence.niche,
    platform: intelligence.platform,
    content: intelligence,
    tags: intelligence.knowledge_base_tags,
    confidence: Math.round((intelligence.trend_score + intelligence.opportunity_score) / 2),
    sourceType
  };
}
