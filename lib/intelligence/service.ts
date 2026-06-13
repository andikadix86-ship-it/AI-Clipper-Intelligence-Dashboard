import { demoGoogleTrendsAdapter } from "@/lib/intelligence/google-trends";
import { demoAffiliateProductInsights } from "@/lib/intelligence/products";
import { collectYouTubeIntelligence } from "@/lib/intelligence/youtube";
import { resolveYouTubeDataApiKey } from "@/lib/intelligence/provider-settings";
import { prisma } from "@/lib/prisma";
import { serverLogger } from "@/lib/server-logger";
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
        status: "NOT CONNECTED",
        message: "Google Trends: Demo / Not Connected. Tidak dipakai sebagai hasil utama kecuali source demo dipilih."
      },
      {
        name: "YouTube Data API",
        status: youtube.apiKey ? "REAL" : "NOT CONNECTED",
        message: youtube.apiKey ? "API key configured. Real public video search is available." : "YouTube API key belum dikonfigurasi."
      },
      {
        name: "Marketplace Data",
        status: "NOT CONNECTED",
        message: "Marketplace Data: Manual/Demo sampai API real tersedia."
      }
    ]
  };
}

export async function getYouTubeKeywordIntelligence(request: YouTubeSearchRequest) {
  const response = await collectYouTubeIntelligence(request);
  if (response.results.length) {
    try {
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
          isDemo: false,
          notes: result.notes
        }))
      });
    } catch (error) {
      if (process.env.NODE_ENV === "development") serverLogger.error("intelligence.youtube.persist_error", error);
    }
  }
  return response;
}

export function getAffiliateProductIntelligence() {
  return {
    products: demoAffiliateProductInsights,
    status: "NOT CONNECTED",
    message: "Marketplace API not connected. Showing NOT CONNECTED sample data only."
  };
}
