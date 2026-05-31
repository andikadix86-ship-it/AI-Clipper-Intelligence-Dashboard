import { NextResponse } from "next/server";
import { runTextWorkflow } from "@/lib/text-ai-service";
import type { AIProviderName, ProviderMode, SocialPlatform } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!body.topic) return NextResponse.json({ error: "Topic is required." }, { status: 400 });
  const provider = (body.provider ?? "MANUAL_UPLOAD") as AIProviderName;
  const generated = await runTextWorkflow({
    operation: "CAPTION",
    topic: body.topic,
    platform: body.platform as SocialPlatform | undefined,
    provider,
    mode: body.mode as ProviderMode | undefined
  });
  return NextResponse.json({
    result: { ...generated.result, warning: generated.warning },
    generationJobId: generated.jobId,
    mode: generated.mode
  });
}
