import { calculateYouTubeScore } from "@/lib/intelligence/scoring";
import { resolveYouTubeDataApiKey, updateYouTubeProviderStatus } from "@/lib/intelligence/provider-settings";
import type { IntelligenceResultDto } from "@/lib/intelligence/types";
import { logYouTubeQuota } from "@/lib/intelligence/youtube-quota";
import { serverLogger } from "@/lib/server-logger";

type YouTubeSearchItem = {
  id?: { videoId?: string };
  snippet?: {
    title?: string;
    description?: string;
    channelTitle?: string;
    publishedAt?: string;
    thumbnails?: { medium?: { url?: string }; high?: { url?: string } };
  };
};

type YouTubeStatsItem = {
  id?: string;
  statistics?: { viewCount?: string; likeCount?: string; commentCount?: string };
};

export type YouTubeSearchRequest = {
  keyword: string;
  regionCode?: string;
  maxResults?: number;
  publishedAfter?: string;
  order?: "relevance" | "date" | "viewCount";
};

export type YouTubeIntelligenceResponse = {
  status: "READY" | "SETUP_REQUIRED" | "ERROR" | "QUOTA_LIMITED";
  message: string;
  results: IntelligenceResultDto[];
};

function friendlyYouTubeError(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("quota") || normalized.includes("daily limit") || normalized.includes("rate limit")) {
    return { status: "QUOTA_LIMITED" as const, message: "YouTube API quota limit tercapai. Coba lagi setelah quota direset." };
  }
  if (normalized.includes("api key") || normalized.includes("keyinvalid") || normalized.includes("forbidden")) {
    return { status: "ERROR" as const, message: "YouTube API key tidak valid atau belum memiliki izin YouTube Data API." };
  }
  if (normalized.includes("fetch") || normalized.includes("network") || normalized.includes("timeout")) {
    return { status: "ERROR" as const, message: "Koneksi ke YouTube Data API gagal. Periksa jaringan lalu coba lagi." };
  }
  return { status: "ERROR" as const, message: `YouTube Data API gagal: ${message}` };
}

export async function collectYouTubeIntelligence(request: YouTubeSearchRequest): Promise<YouTubeIntelligenceResponse> {
  const { apiKey } = await resolveYouTubeDataApiKey();
  if (!apiKey) {
    return {
      status: "SETUP_REQUIRED",
      message: "YouTube API key belum dikonfigurasi. Tambahkan di Provider Management untuk mengaktifkan data real.",
      results: []
    };
  }

  const keyword = request.keyword.trim();
  const regionCode = request.regionCode?.trim().toUpperCase() || "ID";
  const maxResults = Math.max(1, Math.min(25, Number(request.maxResults) || 10));
  const order = request.order ?? "relevance";

  try {
    const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
    searchUrl.searchParams.set("part", "snippet");
    searchUrl.searchParams.set("type", "video");
    searchUrl.searchParams.set("maxResults", String(maxResults));
    searchUrl.searchParams.set("regionCode", regionCode);
    searchUrl.searchParams.set("order", order);
    searchUrl.searchParams.set("q", keyword);
    searchUrl.searchParams.set("key", apiKey);
    if (request.publishedAfter) searchUrl.searchParams.set("publishedAfter", new Date(request.publishedAfter).toISOString());

    const searchResponse = await fetch(searchUrl, { cache: "no-store" });
    const searchData = await searchResponse.json().catch(() => ({}));
    if (!searchResponse.ok) {
      const message = searchData.error?.message ?? "YouTube search request failed.";
      await logYouTubeQuota({ endpoint: "search.list", keyword, region: regionCode, status: "ERROR", errorMessage: message });
      throw new Error(message);
    }
    await logYouTubeQuota({ endpoint: "search.list", keyword, region: regionCode, status: "SUCCESS" });

    const items = (searchData.items ?? []) as YouTubeSearchItem[];
    if (!items.length) {
      await updateYouTubeProviderStatus("CONNECTED");
      return { status: "READY", message: "Tidak ada video YouTube ditemukan untuk keyword tersebut.", results: [] };
    }

    const videoIds = items.map((item) => item.id?.videoId).filter(Boolean) as string[];
    const stats = new Map<string, YouTubeStatsItem["statistics"]>();
    let statsUnavailable = false;
    if (videoIds.length) {
      const statsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
      statsUrl.searchParams.set("part", "statistics");
      statsUrl.searchParams.set("id", videoIds.join(","));
      statsUrl.searchParams.set("key", apiKey);
      const statsResponse = await fetch(statsUrl, { cache: "no-store" });
      const statsData = await statsResponse.json().catch(() => ({}));
      if (statsResponse.ok) {
        await logYouTubeQuota({ endpoint: "videos.list", keyword, region: regionCode, status: "SUCCESS" });
        ((statsData.items ?? []) as YouTubeStatsItem[]).forEach((item) => stats.set(item.id ?? "", item.statistics));
      } else {
        await logYouTubeQuota({ endpoint: "videos.list", keyword, region: regionCode, status: "ERROR", errorMessage: statsData.error?.message ?? "YouTube statistics request failed." });
        statsUnavailable = true;
      }
    }

    const collectedAt = new Date().toISOString();
    const results = items.map((item) => {
      const videoId = item.id?.videoId ?? "";
      const statistics = stats.get(videoId);
      const viewCount = statistics?.viewCount ? Number(statistics.viewCount) : undefined;
      const likeCount = statistics?.likeCount ? Number(statistics.likeCount) : undefined;
      const commentCount = statistics?.commentCount ? Number(statistics.commentCount) : undefined;
      const publishedAt = item.snippet?.publishedAt ?? collectedAt;
      const recencyHours = Math.max(0, (Date.now() - new Date(publishedAt).getTime()) / 3600000);
      const score = calculateYouTubeScore({ viewCount, likeCount, commentCount, recencyHours, keyword, title: item.snippet?.title ?? keyword });
      const unavailable = statsUnavailable || viewCount === undefined || likeCount === undefined || commentCount === undefined;
      const notes = unavailable
        ? "Collected from YouTube Data API v3. Some metrics unavailable."
        : "Collected from YouTube Data API v3 public search and statistics endpoints.";
      return {
        id: `youtube_${videoId}_${Date.now()}`,
        keyword,
        topic: item.snippet?.title ?? keyword,
        platform: "YOUTUBE",
        source: "YouTube Data API v3",
        sourceUrl: `https://www.youtube.com/watch?v=${videoId}`,
        score: score.score,
        confidence: unavailable ? 62 : 86,
        volumeLabel: viewCount === undefined ? "Views unavailable" : `${viewCount.toLocaleString("en-US")} views`,
        trendDirection: recencyHours <= 168 ? "RISING" as const : recencyHours <= 720 ? "STABLE" as const : "FALLING" as const,
        category: "YouTube Search",
        region: regionCode,
        language: "id",
        collectedAt,
        rawData: {
          videoId,
          title: item.snippet?.title,
          description: item.snippet?.description,
          channelTitle: item.snippet?.channelTitle,
          publishedAt,
          thumbnail: item.snippet?.thumbnails?.high?.url ?? item.snippet?.thumbnails?.medium?.url,
          viewCount,
          likeCount,
          commentCount,
          scoreBreakdown: score
        },
        isDemo: false,
        notes,
        hashtag: "#YouTubeShorts",
        competitionLevel: score.relevanceScore >= 80 ? "High" as const : "Medium" as const,
        monetizationPotential: (viewCount ?? 0) >= 100000 ? "High" as const : "Medium" as const,
        viralReason: `Public YouTube signal collected for keyword "${keyword}".`,
        opportunity: "Review the public video pattern and create an original short-form angle.",
        socialPlatform: "YOUTUBE_SHORTS" as const
      };
    });

    await updateYouTubeProviderStatus("CONNECTED");
    return { status: "READY", message: `${results.length} hasil YouTube real berhasil dikumpulkan.`, results };
  } catch (error) {
    if (process.env.NODE_ENV === "development") serverLogger.error("intelligence.youtube.api_error", error);
    const friendly = friendlyYouTubeError(error instanceof Error ? error.message : "Unknown YouTube error.");
    await updateYouTubeProviderStatus(friendly.status === "QUOTA_LIMITED" ? "QUOTA_LIMITED" : "ERROR", friendly.message);
    return { status: friendly.status, message: friendly.message, results: [] };
  }
}
