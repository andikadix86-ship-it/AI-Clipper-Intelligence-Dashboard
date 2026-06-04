import { sanitizeErrorMessage, sanitizeMetadata } from "../security";

export type ErrorCategory = "provider" | "api" | "fallback" | "timeout" | "validation" | "system";
export type RegistryLevel = "warning" | "error";
export type ErrorRegistryEntry = {
  id: string;
  timestamp: string;
  category: ErrorCategory;
  level: RegistryLevel;
  event: string;
  message: string;
  metadata?: unknown;
};

const registry = globalThis as typeof globalThis & { fvnErrorRegistry?: ErrorRegistryEntry[] };
const entries = registry.fvnErrorRegistry ?? [];
if (!registry.fvnErrorRegistry) registry.fvnErrorRegistry = entries;

export function recordErrorEvent(input: Omit<ErrorRegistryEntry, "id" | "timestamp">) {
  const entry: ErrorRegistryEntry = {
    ...input,
    id: `error_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    message: sanitizeErrorMessage(input.message),
    metadata: input.metadata ? sanitizeMetadata(input.metadata) : undefined
  };
  entries.unshift(entry);
  entries.splice(100);
  return entry;
}

export function listErrorEvents(take = 30) {
  return entries.slice(0, Math.max(1, Math.min(take, 100)));
}

export function errorCount(category?: ErrorCategory) {
  return category ? entries.filter((entry) => entry.category === category).length : entries.length;
}

export function categoryForEvent(event: string, error?: unknown): ErrorCategory {
  const value = `${event} ${error instanceof Error ? error.message : String(error ?? "")}`.toLowerCase();
  if (value.includes("validation")) return "validation";
  if (value.includes("timeout")) return "timeout";
  if (value.includes("fallback") || value.includes("unavailable")) return "fallback";
  if (value.includes("provider") || value.includes("gemini") || value.includes("telegram")) return "provider";
  if (value.includes("api") || value.includes("route")) return "api";
  return "system";
}
