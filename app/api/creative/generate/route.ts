import { NextResponse } from "next/server";
import { withTimeout } from "@/lib/db-timeout";
import { prisma } from "@/lib/prisma";
import { getProviderRuntime } from "@/lib/providers";
import { buildCreativeFinalPrompt, promptPreview } from "@/lib/providers/prompt";
import { writeAuditLog } from "@/lib/audit-log";
import { createNotification } from "@/lib/notification-service";
import type { AIProviderName, CreativeType, ProviderMode } from "@/lib/types";

export const runtime = "nodejs";

type CreativeGenerateRequest = {
  projectId?: string;
  type: CreativeType;
  prompt: string;
  style?: string;
  aspectRatio?: string;
  motionPrompt?: string;
  provider?: AIProviderName;
  mode?: ProviderMode;
  campaignId?: string;
  generatedContentId?: string;
};

export async function POST(request: Request) {
  let body: CreativeGenerateRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.prompt) {
    return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
  }
  if (!["IMAGE", "MOTION_IMAGE", "AI_VIDEO"].includes(body.type)) {
    return NextResponse.json({ error: "Generation type is invalid." }, { status: 400 });
  }

  const requestedProvider = body.provider ?? "MANUAL_UPLOAD";
  const startedAt = Date.now();
  const runtimeInfo = await getProviderRuntime(requestedProvider, body.mode);
  const originalPrompt = body.prompt.trim();
  const finalPrompt = buildCreativeFinalPrompt({ prompt: originalPrompt, style: body.style, type: body.type, motionPrompt: body.motionPrompt });
  const providerInput = {
    provider: requestedProvider,
    mode: runtimeInfo.mode,
    prompt: finalPrompt,
    originalPrompt,
    finalPrompt,
    style: body.style,
    aspectRatio: body.aspectRatio,
    motionPrompt: body.motionPrompt,
    apiKey: runtimeInfo.apiKey
  };
  console.info("[generation-debug] request", {
    provider: requestedProvider,
    mode: runtimeInfo.mode,
    generationType: body.type,
    promptPreview: promptPreview(finalPrompt)
  });
  const providerResult =
    body.type === "IMAGE"
      ? await runtimeInfo.adapter.generateImage(providerInput)
      : body.type === "MOTION_IMAGE"
        ? await runtimeInfo.adapter.generateMotionImage(providerInput)
        : await runtimeInfo.adapter.generateVideo(providerInput);
  const isDummy = providerResult.mode === "DUMMY" || providerResult.isDummy === true;
  const outputSource = isDummy ? "dummy" : "provider";
  const outputUrl = providerResult.previewUrl ?? providerResult.thumbnail;
  const model = providerResult.model ?? (isDummy ? "manual-dummy" : "provider-default");
  const fallbackWarning = isDummy ? providerResult.warning ?? "Ini hasil dummy fallback, bukan output provider asli." : undefined;
  const relevanceWarning = !isDummy ? "Output may not match prompt. Please regenerate or adjust prompt." : undefined;
  const generatedAt = new Date().toISOString();
  const generationStatus = isDummy
    ? body.mode === "REAL"
      ? "DUMMY_FALLBACK"
      : "DUMMY_PREVIEW"
    : "COMPLETED";
  const generationError = runtimeInfo.warning ?? fallbackWarning;
  const projectId = body.projectId?.startsWith("project_") ? undefined : body.projectId;

  try {
    const provider = body.provider
      ? await withTimeout(prisma.aIProvider.findUnique({ where: { name: body.provider } }), 2500)
      : null;

    const job = await withTimeout(
      prisma.generationJob.create({
        data: {
          projectId,
          providerId: provider?.id,
          type: body.type,
          prompt: finalPrompt,
          status: "COMPLETED",
          outputUrl,
          duration: Date.now() - startedAt,
          providerMode: providerResult.mode,
          errorMessage: generationError
        }
      }),
      5000
    );

    const asset = await withTimeout(
      prisma.creativeAsset.create({
        data: {
          projectId,
          generationJobId: job.id,
          type: body.type,
          title: providerResult.title,
          prompt: originalPrompt,
          style: body.style,
          aspectRatio: body.aspectRatio,
          motionPrompt: body.motionPrompt,
          provider: body.provider,
          thumbnail: providerResult.thumbnail ?? outputUrl ?? "",
          previewUrl: providerResult.previewUrl,
          status: "READY",
          metadata: {
            originalPrompt,
            finalPrompt,
            provider: requestedProvider,
            model,
            generationType: body.type,
            isDummy,
            outputSource,
            outputUrl,
            thumbnailUrl: providerResult.thumbnail,
            projectId,
            campaignId: body.campaignId,
            generatedContentId: body.generatedContentId,
            status: generationStatus,
            errorMessage: generationError,
            createdAt: generatedAt,
            providerMode: providerResult.mode,
            providerWarning: generationError,
            relevanceWarning
          }
        }
      }),
      5000
    );

    const contentItem = await withTimeout(
      prisma.contentItem.create({
        data: {
          projectId,
          creativeAssetId: asset.id,
          type: body.type,
          title: providerResult.title,
          description: `${body.style ?? "Default"} ${body.type.toLowerCase().replace("_", " ")} generated from Creative Studio using ${requestedProvider} (${model}).`,
          caption: originalPrompt,
          thumbnail: providerResult.thumbnail ?? outputUrl ?? "",
          status: "DRAFT",
          workflowStatus: "DRAFT",
          platform: "INSTAGRAM_REELS",
          tags: ["creative-studio", body.type.toLowerCase(), body.style?.toLowerCase() ?? "dummy"].filter(Boolean)
        }
      }),
      5000
    );

    console.info("[generation-debug] completed", {
      provider: requestedProvider,
      mode: providerResult.mode,
      generationType: body.type,
      model,
      promptPreview: promptPreview(finalPrompt),
      isDummy,
      jobId: job.id,
      outputSource,
      errorMessage: generationError
    });
    await writeAuditLog({
      action: "CREATIVE_ASSET_GENERATED",
      entityType: "CreativeAsset",
      entityId: asset.id,
      message: `${body.type} asset generated with ${requestedProvider}.`,
      metadata: { projectId, contentItemId: contentItem.id, jobId: job.id, provider: requestedProvider, model, generationType: body.type, isDummy, outputSource }
    });
    await createNotification({ title: "Asset generated", message: `${contentItem.title} masuk Content Library sebagai Draft.`, type: "ASSET_GENERATED", severity: "SUCCESS", source: "Creative Studio", actionUrl: `/library/${contentItem.id}` });
    if (isDummy) {
      await createNotification({ title: "Dummy fallback used", message: generationError || "Provider real belum tersedia. Asset menggunakan dummy fallback.", type: "DUMMY_FALLBACK", severity: "WARNING", source: requestedProvider, actionUrl: `/library/${contentItem.id}` });
    }

    return NextResponse.json({
      asset: {
        ...asset,
        model,
        generationType: body.type,
        mode: providerResult.mode,
        isDummy,
        outputSource,
        finalPrompt,
        generationStatus,
        warning: generationError,
        relevanceWarning
      },
      contentItem,
      jobId: job.id,
      job: {
        id: job.id,
        status: job.status,
        progress: 100,
        outputUrl: job.outputUrl,
        duration: job.duration,
        errorMessage: job.errorMessage
      },
      mode: providerResult.mode,
      warning: generationError,
      relevanceWarning
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Creative generation could not be saved.";
    console.info("[generation-debug] persistence failed", {
      provider: requestedProvider,
      mode: providerResult.mode,
      generationType: body.type,
      model,
      promptPreview: promptPreview(finalPrompt),
      isDummy,
      outputSource,
      errorMessage
    });
    return NextResponse.json({ error: "Generation result could not be saved to Content Library.", detail: errorMessage }, { status: 500 });
  }
}
