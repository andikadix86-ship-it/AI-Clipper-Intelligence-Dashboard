import { apiError, apiSuccess } from "@/lib/api-response";
import { writeAuditLog } from "@/lib/audit-log";
import { getIntelligenceProviderSettings, saveYouTubeDataApiKey } from "@/lib/intelligence/provider-settings";
import { getRedditOAuthStatus } from "@/lib/intelligence/reddit-oauth";
import { serverLogger } from "@/lib/server-logger";

export const runtime = "nodejs";

export async function GET() {
  try {
    const settings = await getIntelligenceProviderSettings();
    return apiSuccess("Intelligence provider settings loaded.", { settings }, { settings });
  } catch (error) {
    serverLogger.warn("settings.intelligence_providers.database_fallback", undefined, error);
    const youtubeKey = process.env.YOUTUBE_API_KEY || process.env.YOUTUBE_DATA_API_KEY || "";
    const reddit = getRedditOAuthStatus();
    const settings = [
      { provider: "YOUTUBE_DATA_API", label: "YouTube Data API", status: youtubeKey ? "CONNECTED" : "MISSING", apiKeyMasked: youtubeKey ? "env_***set" : "", credentialSource: youtubeKey ? "env" : "none", lastError: youtubeKey ? "" : "Provider belum dikonfigurasi" },
      { provider: "GOOGLE_TRENDS", label: "Google Trends", status: process.env.GOOGLE_TRENDS_API_URL ? "CONNECTED" : "NOT_CONFIGURED", apiKeyMasked: "", credentialSource: process.env.GOOGLE_TRENDS_API_URL ? "env" : "none", lastError: process.env.GOOGLE_TRENDS_API_URL ? "" : "GOOGLE_TRENDS_API_URL is not configured." },
      { provider: "REDDIT_OAUTH", label: "Reddit OAuth", status: reddit.status === "READY" ? "CONNECTED" : "NOT_CONFIGURED", apiKeyMasked: reddit.clientIdMasked, credentialSource: "env", lastError: reddit.status === "READY" ? "" : "Reddit is optional and currently disabled." },
      { provider: "GEMINI_API", label: "Gemini API", status: process.env.GEMINI_API_KEY ? "CONNECTED" : "NOT_CONFIGURED", apiKeyMasked: process.env.GEMINI_API_KEY ? "env_***set" : "", credentialSource: process.env.GEMINI_API_KEY ? "env" : "none", lastError: process.env.GEMINI_API_KEY ? "" : "GEMINI_API_KEY is not configured." }
    ];
    return apiSuccess("Database unavailable, using intelligence provider fallback.", { settings }, { settings });
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
