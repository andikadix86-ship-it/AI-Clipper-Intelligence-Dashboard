import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { dummyProvider } from "@/lib/providers/dummy";
import { providerErrorMessage } from "@/lib/providers/errors";
import { extractGeminiText, GeminiClientError, requestGeminiJson } from "@/lib/providers/gemini-client";
import { buildCreativeFinalPrompt } from "@/lib/providers/prompt";
import type { AIProviderAdapter, ProviderGenerateInput, ProviderResult, ProviderTextInput } from "@/lib/providers/types";
import { serverLogger } from "@/lib/server-logger";

const GEMINI_TEXT_MODEL = "gemini-2.5-flash";
const GEMINI_IMAGE_MODEL = "gemini-2.5-flash-image";
const VEO_VIDEO_MODEL = "veo-3.1-generate-preview";

async function callGeminiText(input: ProviderTextInput, instruction: string): Promise<ProviderResult> {
  if (input.mode !== "REAL" || !input.apiKey) return dummyProvider.generateCaption(input);
  try {
    const data = await requestGeminiJson({
      apiKey: input.apiKey,
      url: `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TEXT_MODEL}:generateContent`,
      payload: {
        contents: [
          {
            role: "user",
            parts: [{ text: `${instruction}\n\nTopic/content:\n${input.topic}\n\nPlatform: ${input.platform ?? "multi-platform"}` }]
          }
        ]
      }
    });
    const text = extractGeminiText(data);
    return {
      title: "Gemini text response",
      description: text || "Gemini returned an empty response.",
      caption: text,
      script: text,
      analysis: text,
      provider: input.provider,
      model: GEMINI_TEXT_MODEL,
      isDummy: false,
      outputSource: "provider",
      mode: "REAL"
    };
  } catch (error) {
    if (input.allowDummyFallback === false) throw error;
    if (process.env.NODE_ENV === "development") serverLogger.error("provider.gemini.text_fallback", error);
    const fallback = await dummyProvider.generateCaption(input);
    return {
      ...fallback,
      warning: `Dummy fallback used. ${providerErrorMessage(error, "Gemini")}`,
      providerError: providerError(error),
      mode: "DUMMY"
    };
  }
}

async function saveInlineImage(data: string, mimeType = "image/png") {
  const extension = mimeType.includes("jpeg") ? "jpg" : mimeType.includes("webp") ? "webp" : "png";
  const fileName = `gemini-${randomUUID()}.${extension}`;
  const targetDir = path.join(process.cwd(), "public", "uploads", "generated");
  await mkdir(targetDir, { recursive: true });
  await writeFile(path.join(targetDir, fileName), Buffer.from(data, "base64"));
  return `/uploads/generated/${fileName}`;
}

async function generateGeminiImage(input: ProviderGenerateInput): Promise<ProviderResult> {
  const originalPrompt = input.originalPrompt ?? input.prompt;
  const finalPrompt = input.finalPrompt ?? buildCreativeFinalPrompt({ prompt: originalPrompt, style: input.style, type: "IMAGE" });
  if (input.mode !== "REAL" || !input.apiKey) {
    return { ...(await dummyProvider.generateImage(input)), finalPrompt, originalPrompt };
  }

  try {
    const data = await requestGeminiJson({
      apiKey: input.apiKey,
      url: `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent`,
      payload: {
        contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
          imageConfig: input.aspectRatio ? { aspectRatio: input.aspectRatio } : undefined
        }
      },
      timeoutMs: 45000
    });
    const parts = data.candidates?.flatMap((candidate: { content?: { parts?: Array<{ text?: string; inlineData?: { data?: string; mimeType?: string } }> } }) => candidate.content?.parts ?? []) ?? [];
    const image = parts.find((part: { inlineData?: { data?: string } }) => part.inlineData?.data)?.inlineData;
    if (!image?.data) throw new Error("Gemini image response did not include image data.");
    const outputUrl = await saveInlineImage(image.data, image.mimeType);
    return {
      title: `Gemini image: ${originalPrompt.slice(0, 54)}`,
      description: parts.map((part: { text?: string }) => part.text).filter(Boolean).join("\n") || "Gemini generated image.",
      caption: originalPrompt,
      thumbnail: outputUrl,
      previewUrl: outputUrl,
      provider: input.provider,
      mode: "REAL",
      model: GEMINI_IMAGE_MODEL,
      generationType: "IMAGE",
      isDummy: false,
      outputSource: "provider",
      originalPrompt,
      finalPrompt
    };
  } catch (error) {
    if (process.env.NODE_ENV === "development") serverLogger.error("provider.gemini.image_fallback", error);
    const fallback = await dummyProvider.generateImage(input);
    return {
      ...fallback,
      warning: `Dummy fallback because provider failed. ${providerErrorMessage(error, "Gemini")}`,
      providerError: providerError(error),
      model: GEMINI_IMAGE_MODEL,
      finalPrompt,
      originalPrompt,
      mode: "DUMMY",
      isDummy: true,
      outputSource: "dummy"
    };
  }
}

function providerError(error: unknown) {
  if (error instanceof GeminiClientError) return { code: error.code, message: error.message, retryable: error.retryable };
  return { code: "PROVIDER_ERROR", message: providerErrorMessage(error, "Gemini"), retryable: true };
}

async function generateVeoFallback(input: ProviderGenerateInput, type: "AI_VIDEO" | "MOTION_IMAGE") {
  const originalPrompt = input.originalPrompt ?? input.prompt;
  const finalPrompt = input.finalPrompt ?? buildCreativeFinalPrompt({ prompt: originalPrompt, style: input.style, type, motionPrompt: input.motionPrompt });
  const fallback = type === "AI_VIDEO" ? await dummyProvider.generateVideo(input) : await dummyProvider.generateMotionImage(input);
  return {
    ...fallback,
    warning: `Dummy fallback because ${VEO_VIDEO_MODEL} ${type.toLowerCase().replace("_", " ")} adapter is not implemented yet.`,
    model: VEO_VIDEO_MODEL,
    generationType: type,
    finalPrompt,
    originalPrompt,
    mode: "DUMMY" as const,
    isDummy: true,
    outputSource: "dummy" as const
  };
}

export const geminiProvider: AIProviderAdapter = {
  ...dummyProvider,
  generateCaption: (input) => callGeminiText(input, "Generate a concise short-form caption, hook, hashtags, and CTA."),
  analyzeContent: (input) => callGeminiText(input, "Analyze this short-form content idea and give practical recommendations."),
  generateScript: (input) => callGeminiText(input, "Generate a short-form script with hook, body, CTA, title, and caption."),
  generateImage: generateGeminiImage,
  generateVideo: (input) => generateVeoFallback(input, "AI_VIDEO"),
  generateMotionImage: (input) => generateVeoFallback(input, "MOTION_IMAGE")
};
