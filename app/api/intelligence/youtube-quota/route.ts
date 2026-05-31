import { apiError, apiSuccess } from "@/lib/api-response";
import { getYouTubeQuotaSummary } from "@/lib/intelligence/youtube-quota";

export const runtime = "nodejs";

export async function GET() {
  try {
    const summary = await getYouTubeQuotaSummary();
    return apiSuccess("YouTube quota estimate loaded.", { summary }, { summary });
  } catch (error) {
    return apiError("YouTube quota estimate could not be loaded.", 500, error);
  }
}

