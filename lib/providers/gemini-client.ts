export type GeminiErrorCode = "API_KEY_MISSING" | "QUOTA_EXCEEDED" | "TIMEOUT" | "INVALID_RESPONSE" | "PROVIDER_OFFLINE" | "AUTHENTICATION_FAILED" | "PROVIDER_ERROR";

export class GeminiClientError extends Error {
  constructor(public readonly code: GeminiErrorCode, message: string, public readonly retryable: boolean) {
    super(message);
    this.name = "GeminiClientError";
  }
}

type GeminiFetch = (input: string, init?: RequestInit) => Promise<Response>;

export function geminiExecutionMode(requestedMode: "REAL" | "DUMMY", apiKey?: string) {
  return requestedMode === "REAL" && apiKey ? "REAL" : "DUMMY";
}

export async function requestGeminiJson({ apiKey, url, payload, timeoutMs = 8000, fetchImpl = fetch }: { apiKey?: string; url: string; payload: unknown; timeoutMs?: number; fetchImpl?: GeminiFetch }) {
  if (!apiKey) throw new GeminiClientError("API_KEY_MISSING", "Gemini API key is missing.", false);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    const data = await response.json().catch(() => {
      throw new GeminiClientError("INVALID_RESPONSE", "Gemini returned an invalid JSON response.", true);
    });
    if (!response.ok) throw classifyGeminiError(new Error((data as { error?: { message?: string } }).error?.message ?? `Gemini request failed with status ${response.status}.`), response.status);
    return data;
  } catch (error) {
    if (error instanceof GeminiClientError) throw error;
    throw classifyGeminiError(error);
  } finally {
    clearTimeout(timeout);
  }
}

export function extractGeminiText(data: unknown) {
  const text = (data as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }).candidates
    ?.flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => part.text)
    .filter(Boolean)
    .join("\n");
  if (!text) throw new GeminiClientError("INVALID_RESPONSE", "Gemini response did not include text content.", true);
  return text;
}

export function classifyGeminiError(error: unknown, status?: number): GeminiClientError {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();
  if (status === 429 || normalized.includes("quota") || normalized.includes("resource_exhausted")) return new GeminiClientError("QUOTA_EXCEEDED", "Gemini API quota limit reached.", true);
  if (status === 401 || status === 403 || normalized.includes("permission") || normalized.includes("unauthorized")) return new GeminiClientError("AUTHENTICATION_FAILED", "Gemini API key or permission is invalid.", false);
  if (normalized.includes("abort") || normalized.includes("timeout")) return new GeminiClientError("TIMEOUT", "Gemini request timed out.", true);
  if (normalized.includes("fetch") || normalized.includes("network") || normalized.includes("offline") || status === 503) return new GeminiClientError("PROVIDER_OFFLINE", "Gemini provider is unavailable.", true);
  return new GeminiClientError("PROVIDER_ERROR", message || "Gemini request failed.", true);
}
