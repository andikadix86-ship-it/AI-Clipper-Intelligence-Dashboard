import type { IntelligencePlatform, IntelligenceSearchAdapter } from "@/lib/intelligence/search-engine/types";

export function createDemoMarketplaceAdapter(platform: Extract<IntelligencePlatform, "SHOPEE" | "TOKOPEDIA">): IntelligenceSearchAdapter {
  const label = platform === "SHOPEE" ? "Shopee" : "Tokopedia";
  return {
    async search(input) {
      const collectedAt = new Date().toISOString();
      return {
        status: "DEMO",
        message: `${label} masih manual/demo source. Tidak ada scraping aktif.`,
        results: [{
          id: `demo_${platform.toLowerCase()}_${input.keyword.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
          keyword: input.keyword,
          topic: `${input.keyword} marketplace opportunity`,
          title: `${input.keyword} marketplace opportunity`,
          platform,
          source: `${label} manual demo dataset`,
          trendScore: 64,
          contentPotentialScore: 72,
          competitionScore: 52,
          recencyScore: 65,
          platformFitScore: input.mode === "affiliate" ? 82 : 58,
          confidence: 25,
          trendDirection: "UNKNOWN",
          region: input.region ?? "ID",
          language: input.language ?? "id",
          rawData: { adapter: "demoMarketplaceAdapter", basis: "manual sample signal" },
          isDemo: true,
          notes: "Demo Source. Validate product, commission, stock, and seller quality manually.",
          collectedAt
        }]
      };
    },
    async getStatus() { return "DEMO"; },
    getProviderInfo() { return { name: label, source: "manual demo dataset", isDemo: true }; }
  };
}

