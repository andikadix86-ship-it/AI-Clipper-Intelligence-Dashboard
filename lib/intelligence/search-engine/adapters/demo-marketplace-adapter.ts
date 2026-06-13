import type { IntelligencePlatform, IntelligenceSearchAdapter } from "@/lib/intelligence/search-engine/types";

export function createDemoMarketplaceAdapter(platform: Extract<IntelligencePlatform, "SHOPEE" | "TOKOPEDIA">): IntelligenceSearchAdapter {
  const label = platform === "SHOPEE" ? "Shopee" : "Tokopedia";
  return {
    async search(input) {
      const collectedAt = new Date().toISOString();
      return {
        status: "DEMO",
        message: `${label} masih NOT CONNECTED/manual source. Tidak ada scraping aktif.`,
        results: [{
          id: `demo_${platform.toLowerCase()}_${input.keyword.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
          keyword: input.keyword,
          topic: `${input.keyword} marketplace opportunity`,
          title: `${input.keyword} marketplace opportunity`,
          platform,
          source: platform === "SHOPEE" ? "shopee_demo" : "tokopedia_demo",
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
          notes: "NOT CONNECTED source. Validate product, commission, stock, and seller quality manually.",
          collectedAt
        }]
      };
    },
    async getStatus() { return "DEMO"; },
    getProviderInfo() { return { name: label, source: "manual NOT CONNECTED sample dataset", isDemo: true }; }
  };
}
