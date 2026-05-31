import type { AIProviderStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { resolveProviderCredential } from "@/lib/providers";
import { dummyProvider } from "@/lib/providers/dummy";
import { openaiProvider } from "@/lib/providers/openai";
import { geminiProvider } from "@/lib/providers/gemini";
import { writeAuditLog } from "@/lib/audit-log";
import { withTimeout } from "@/lib/db-timeout";
import { sanitizeErrorMessage } from "@/lib/security";
import type { AIProviderName, ProviderMode } from "@/lib/types";
import { createNotification } from "@/lib/notification-service";

export type ProviderTestStatus = "READY" | "NOT_CONFIGURED" | "ERROR" | "DUMMY";

export type ProviderTestResult = {
  provider: string;
  status: ProviderTestStatus;
  mode: ProviderMode;
  message: string;
  output?: string;
  warning?: string;
  errorMessage?: string;
  jobId?: string;
  lastTestAt: string;
};

async function saveGenerationLog(input: {
  providerName: AIProviderName;
  providerId?: string;
  prompt: string;
  status: "COMPLETED" | "FAILED";
  mode: ProviderMode;
  output?: string;
  errorMessage?: string;
  startedAt: number;
}) {
  try {
    const job = await withTimeout(
      prisma.generationJob.create({
        data: {
          providerId: input.providerId,
          type: "IMAGE",
          prompt: input.prompt,
          status: input.status,
          providerMode: input.mode,
          duration: Date.now() - input.startedAt,
          outputUrl: input.output,
          errorMessage: input.errorMessage
        }
      }),
      5000
    );
    return job.id;
  } catch {
    return undefined;
  }
}

async function updateProviderTestStatus(providerId: string | undefined, providerStatus: AIProviderStatus, error?: string) {
  if (!providerId) return;
  try {
    await withTimeout(prisma.aIProvider.update({
      where: { id: providerId },
      data: {
        status: providerStatus === "READY" || providerStatus === "CONFIGURED" ? "CONNECTED" : "NOT_CONNECTED",
        providerStatus,
        lastTestAt: new Date(),
        lastTestStatus: providerStatus,
        lastTestError: error
      }
    }), 5000);
  } catch (error) {
    console.info("[provider-debug] status update failed", { providerId, providerStatus, reason: sanitizeErrorMessage(error) });
  }
}

export async function testOpenAIProvider(): Promise<ProviderTestResult> {
  const startedAt = Date.now();
  const { provider, apiKey, source } = await resolveProviderCredential("OPENAI_SORA");
  const prompt = "Generate one short Indonesian caption for an AI productivity short video.";
  const lastTestAt = new Date().toISOString();

  if (!apiKey) {
    console.info("[provider-debug] OpenAI test", { providerFound: Boolean(provider), apiKeyFound: false, source, testSuccess: false, reason: "missing-api-key" });
    await updateProviderTestStatus(provider?.id, "NOT_CONFIGURED", "API key is missing.");
    await writeAuditLog({ action: "PROVIDER_TEST_OPENAI_NOT_CONFIGURED", entityType: "AIProvider", entityId: provider?.id, message: "OpenAI test could not run because API key is missing.", metadata: { providerFound: Boolean(provider), apiKeyFound: false, source, testSuccess: false } });
    await createNotification({ title: "OpenAI API key missing", message: "OpenAI real test tidak dapat dijalankan. Tambahkan API key di Settings.", type: "API_KEY_MISSING", severity: "WARNING", source: "OpenAI", actionUrl: "/settings" });
    const dummy = await dummyProvider.generateCaption({ provider: "OPENAI_SORA", mode: "DUMMY", topic: prompt, platform: "YOUTUBE_SHORTS" });
    return { provider: "OpenAI Text", status: "NOT_CONFIGURED", mode: "DUMMY", message: "OpenAI API key is not configured. Dummy fallback used.", output: dummy.caption, lastTestAt };
  }

  let result;
  try {
    result = await openaiProvider.generateCaption({ provider: "OPENAI_SORA", mode: "REAL", topic: prompt, platform: "YOUTUBE_SHORTS", apiKey, allowDummyFallback: false });
  } catch (error) {
    const errorMessage = sanitizeErrorMessage(error);
    console.info("[provider-debug] OpenAI test", { providerFound: Boolean(provider), apiKeyFound: true, source, testSuccess: false, reason: errorMessage });
    await updateProviderTestStatus(provider?.id, "ERROR", errorMessage);
    await writeAuditLog({ action: "PROVIDER_TEST_OPENAI_FAILED", entityType: "AIProvider", entityId: provider?.id, message: "OpenAI real test failed before dummy fallback.", metadata: { providerFound: Boolean(provider), apiKeyFound: true, source, testSuccess: false, errorMessage } });
    await createNotification({ title: "OpenAI provider error", message: errorMessage, type: errorMessage.toLowerCase().includes("quota") ? "PROVIDER_QUOTA_LIMITED" : "PROVIDER_ERROR", severity: "ERROR", source: "OpenAI", actionUrl: "/settings" });
    const dummy = await dummyProvider.generateCaption({ provider: "OPENAI_SORA", mode: "DUMMY", topic: prompt, platform: "YOUTUBE_SHORTS" });
    const jobId = await saveGenerationLog({ providerName: "OPENAI_SORA", providerId: provider?.id, prompt, status: "FAILED", mode: "DUMMY", output: dummy.caption, errorMessage, startedAt });
    return { provider: "OpenAI Text", status: "ERROR", mode: "DUMMY", message: "OpenAI real test failed. Dummy fallback returned a safe output.", output: dummy.caption, warning: errorMessage, errorMessage, jobId, lastTestAt };
  }
  console.info("[provider-debug] OpenAI test", { providerFound: Boolean(provider), apiKeyFound: true, source, testSuccess: true });
  await updateProviderTestStatus(provider?.id, "READY");
  const jobId = await saveGenerationLog({
    providerName: "OPENAI_SORA",
    providerId: provider?.id,
    prompt,
    status: "COMPLETED",
    mode: result.mode,
    output: result.caption ?? result.description,
    errorMessage: result.warning,
    startedAt
  });
  await writeAuditLog({
    action: "PROVIDER_TEST_OPENAI",
    entityType: "AIProvider",
    entityId: provider?.id,
    message: "OpenAI real text test succeeded.",
    metadata: { mode: result.mode, jobId, providerFound: Boolean(provider), apiKeyFound: true, source, testSuccess: true }
  });

  return {
    provider: "OpenAI Text",
    status: "READY",
    mode: result.mode,
    message: "OpenAI real text test succeeded.",
    output: result.caption ?? result.description,
    warning: result.warning,
    errorMessage: result.warning,
    jobId,
    lastTestAt
  };
}

export async function testGeminiProvider(): Promise<ProviderTestResult> {
  const startedAt = Date.now();
  const { provider, apiKey, source } = await resolveProviderCredential("GEMINI_VEO");
  const prompt = "Generate one concise Indonesian caption for a short-form AI workflow video.";
  const lastTestAt = new Date().toISOString();

  if (!apiKey) {
    console.info("[provider-debug] Gemini test", { providerFound: Boolean(provider), apiKeyFound: false, source, testSuccess: false, reason: "missing-api-key" });
    await updateProviderTestStatus(provider?.id, "NOT_CONFIGURED", "API key is missing.");
    await writeAuditLog({ action: "PROVIDER_TEST_GEMINI_NOT_CONFIGURED", entityType: "AIProvider", entityId: provider?.id, message: "Gemini test could not run because API key is missing.", metadata: { providerFound: Boolean(provider), apiKeyFound: false, source, testSuccess: false } });
    await createNotification({ title: "Gemini API key missing", message: "Gemini real test tidak dapat dijalankan. Tambahkan API key di Settings.", type: "API_KEY_MISSING", severity: "WARNING", source: "Gemini", actionUrl: "/settings" });
    const dummy = await dummyProvider.generateCaption({ provider: "GEMINI_VEO", mode: "DUMMY", topic: prompt, platform: "YOUTUBE_SHORTS" });
    return { provider: "Gemini Text/Image", status: "NOT_CONFIGURED", mode: "DUMMY", message: "Gemini API key is not configured. Dummy fallback used.", output: dummy.caption, lastTestAt };
  }

  let result;
  try {
    result = await geminiProvider.generateCaption({ provider: "GEMINI_VEO", mode: "REAL", topic: prompt, platform: "YOUTUBE_SHORTS", apiKey, allowDummyFallback: false });
  } catch (error) {
    const errorMessage = sanitizeErrorMessage(error);
    console.info("[provider-debug] Gemini test", { providerFound: Boolean(provider), apiKeyFound: true, source, testSuccess: false, reason: errorMessage });
    await updateProviderTestStatus(provider?.id, "ERROR", errorMessage);
    await writeAuditLog({ action: "PROVIDER_TEST_GEMINI_FAILED", entityType: "AIProvider", entityId: provider?.id, message: "Gemini real test failed before dummy fallback.", metadata: { providerFound: Boolean(provider), apiKeyFound: true, source, testSuccess: false, errorMessage } });
    await createNotification({ title: "Gemini provider error", message: errorMessage, type: errorMessage.toLowerCase().includes("quota") ? "PROVIDER_QUOTA_LIMITED" : "PROVIDER_ERROR", severity: "ERROR", source: "Gemini", actionUrl: "/settings" });
    const dummy = await dummyProvider.generateCaption({ provider: "GEMINI_VEO", mode: "DUMMY", topic: prompt, platform: "YOUTUBE_SHORTS" });
    const jobId = await saveGenerationLog({ providerName: "GEMINI_VEO", providerId: provider?.id, prompt, status: "FAILED", mode: "DUMMY", output: dummy.caption, errorMessage, startedAt });
    return { provider: "Gemini Text/Image", status: "ERROR", mode: "DUMMY", message: "Gemini real test failed. Dummy fallback returned a safe output.", output: dummy.caption, warning: errorMessage, errorMessage, jobId, lastTestAt };
  }
  console.info("[provider-debug] Gemini test", { providerFound: Boolean(provider), apiKeyFound: true, source, testSuccess: true });
  await updateProviderTestStatus(provider?.id, "READY");
  const jobId = await saveGenerationLog({
    providerName: "GEMINI_VEO",
    providerId: provider?.id,
    prompt,
    status: "COMPLETED",
    mode: result.mode,
    output: result.caption ?? result.description,
    errorMessage: result.warning,
    startedAt
  });
  await writeAuditLog({
    action: "PROVIDER_TEST_GEMINI",
    entityType: "AIProvider",
    entityId: provider?.id,
    message: "Gemini text test succeeded.",
    metadata: { mode: result.mode, jobId, providerFound: Boolean(provider), apiKeyFound: true, source, testSuccess: true }
  });

  return {
    provider: "Gemini Text/Image",
    status: "READY",
    mode: result.mode,
    message: "Gemini text test succeeded.",
    output: result.caption ?? result.description,
    warning: result.warning,
    errorMessage: result.warning,
    jobId,
    lastTestAt
  };
}

export async function saveProviderAudit(action: string, result: ProviderTestResult, metadata?: Prisma.InputJsonValue) {
  await writeAuditLog({
    action,
    entityType: "ProviderTest",
    entityId: result.provider,
    message: result.message,
    metadata: { status: result.status, mode: result.mode, jobId: result.jobId, ...(metadata as Record<string, unknown> | undefined) }
  });
}

export function providerTestError(provider: string, error: unknown): ProviderTestResult {
  return {
    provider,
    status: "ERROR",
    mode: "DUMMY",
    message: `${provider} test failed. Dummy/manual mode remains available.`,
    errorMessage: sanitizeErrorMessage(error),
    lastTestAt: new Date().toISOString()
  };
}
