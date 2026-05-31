import { apiError, apiSuccess } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/audit-log";
import { getIntelligenceProviderSettings, saveYouTubeDataApiKey } from "@/lib/intelligence/provider-settings";

export const runtime = "nodejs";

export async function GET() {
  try {
    const settings = await getIntelligenceProviderSettings();
    return apiSuccess("Intelligence provider settings loaded.", { settings }, { settings });
  } catch (error) {
    return apiError("Intelligence provider settings could not be loaded.", 500, error);
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (body.provider !== "YOUTUBE_DATA_API") return apiError("Provider must be YOUTUBE_DATA_API.", 400);
  try {
    const settings = await saveYouTubeDataApiKey(body.apiKey);
    await writeAuditLog({
      action: "SAVE_INTELLIGENCE_PROVIDER",
      entityType: "IntelligenceProviderSetting",
      entityId: "YOUTUBE_DATA_API",
      message: "YouTube Data API intelligence setting saved.",
      metadata: { provider: "YOUTUBE_DATA_API", hasApiKey: Boolean(body.apiKey) }
    });
    return apiSuccess("YouTube Data API setting saved. API key is hidden after save.", { settings }, { settings });
  } catch (error) {
    return apiError("YouTube Data API setting could not be saved.", 500, error);
  }
}
