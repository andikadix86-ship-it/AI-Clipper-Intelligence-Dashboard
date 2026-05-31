import { calculateContentPotential } from "@/lib/intelligence/search-engine/scoring";
import type { IntelligenceSearchAdapter } from "@/lib/intelligence/search-engine/types";

export const demoTikTokSearchAdapter: IntelligenceSearchAdapter = {
  async search(input) {
    const collectedAt = new Date().toISOString();
    const trendScore = 68;
    const recencyScore = 72;
    const platformFitScore = input.mode === "affiliate" ? 84 : 78;
    return {
      status: "DEMO",
      message: "TikTok masih demo/manual source. Tidak ada scraping atau API call aktif.",
      results: [{
        id: `demo_tiktok_${slug(input.keyword)}`,
        keyword: input.keyword,
        topic: `${input.keyword} short-form angle`,
        title: `${input.keyword} short-form angle`,
        platform: "TIKTOK",
        source: "TikTok manual demo dataset",
        trendScore,
        contentPotentialScore: calculateContentPotential({ trendScore, recencyScore, platformFitScore }),
        competitionScore: 58,
        recencyScore,
        platformFitScore,
        confidence: 28,
        trendDirection: "UNKNOWN",
        region: input.region ?? "ID",
        language: input.language ?? "id",
        rawData: { adapter: "demoTikTokSearchAdapter", basis: "manual sample signal" },
        isDemo: true,
        notes: "Demo Source. Validate manually in TikTok before production.",
        collectedAt
      }]
    };
  },
  async getStatus() { return "DEMO"; },
  getProviderInfo() { return { name: "TikTok", source: "manual demo dataset", isDemo: true }; }
};

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

