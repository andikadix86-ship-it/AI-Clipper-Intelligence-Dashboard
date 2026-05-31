import { dummyProvider } from "@/lib/providers/dummy";
import { providerErrorMessage } from "@/lib/providers/errors";
import type { AIProviderAdapter, ProviderResult, ProviderTextInput } from "@/lib/providers/types";

const OPENAI_TEXT_MODEL = "gpt-4o-mini";

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function callOpenAIText(input: ProviderTextInput, instruction: string): Promise<ProviderResult> {
  if (input.mode !== "REAL" || !input.apiKey) return dummyProvider.generateScript(input);
  try {
    const response = await fetchWithTimeout("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${input.apiKey}`
      },
      body: JSON.stringify({
        model: OPENAI_TEXT_MODEL,
        input: [
          {
            role: "system",
            content: "You are a concise content strategy assistant. Return practical short-form content output."
          },
          {
            role: "user",
            content: `${instruction}\n\nTopic/content:\n${input.topic}\n\nPlatform: ${input.platform ?? "multi-platform"}`
          }
        ]
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error?.message ?? "OpenAI request failed.");
    const text = data.output_text ?? data.output?.flatMap((item: { content?: Array<{ text?: string }> }) => item.content ?? []).map((part: { text?: string }) => part.text).filter(Boolean).join("\n") ?? "";
    return {
      title: "OpenAI text response",
      description: text || "OpenAI returned an empty response.",
      caption: text,
      script: text,
      analysis: text,
      provider: input.provider,
      model: OPENAI_TEXT_MODEL,
      isDummy: false,
      outputSource: "provider",
      mode: "REAL"
    };
  } catch (error) {
    if (input.allowDummyFallback === false) throw error;
    const fallback = await dummyProvider.generateScript(input);
    return {
      ...fallback,
      warning: `Dummy fallback used. ${providerErrorMessage(error, "OpenAI")}`,
      mode: "DUMMY"
    };
  }
}

export const openaiProvider: AIProviderAdapter = {
  ...dummyProvider,
  generateCaption: (input) => callOpenAIText(input, "Generate a title, caption, hashtags, CTA, and hook. Keep it ready for short-form posting."),
  analyzeContent: (input) => callOpenAIText(input, "Analyze the content and explain viral potential, weakness, audience, and next recommendation."),
  generateScript: (input) => callOpenAIText(input, "Generate a short-form script with hook, 3-part body, CTA, title, caption, and hashtags.")
};
