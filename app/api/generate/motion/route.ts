import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getProviderRuntime } from "@/lib/providers";
import { buildCreativeFinalPrompt, promptPreview } from "@/lib/providers/prompt";
import type { AIProviderName, ProviderMode } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!body.prompt) return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
  const provider = (body.provider ?? "MANUAL_UPLOAD") as AIProviderName;
  const startedAt = Date.now();
  const runtimeInfo = await getProviderRuntime(provider, body.mode as ProviderMode | undefined);
  const finalPrompt = buildCreativeFinalPrompt({ prompt: body.prompt, style: body.style, type: "MOTION_IMAGE", motionPrompt: body.motionPrompt });
  const result = await runtimeInfo.adapter.generateMotionImage({ provider, mode: runtimeInfo.mode, prompt: finalPrompt, originalPrompt: body.prompt, finalPrompt, style: body.style, aspectRatio: body.aspectRatio, motionPrompt: body.motionPrompt, apiKey: runtimeInfo.apiKey });
  const job = await prisma.generationJob.create({
    data: {
      providerId: runtimeInfo.provider?.id,
      type: "MOTION_IMAGE",
      prompt: finalPrompt,
      status: "COMPLETED",
      outputUrl: result.previewUrl ?? result.thumbnail,
      duration: Date.now() - startedAt,
      providerMode: result.mode,
      errorMessage: runtimeInfo.warning ?? result.warning
    }
  }).catch(() => null);
  console.info("[generation-debug] completed", { provider, mode: result.mode, generationType: "MOTION_IMAGE", model: result.model, promptPreview: promptPreview(finalPrompt), isDummy: result.isDummy ?? result.mode === "DUMMY", jobId: job?.id, outputSource: result.outputSource, errorMessage: runtimeInfo.warning ?? result.warning });
  return NextResponse.json({ result: { ...result, warning: runtimeInfo.warning ?? result.warning }, generationJobId: job?.id });
}
