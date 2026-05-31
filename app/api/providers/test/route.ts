import { apiError, apiSuccess } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/audit-log";
import { testGeminiProvider, testOpenAIProvider } from "@/lib/provider-test-service";
import { getProviderRuntime } from "@/lib/providers";
import type { AIProviderName, ProviderMode } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!body.provider) return apiError("Provider is required.", 400);
  try {
    if (body.provider === "OPENAI_SORA") {
      const result = await testOpenAIProvider();
      return apiSuccess(result.message, { result }, { result }, result.status === "ERROR" ? 207 : 200);
    }
    if (body.provider === "GEMINI_VEO") {
      const result = await testGeminiProvider();
      return apiSuccess(result.message, { result }, { result }, result.status === "ERROR" ? 207 : 200);
    }
    const runtimeInfo = await getProviderRuntime(body.provider as AIProviderName, body.mode as ProviderMode | undefined);
    const payload = {
      ok: true,
      provider: body.provider,
      mode: runtimeInfo.mode,
      status: runtimeInfo.mode === "REAL" ? "CONNECTED" : "DUMMY_READY",
      warning: runtimeInfo.warning ?? "No real API call was made in this phase."
    };
    await writeAuditLog({
      action: "PROVIDER_TEST",
      entityType: "AIProvider",
      entityId: body.provider,
      message: `Provider test executed for ${body.provider}.`,
      metadata: { mode: runtimeInfo.mode, status: payload.status }
    });
    return apiSuccess("Provider test completed.", payload, payload);
  } catch (error) {
    return apiError("Provider test failed.", 500, error);
  }
}
