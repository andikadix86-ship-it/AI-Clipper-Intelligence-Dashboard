import { apiError, apiSuccess } from "@/lib/api-response";
import { providerTestError, testGeminiProvider } from "@/lib/provider-test-service";

export const runtime = "nodejs";

export async function POST() {
  try {
    const result = await testGeminiProvider();
    return apiSuccess(result.message, { result }, { result }, result.status === "ERROR" ? 207 : 200);
  } catch (error) {
    const result = providerTestError("Gemini Text/Image", error);
    return apiError(result.message, 500, error, { result });
  }
}
