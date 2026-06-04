import { sanitizeErrorMessage, sanitizeMetadata } from "./security";
import { categoryForEvent, recordErrorEvent } from "./observability/error-registry";

type LogLevel = "info" | "warn" | "error";

function write(level: LogLevel, event: string, metadata?: Record<string, unknown>, error?: unknown) {
  if (level !== "info") recordErrorEvent({ category: categoryForEvent(event, error), level: level === "error" ? "error" : "warning", event, message: sanitizeErrorMessage(error ?? event), metadata });
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    event,
    metadata: metadata ? sanitizeMetadata(metadata) : undefined,
    error: error ? sanitizeErrorMessage(error) : undefined
  };
  const output = JSON.stringify(payload);
  if (level === "error") console.error(output);
  else if (level === "warn") console.warn(output);
  else console.info(output);
}

export const serverLogger = {
  info: (event: string, metadata?: Record<string, unknown>) => write("info", event, metadata),
  warn: (event: string, metadata?: Record<string, unknown>, error?: unknown) => write("warn", event, metadata, error),
  error: (event: string, error: unknown, metadata?: Record<string, unknown>) => write("error", event, metadata, error)
};
