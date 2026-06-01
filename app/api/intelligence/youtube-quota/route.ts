import { apiSuccess } from "@/lib/api-response";
import { getYouTubeQuotaSummary } from "@/lib/intelligence/youtube-quota";

export const runtime = "nodejs";

export async function GET() {
  try {
    const summary = await getYouTubeQuotaSummary();
    return apiSuccess("YouTube quota estimate loaded.", { summary }, { summary });
  } catch (error) {
    console.error("[intelligence] Database unavailable while loading YouTube quota.", error);
    const summary = { estimatedUsedToday: 0, requestCountToday: 0, recent: [], warning: "Database unavailable. Quota history is temporarily empty." };
    return apiSuccess("Database unavailable, using empty YouTube quota summary.", { summary, source: "fallback" }, { summary, source: "fallback" });
  }
}
