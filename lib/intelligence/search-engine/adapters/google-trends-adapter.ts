import { demoGoogleTrendsAdapter } from "@/lib/intelligence/google-trends";
import { normalizeLegacyResult } from "@/lib/intelligence/search-engine/normalization";
import type { IntelligenceSearchAdapter } from "@/lib/intelligence/search-engine/types";

export const googleTrendsSearchAdapter: IntelligenceSearchAdapter = {
  async search(input) {
    const timeRange = input.timeRange === "7d" ? "7d" : "30d";
    const results = await demoGoogleTrendsAdapter.searchGoogleTrends(input.keyword, { region: input.region, timeRange });
    return {
      status: "DEMO",
      message: "Demo Google Trends. API resmi masih alpha terbatas dan belum dikonfigurasi.",
      results: results.map((result) => normalizeLegacyResult(result, "GOOGLE_TRENDS"))
    };
  },
  async getStatus() {
    return "DEMO";
  },
  getProviderInfo() {
    return { name: "Google Trends", source: "google_trends_demo", isDemo: true, setupHint: "Apply for official Google Trends API alpha access before enabling real mode." };
  }
};
