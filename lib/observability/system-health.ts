import { mkdir, access } from "node:fs/promises";
import path from "node:path";
import { withTimeout } from "@/lib/db-timeout";
import { errorCount, listErrorEvents, recordErrorEvent } from "@/lib/observability/error-registry";
import { prisma } from "@/lib/prisma";
import { resolveProviderCredential } from "@/lib/providers";
import { resolveTelegramRuntimeConfig } from "@/lib/telegram-service";
import { sanitizeErrorMessage } from "@/lib/security";
import { getDatabaseConfiguration } from "@/lib/env";
import { serverLogger } from "@/lib/server-logger";

export type HealthStatus = "Healthy" | "Warning" | "Error";
export type ServiceHealth = { name: string; status: HealthStatus; message: string; last_check: string; response_time_ms: number; error_count: number };

export async function getSystemHealth() {
  const services = await Promise.all([
    checkSupabase(),
    checkGemini(),
    checkTelegram(),
    configuredService("GitHub", Boolean(process.env.GITHUB_TOKEN), "GitHub backup credential is configured.", "Optional backup provider belum dikonfigurasi."),
    checkLocalStorage()
  ]);
  const supabase = services.find((service) => service.name === "Supabase");
  services.splice(2, 0, {
    name: "Notification",
    status: supabase?.status === "Healthy" ? "Healthy" : "Warning",
    message: supabase?.status === "Healthy" ? "Notification storage is reachable." : "Empty notification fallback active.",
    last_check: new Date().toISOString(),
    response_time_ms: supabase?.response_time_ms ?? 0,
    error_count: errorCount("fallback")
  });
  return { success: true, services, errors: listErrorEvents(12), checked_at: new Date().toISOString() };
}

async function checkGemini(): Promise<ServiceHealth> {
  const started = Date.now();
  const credential = await resolveProviderCredential("GEMINI_VEO");
  return service("Gemini", credential.apiKey ? "Healthy" : "Warning", credential.apiKey ? `Gemini credential is configured from ${credential.source}.` : "Provider belum dikonfigurasi.", started, errorCount("provider"));
}

async function checkTelegram(): Promise<ServiceHealth> {
  const started = Date.now();
  const runtime = await resolveTelegramRuntimeConfig();
  return service("Telegram", runtime.configured ? "Healthy" : "Warning", runtime.configured ? `Telegram approval is configured from ${runtime.source}.` : "Dummy approval mode active.", started, errorCount("provider"));
}

async function checkSupabase(): Promise<ServiceHealth> {
  const started = Date.now();
  const config = getDatabaseConfiguration();
  try {
    if (!config.configured) throw new Error(config.message);
    await withTimeout(prisma.$queryRaw`SELECT 1`);
    return service("Supabase", "Healthy", "Database reachable.", started, errorCount("system"));
  } catch (error) {
    const exception = error as { name?: unknown; code?: unknown };
    serverLogger.warn("system_health.supabase.query_failed", {
      configured: config.configured,
      exception_name: typeof exception.name === "string" ? exception.name : "UnknownError",
      exception_code: typeof exception.code === "string" ? exception.code : "UNKNOWN"
    }, error);
    recordErrorEvent({ category: "fallback", level: "warning", event: "system_health.supabase.fallback", message: sanitizeErrorMessage(error) });
    return service("Supabase", "Error", `${config.configured ? "Database unavailable." : config.message} Local fallback remains active.`, started, errorCount("fallback"));
  }
}

async function checkLocalStorage(): Promise<ServiceHealth> {
  const started = Date.now();
  try {
    const directory = path.join(process.cwd(), "data");
    await mkdir(directory, { recursive: true });
    await access(directory);
    return service("Local Storage", "Healthy", "Local fallback directory is accessible.", started, 0);
  } catch (error) {
    recordErrorEvent({ category: "system", level: "error", event: "system_health.local_storage.error", message: error instanceof Error ? error.message : "Local storage unavailable." });
    return service("Local Storage", "Error", "Local fallback directory is unavailable.", started, errorCount("system"));
  }
}

function configuredService(name: string, configured: boolean, healthyMessage: string, warningMessage: string): ServiceHealth {
  return { name, status: configured ? "Healthy" : "Warning", message: configured ? healthyMessage : warningMessage, last_check: new Date().toISOString(), response_time_ms: 0, error_count: 0 };
}

function service(name: string, status: HealthStatus, message: string, started: number, errors: number): ServiceHealth {
  return { name, status, message, last_check: new Date().toISOString(), response_time_ms: Date.now() - started, error_count: errors };
}
