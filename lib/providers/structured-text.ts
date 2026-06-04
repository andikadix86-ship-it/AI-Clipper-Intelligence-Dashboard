import { recordErrorEvent } from "../observability/error-registry";
import { extractGeminiText, GeminiClientError, requestGeminiJson } from "./gemini-client";

const GEMINI_TEXT_MODEL = "gemini-2.5-flash";

export type StructuredTextProviderOptions = {
  apiKey?: string;
  mode?: "REAL" | "DUMMY";
  timeoutMs?: number;
  fetchImpl?: (input: string, init?: RequestInit) => Promise<Response>;
};

export async function requestStructuredText<T>(prompt: string, options: StructuredTextProviderOptions) {
  try {
    const response = await requestGeminiJson({
      apiKey: options.apiKey,
      url: `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TEXT_MODEL}:generateContent`,
      payload: { contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } },
      timeoutMs: options.timeoutMs ?? 10000,
      fetchImpl: options.fetchImpl
    });
    return JSON.parse(cleanJson(extractGeminiText(response))) as T;
  } catch (error) {
    recordErrorEvent({
      category: error instanceof GeminiClientError && error.code === "TIMEOUT" ? "timeout" : "provider",
      level: "warning",
      event: "structured_text.provider.fallback",
      message: error instanceof Error ? error.message : "Structured text provider failed."
    });
    throw error;
  }
}

function cleanJson(value: string) {
  return value.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
}
