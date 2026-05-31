import { demoGoogleTrendsAdapter } from "@/lib/intelligence/google-trends";
import { demoAffiliateProductInsights } from "@/lib/intelligence/products";
import { collectYouTubeIntelligence } from "@/lib/intelligence/youtube";
import { resolveYouTubeDataApiKey } from "@/lib/intelligence/provider-settings";
import { prisma } from "@/lib/prisma";
import type { YouTubeSearchRequest } from "@/lib/intelligence/youtube";
import type { Prisma } from "@prisma/client";

export async function getTrendingIntelligence() {
  const trends = await demoGoogleTrendsAdapter.getTrendingSearches("ID");
  const youtube = await resolveYouTubeDataApiKey();
  return {
    trends,
    sources: [
      {
        name: "Google Trends",
        status: "DEMO",
        message: "Demo insight, belum terhubung ke data real."
      },
      {
        name: "YouTube Data API",
        status: youtube.apiKey ? "READY" : "SETUP_REQUIRED",
        message: youtube.apiKey ? "API key configured. Real public video search is available." : "YouTube API key belum dikonfigurasi."
      },
      {
        name: "TikTok / Shopee / Reddit",
        status: "DEMO",
        message: "Manual/demo source only. No platform API call is active."
      }
    ]
  };
}

export async function getYouTubeKeywordIntelligence(request: YouTubeSearchRequest) {
  const response = await collectYouTubeIntelligence(request);
  if (response.results.length) {
    await prisma.intelligenceResult.createMany({
      data: response.results.map((result) => ({
        id: result.id,
        keyword: result.keyword,
        topic: result.topic,
        platform: result.platform,
        source: result.source,
        sourceUrl: result.sourceUrl,
        score: result.score,
        confidence: result.confidence,
        volumeLabel: result.volumeLabel,
        trendDirection: result.trendDirection,
        category: result.category,
        region: result.region,
        language: result.language,
        collectedAt: new Date(result.collectedAt),
        rawData: JSON.parse(JSON.stringify(result.rawData ?? {})) as Prisma.InputJsonValue,
        isDemo: result.isDemo,
        notes: result.notes
      }))
    });
  }
  return response;
}

export function getAffiliateProductIntelligence() {
  return {
    products: demoAffiliateProductInsights,
    status: "DEMO",
    message: "Demo product insight. Marketplace API belum terhubung."
  };
}
