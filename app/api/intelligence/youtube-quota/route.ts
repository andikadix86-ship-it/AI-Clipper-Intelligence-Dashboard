import { apiSuccess } from "@/lib/api-response";
import { getYouTubeQuotaSummary } from "@/lib/intelligence/youtube-quota";
import { serverLogger } from "@/lib/server-logger";

export const runtime = "nodejs";

export async function GET() {
  try {
    const summary = await getYouTubeQuotaSummary();
    return apiSuccess("YouTube quota estimate loaded.", { summary }, { summary });
  } catch (error) {
    serverLogger.warn("intelligence.youtube_quota.database_fallback", undefined, error);
    const summary = { estimatedUsedToday: 0, requestCountToday: 0, recent: [], warning: "Database unavailable. Quota history is temporarily empty." };
    return apiSuccess("Database unavailable, using empty YouTube quota summary.", { summary, source: "fallback" }, { summary, source: "fallback" });
  }
}
