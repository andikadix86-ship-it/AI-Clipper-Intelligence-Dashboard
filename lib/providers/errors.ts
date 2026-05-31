export function providerErrorMessage(error: unknown, provider: string) {
  const rawMessage = error instanceof Error ? error.message : String(error);
  const normalized = rawMessage.toLowerCase();

  if (normalized.includes("quota") || normalized.includes("429") || normalized.includes("resource_exhausted")) {
    return `${provider} API quota limit reached.`;
  }
  if (
    normalized.includes("api key") ||
    normalized.includes("401") ||
    normalized.includes("403") ||
    normalized.includes("permission") ||
    normalized.includes("unauthorized")
  ) {
    return `${provider} API key or permission is invalid.`;
  }
  if (
    normalized.includes("abort") ||
    normalized.includes("network") ||
    normalized.includes("fetch") ||
    normalized.includes("timeout") ||
    normalized.includes("503") ||
    normalized.includes("unavailable")
  ) {
    return `${provider} is unavailable or timed out.`;
  }

  return `${provider} request failed: ${rawMessage}`;
}
