import { prisma } from "@/lib/prisma";
import { getProviderRuntime } from "@/lib/providers";
import type { ProviderResult } from "@/lib/providers/types";
import type { AIProviderName, ProviderMode, SocialPlatform } from "@/lib/types";

type TextWorkflowOperation = "AI_ANALYSIS" | "SIMILAR_CONTENT" | "RECOMMENDATION" | "AGENT" | "CAPTION";

type TextWorkflowInput = {
  operation: TextWorkflowOperation;
  topic: string;
  platform?: SocialPlatform;
  projectId?: string | null;
  provider?: AIProviderName;
  mode?: ProviderMode;
};

type TextWorkflowResult = {
  result: ProviderResult;
  warning?: string;
  jobId?: string;
  mode: ProviderMode;
};

const operationPrompt: Record<TextWorkflowOperation, string> = {
  AI_ANALYSIS: "Analyze this trend and produce short-form title, hook, caption, hashtags, CTA, audience, duration, and recommendation.",
  SIMILAR_CONTENT: "Create similar short-form content variations based on this winning reference. Include title, hook, caption, hashtags, CTA, angle, and duration.",
  RECOMMENDATION: "Explain content performance insights and give practical next actions for a content operations dashboard.",
  AGENT: "Generate an agent recommendation for content operations. Keep it actionable, concise, and ready for admin review.",
  CAPTION: "Generate a short-form title, hook, caption, hashtags, CTA, and short script."
};

export async function runTextWorkflow(input: TextWorkflowInput): Promise<TextWorkflowResult> {
  const startedAt = Date.now();
  const providerName = input.provider ?? "OPENAI_SORA";
  const runtime = await getProviderRuntime(providerName, input.mode ?? "REAL");
  const topic = `${operationPrompt[input.operation]}\n\n${input.topic}`;

  const result =
    input.operation === "CAPTION"
      ? await runtime.adapter.generateCaption({ provider: providerName, mode: runtime.mode, topic, platform: input.platform, apiKey: runtime.apiKey })
      : input.operation === "AI_ANALYSIS"
      ? await runtime.adapter.analyzeContent({ provider: providerName, mode: runtime.mode, topic, platform: input.platform, apiKey: runtime.apiKey })
      : input.operation === "RECOMMENDATION"
        ? await runtime.adapter.analyzeContent({ provider: providerName, mode: runtime.mode, topic, platform: input.platform, apiKey: runtime.apiKey })
        : await runtime.adapter.generateScript({ provider: providerName, mode: runtime.mode, topic, platform: input.platform, apiKey: runtime.apiKey });

  const warning = runtime.warning ?? result.warning;
  let jobId: string | undefined;

  try {
    const job = await prisma.generationJob.create({
      data: {
        projectId: input.projectId ?? undefined,
        providerId: runtime.provider?.id,
        type: "IMAGE",
        prompt: `${input.operation}: ${input.topic}`.slice(0, 4000),
        status: "COMPLETED",
        providerMode: result.mode,
        duration: Date.now() - startedAt,
        errorMessage: warning,
        outputUrl: undefined
      }
    });
    jobId = job.id;
  } catch {
    jobId = undefined;
  }

  return {
    result,
    warning,
    jobId,
    mode: result.mode
  };
}
