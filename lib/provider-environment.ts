import type { AIProviderName } from "./types";

export function providerEnvironmentKey(providerName: AIProviderName) {
  if (providerName === "OPENAI_SORA") return process.env.OPENAI_API_KEY ?? "";
  if (providerName === "GEMINI_VEO") return process.env.GEMINI_API_KEY ?? "";
  return "";
}

