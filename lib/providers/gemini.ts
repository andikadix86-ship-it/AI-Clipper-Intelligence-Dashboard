import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { dummyProvider } from "@/lib/providers/dummy";
import { providerErrorMessage } from "@/lib/providers/errors";
import { buildCreativeFinalPrompt } from "@/lib/providers/prompt";
import type { AIProviderAdapter, ProviderGenerateInput, ProviderResult, ProviderTextInput } from "@/lib/providers/types";

const GEMINI_TEXT_MODEL = "gemini-2.5-flash";
const GEMINI_IMAGE_MODEL = "gemini-2.5-flash-image";
const VEO_VIDEO_MODEL = "veo-3.1-generate-preview";

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function callGeminiText(input: ProviderTextInput, instruction: string): Promise<ProviderResult> {
  if (input.mode !== "REAL" || !input.apiKey) return dummyProvider.generateCaption(input);
  try {
    const response = await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TEXT_MODEL}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": input.apiKey
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `${instruction}\n\nTopic/content:\n${input.topic}\n\nPlatform: ${input.platform ?? "multi-platform"}` }]
          }
        ]
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error?.message ?? "Gemini request failed.");
    const text = data.candidates?.flatMap((candidate: { content?: { parts?: Array<{ text?: string }> } }) => candidate.content?.parts ?? []).map((part: { text?: string }) => part.text).filter(Boolean).join("\n") ?? "";
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
    const fallback = await dummyProvider.generateCaption(input);
    return {
      ...fallback,
      warning: `Dummy fallback used. ${providerErrorMessage(error, "Gemini")}`,
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
    const response = await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": input.apiKey
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
          imageConfig: input.aspectRatio ? { aspectRatio: input.aspectRatio } : undefined
        }
      })
    }, 45000);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error?.message ?? "Gemini image request failed.");
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
    const fallback = await dummyProvider.generateImage(input);
    return {
      ...fallback,
      warning: `Dummy fallback because provider failed. ${providerErrorMessage(error, "Gemini")}`,
      model: GEMINI_IMAGE_MODEL,
      finalPrompt,
      originalPrompt,
      mode: "DUMMY",
      isDummy: true,
      outputSource: "dummy"
    };
  }
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
