import { calculateYouTubeScore } from "@/lib/intelligence/scoring";
import type { IntelligenceResultDto } from "@/lib/intelligence/types";

export type ConnectionStatus = "REAL" | "NOT CONNECTED";

export type IntelligenceSourceMode =
  | "youtube_real"
  | "google_trends_demo"
  | "reddit_oauth"
  | "tiktok_demo"
  | "shopee_demo"
  | "tokopedia_demo"
  | "manual_keyword";

export type YouTubeVideoOpportunityInput = {
  videoId: string;
  title: string;
  description?: string;
  channelTitle?: string;
  publishedAt: string;
  thumbnail?: string;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  statsUnavailable?: boolean;
};

export function isRealSource(source: string | undefined) {
  return isRealConnection(source);
}

export function isDemoSource(source: string | undefined) {
  const normalized = normalizeSource(source);
  return normalized === "google_trends_demo" || normalized === "tiktok_demo" || normalized === "shopee_demo" || normalized === "tokopedia_demo" || normalized === "manual_keyword";
}

export function getSourceBadge(source: string | undefined) {
  const normalized = normalizeSource(source);
  if (normalized === "youtube_real") return "REAL";
  if (normalized === "reddit_oauth") return "NOT CONNECTED";
  if (normalized === "google_trends_demo") return "NOT CONNECTED";
  if (normalized === "tiktok_demo") return "NOT CONNECTED";
  if (normalized === "shopee_demo") return "NOT CONNECTED";
  if (normalized === "tokopedia_demo") return "NOT CONNECTED";
  return "NOT CONNECTED";
}

export function getRiskNote(source: string | undefined) {
  return isDemoSource(source)
    ? "NOT CONNECTED source. Validate with real public data before production."
    : "REAL public source. Validate creative execution and avoid copying the source content.";
}

export function isRealConnection(source: unknown) {
  return getConnectionStatus(source) === "REAL";
}

export function getConnectionStatus(source: unknown): ConnectionStatus {
  if (source && typeof source === "object") {
    const record = source as Record<string, unknown>;
    if (hasDemoMarker(record)) return "NOT CONNECTED";
    if (record.connectionStatus === "REAL" || record.sourceStatus === "REAL" || record.status === "REAL") return "REAL";
    if (record.generationMode === "REAL" || record.providerMode === "REAL" || record.outputSource === "provider") return "REAL";
    if (record.sourceType === "TRENDING_YOUTUBE_REAL" || record.sourceType === "YOUTUBE_REAL") return "REAL";
    if (record.dataSource === "database" && record.sourceType !== "DEMO_SAMPLE") return "REAL";
    return getConnectionStatus([
      record.source,
      record.sourceType,
      record.dataMode,
      record.provider,
      record.providerMode,
      record.generationStatus,
      record.notes
    ].filter(Boolean).join(" "));
  }

  const value = String(source ?? "").toLowerCase();
  if (!value.trim()) return "NOT CONNECTED";
  if (/(demo|dummy|mock|sample|fallback|local draft|localstorage|not connected|not configured|manual keyword|example\.com)/.test(value)) {
    return "NOT CONNECTED";
  }
  if (/(google trends|reddit|tiktok|shopee|tokopedia|lazada)/.test(value) && !/(real_api|real api|oauth|official import|csv_import|manual)/.test(value)) {
    return "NOT CONNECTED";
  }
  if (/(youtube_real|youtube real|youtube data api|trending_youtube_real|database|supabase|prisma|telegram|real_api|real provider|provider)/.test(value)) {
    return "REAL";
  }
  return "NOT CONNECTED";
}

export function getConnectionBadge(statusOrSource: unknown): ConnectionStatus {
  return statusOrSource === "REAL" || statusOrSource === "NOT CONNECTED"
    ? statusOrSource
    : getConnectionStatus(statusOrSource);
}

export function assertNoDemoAsReal<T>(data: T): T {
  const seen = new WeakSet<object>();
  const walk = (value: unknown, path: string) => {
    if (!value || typeof value !== "object") return;
    if (seen.has(value)) return;
    seen.add(value);
    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(item, `${path}[${index}]`));
      return;
    }
    const record = value as Record<string, unknown>;
    const markedReal = record.status === "REAL" || record.sourceStatus === "REAL" || record.connectionStatus === "REAL" || record.providerMode === "REAL" || record.generationMode === "REAL";
    if (markedReal && hasDemoMarker(record)) {
      throw new Error(`Demo data cannot be marked REAL at ${path}.`);
    }
    Object.entries(record).forEach(([key, item]) => walk(item, `${path}.${key}`));
  };
  walk(data, "$");
  return data;
}

export function getProviderErrorMessage(provider: string, error: unknown) {
  const name = provider.toLowerCase();
  const message = error instanceof Error ? error.message : String(error ?? "");
  const normalized = message.toLowerCase();
  if (name.includes("gemini") && /(timeout|abort|unavailable|fetch|network|503|deadline|timed out)/.test(normalized)) {
    return "Gemini API timeout. Provider belum stabil.";
  }
  if (name.includes("openai") && /(quota|billing|insufficient_quota|429|rate limit|resource_exhausted)/.test(normalized)) {
    return "OpenAI quota/billing error. Provider belum tersedia.";
  }
  if (name.includes("youtube") && /(quota|daily limit|rate limit|api key|forbidden|network|timeout|fetch|error|failed)/.test(normalized)) {
    return "YouTube API gagal atau quota habis. Data real tidak tersedia.";
  }
  if (/api key|401|403|permission|unauthorized|not configured/.test(normalized)) {
    return `${provider} provider belum terkoneksi.`;
  }
  return message || `${provider} provider belum tersedia.`;
}

export function mapYouTubeVideoToOpportunity(video: YouTubeVideoOpportunityInput, context: { keyword: string; region: string; language?: string; collectedAt?: string }): IntelligenceResultDto {
  const collectedAt = context.collectedAt ?? new Date().toISOString();
  const publishedAt = video.publishedAt || collectedAt;
  const recencyHours = Math.max(0, (Date.now() - new Date(publishedAt).getTime()) / 3600000);
  const score = calculateYouTubeScore({
    viewCount: video.viewCount,
    likeCount: video.likeCount,
    commentCount: video.commentCount,
    recencyHours,
    keyword: context.keyword,
    title: video.title
  });
  const unavailable = video.statsUnavailable || video.viewCount === undefined || video.likeCount === undefined || video.commentCount === undefined;
  const engagement = video.viewCount ? (((video.likeCount ?? 0) + (video.commentCount ?? 0)) / video.viewCount) * 100 : 0;
  const strongViews = (video.viewCount ?? 0) >= 100_000;
  const strongEngagement = engagement >= 2.5;
  const recent = recencyHours <= 168;
  return {
    id: `youtube_${video.videoId}_${Date.now()}`,
    keyword: context.keyword,
    topic: video.title,
    platform: "YOUTUBE",
    source: "youtube_real",
    sourceUrl: `https://www.youtube.com/watch?v=${video.videoId}`,
    sourceStatus: "REAL",
    status: "REAL",
    score: score.score,
    confidence: unavailable ? 62 : 86,
    volumeLabel: video.viewCount === undefined ? "Views unavailable" : `${video.viewCount.toLocaleString("en-US")} views`,
    trendDirection: recent ? "RISING" : recencyHours <= 720 ? "STABLE" : "FALLING",
    category: "YouTube Search",
    region: context.region,
    language: context.language ?? "id",
    collectedAt,
    rawData: {
      sourceMode: "youtube_real",
      videoId: video.videoId,
      title: video.title,
      description: video.description,
      channelTitle: video.channelTitle,
      publishedAt,
      thumbnail: video.thumbnail,
      viewCount: video.viewCount,
      likeCount: video.likeCount,
      commentCount: video.commentCount,
      source: "youtube_real",
      sourceStatus: "REAL",
      status: "REAL",
      scoreBreakdown: score
    },
    isDemo: false,
    notes: unavailable ? "Collected from YouTube Data API v3. Some metrics unavailable." : "Collected from YouTube Data API v3 public search and statistics endpoints.",
    hashtag: "#YouTubeShorts",
    competitionLevel: score.relevanceScore >= 80 ? "High" : "Medium",
    monetizationPotential: strongViews ? "High" : "Medium",
    viralReason: youtubeViralReason(context.keyword, video.viewCount, video.likeCount, video.commentCount, recent, strongEngagement),
    opportunity: youtubeOpportunity(context.keyword, video.channelTitle, strongViews, strongEngagement),
    socialPlatform: "YOUTUBE_SHORTS"
  };
}

function normalizeSource(source: string | undefined): IntelligenceSourceMode {
  const value = source?.toLowerCase().trim() ?? "";
  if (value.includes("youtube") && !value.includes("demo")) return "youtube_real";
  if (value.includes("reddit")) return "reddit_oauth";
  if (value.includes("google")) return "google_trends_demo";
  if (value.includes("tiktok")) return "tiktok_demo";
  if (value.includes("shopee")) return "shopee_demo";
  if (value.includes("tokopedia")) return "tokopedia_demo";
  return "manual_keyword";
}

function hasDemoMarker(record: Record<string, unknown>) {
  if (record.isDemo === true || record.isDummy === true || record.isDummyGeneration === true || record.isDemoData === true) return true;
  const values = [
    record.source,
    record.sourceType,
    record.dataMode,
    record.outputSource,
    record.generationStatus,
    record.generationMode,
    record.providerWarning,
    record.warning,
    record.notes
  ].map((value) => String(value ?? "").toLowerCase());
  return values.some((value) => /(demo|dummy|mock|sample|fallback|local draft|localstorage|not connected|example\.com)/.test(value));
}

function youtubeViralReason(keyword: string, views?: number, likes?: number, comments?: number, recent?: boolean, strongEngagement?: boolean) {
  const metric = views ? `${views.toLocaleString("en-US")} views` : "public video result";
  const engagement = strongEngagement ? ` with active engagement from ${((likes ?? 0) + (comments ?? 0)).toLocaleString("en-US")} reactions/comments` : "";
  return `${metric}${engagement} for "${keyword}"${recent ? " in a recent upload window" : ""}.`;
}

function youtubeOpportunity(keyword: string, channelTitle?: string, strongViews?: boolean, strongEngagement?: boolean) {
  if (strongViews && strongEngagement) return `Create an original Shorts angle for "${keyword}" using the high-demand topic pattern, without copying ${channelTitle ?? "the source channel"}.`;
  if (strongViews) return `Use "${keyword}" as a demand-backed topic and test a more specific local angle.`;
  return `Monitor "${keyword}" and test one lightweight short-form concept before scaling.`;
}
