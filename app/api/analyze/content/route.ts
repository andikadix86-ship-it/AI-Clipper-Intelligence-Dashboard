import { NextResponse } from "next/server";
import { runTextWorkflow } from "@/lib/text-ai-service";
import type { AIProviderName, ProviderMode, SocialPlatform } from "@/lib/types";
import { buildCoreIntelligence } from "@/lib/intelligence/core-engine";
import { ingestKnowledge } from "@/lib/intelligence/knowledge-base";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!body.topic && !body.content) return NextResponse.json({ error: "Content or topic is required." }, { status: 400 });
  const provider = (body.provider ?? "MANUAL_UPLOAD") as AIProviderName;
  const generated = await runTextWorkflow({
    operation: "AI_ANALYSIS",
    topic: body.topic ?? body.content,
    platform: body.platform as SocialPlatform | undefined,
    provider,
    mode: body.mode as ProviderMode | undefined
  });
  const intelligence = buildCoreIntelligence({ topic: body.topic ?? body.content, niche: body.niche, platform: body.platform });
  const knowledgeBase = await ingestKnowledge(intelligence, "AI_CONTENT_CREATOR");
  return NextResponse.json({
    result: { ...generated.result, warning: generated.warning },
    generationJobId: generated.jobId,
    mode: generated.mode,
    intelligence,
    knowledgeBase
  });
}
