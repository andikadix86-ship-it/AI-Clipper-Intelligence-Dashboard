import type { AIProviderStatus, ProviderMode } from "@/lib/types";

export function providerStatusForSave(mode: ProviderMode, hasApiKey: boolean): AIProviderStatus {
  if (mode === "DUMMY") return "DUMMY";
  return hasApiKey ? "CONFIGURED" : "NOT_CONFIGURED";
}

export function resolvedProviderStatus(input: { mode: ProviderMode; hasApiKey: boolean; lastTestStatus?: AIProviderStatus | null }): AIProviderStatus {
  if (input.mode === "DUMMY") return "DUMMY";
  if (!input.hasApiKey) return "NOT_CONFIGURED";
  if (input.lastTestStatus === "READY" || input.lastTestStatus === "ERROR") return input.lastTestStatus;
  return "CONFIGURED";
}

export function providerStatusLabel(status?: AIProviderStatus) {
  if (status === "NOT_CONFIGURED") return "Not Configured";
  if (status === "CONFIGURED") return "Configured";
  if (status === "READY") return "Ready";
  if (status === "ERROR") return "Error";
  return "Dummy Mode";
}
