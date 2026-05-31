import { collectYouTubeIntelligence } from "@/lib/intelligence/youtube";
import { resolveYouTubeDataApiKey } from "@/lib/intelligence/provider-settings";
import { normalizeLegacyResult } from "@/lib/intelligence/search-engine/normalization";
import type { IntelligenceSearchAdapter } from "@/lib/intelligence/search-engine/types";

export const youtubeSearchAdapter: IntelligenceSearchAdapter = {
  async search(input) {
    const response = await collectYouTubeIntelligence({
      keyword: input.keyword,
      regionCode: input.region,
      maxResults: input.maxResults,
      publishedAfter: publishedAfter(input.timeRange ?? "7d")
    });
    return {
      status: response.status === "READY" ? "CONNECTED" : response.status === "SETUP_REQUIRED" ? "MISSING" : "ERROR",
      message: response.message,
      results: response.results.map((result) => normalizeLegacyResult(result, "YOUTUBE"))
    };
  },
  async getStatus() {
    return (await resolveYouTubeDataApiKey()).apiKey ? "CONNECTED" : "MISSING";
  },
  getProviderInfo() {
    return { name: "YouTube", source: "YouTube Data API v3", isDemo: false, setupHint: "Configure YOUTUBE_API_KEY in Provider Management." };
  }
};

function publishedAfter(timeRange: "7d" | "30d" | "90d") {
  const days = timeRange === "90d" ? 90 : timeRange === "30d" ? 30 : 7;
  return new Date(Date.now() - days * 86400000).toISOString();
}

