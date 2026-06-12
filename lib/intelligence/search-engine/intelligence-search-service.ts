import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { findCachedSearch, makeSearchCacheKey, SEARCH_CACHE_MINUTES } from "@/lib/intelligence/search-engine/cache";
import { createDemoMarketplaceAdapter } from "@/lib/intelligence/search-engine/adapters/demo-marketplace-adapter";
import { demoTikTokSearchAdapter } from "@/lib/intelligence/search-engine/adapters/demo-tiktok-adapter";
import { googleTrendsSearchAdapter } from "@/lib/intelligence/search-engine/adapters/google-trends-adapter";
import { redditSearchAdapter } from "@/lib/intelligence/search-engine/adapters/reddit-adapter";
import { youtubeSearchAdapter } from "@/lib/intelligence/search-engine/adapters/youtube-adapter";
import { getIntelligenceSourceStatuses } from "@/lib/intelligence/source-status";
import { serverLogger } from "@/lib/server-logger";
import type { IntelligenceAdapterResult, IntelligencePlatform, IntelligenceSearchAdapter, IntelligenceSearchInput, IntelligenceSearchResult } from "@/lib/intelligence/search-engine/types";

const adapters: Record<IntelligencePlatform, IntelligenceSearchAdapter> = {
  YOUTUBE: youtubeSearchAdapter,
  GOOGLE_TRENDS: googleTrendsSearchAdapter,
  REDDIT: redditSearchAdapter,
  TIKTOK: demoTikTokSearchAdapter,
  SHOPEE: createDemoMarketplaceAdapter("SHOPEE"),
  TOKOPEDIA: createDemoMarketplaceAdapter("TOKOPEDIA")
};

export async function searchIntelligence(input: IntelligenceSearchInput) {
  const normalized = normalizeInput(input);
  const cached = await findCachedSearch(normalized);
  if (cached) {
    return {
      status: "CACHED",
      message: "Cached intelligence result digunakan untuk menghemat quota. Gunakan Refresh untuk mengambil data baru.",
      cached: true,
      runId: cached.id,
      results: cached.results.map(mapStoredResult),
      providers: await providerStates(normalized.platforms),
      sourceStatuses: await getIntelligenceSourceStatuses()
    };
  }

  const adapterResponses = await Promise.all(normalized.platforms.map(async (platform) => {
    try {
      return { platform, response: await adapters[platform].search(normalized) };
    } catch (error) {
      if (process.env.NODE_ENV === "development") serverLogger.error("intelligence.search.provider_failed", error, { platform });
      return { platform, response: { status: "ERROR", message: `${platform} provider failed. Returning partial results from other sources.`, results: [] } satisfies IntelligenceAdapterResult };
    }
  }));
  const results = adapterResponses.flatMap(({ response }) => response.results).slice(0, 50);
  const cacheKey = makeSearchCacheKey(normalized);
  const run = await prisma.intelligenceSearchRun.create({
    data: {
      query: normalized.keyword,
      niche: normalized.niche ?? "",
      mode: normalized.mode ?? "creator",
      platforms: normalized.platforms,
      region: normalized.region ?? "ID",
      language: normalized.language ?? "id",
      timeRange: normalized.timeRange ?? "7d",
      status: "COMPLETED",
      resultCount: results.length,
      cacheKey,
      cachedUntil: new Date(Date.now() + SEARCH_CACHE_MINUTES * 60000),
      results: { create: results.map(persistableResult) }
    }
  });

  return {
    status: results.length ? "READY" : "NO_RESULTS",
    message: results.length ? `${results.length} intelligence signals dikumpulkan.` : "Belum ada hasil. Periksa provider setup atau gunakan source demo.",
    cached: false,
    runId: run.id,
    results,
    providers: adapterResponses.map(({ platform, response }) => ({ platform, status: response.status, message: response.message })),
    sourceStatuses: await getIntelligenceSourceStatuses()
  };
}

function normalizeInput(input: IntelligenceSearchInput): IntelligenceSearchInput {
  const keyword = input.keyword.trim();
  if (keyword.length < 2) throw new Error("Keyword minimal 2 karakter.");
  const platforms = input.platforms.length ? [...new Set(input.platforms)] : ["GOOGLE_TRENDS", "YOUTUBE", "TIKTOK"] as IntelligencePlatform[];
  return {
    ...input,
    keyword,
    niche: input.niche?.trim(),
    platforms,
    region: input.region?.trim().toUpperCase() || "ID",
    language: input.language?.trim().toLowerCase() || "id",
    timeRange: input.timeRange ?? "7d",
    mode: input.mode ?? "creator",
    maxResults: Math.max(1, Math.min(10, Number(input.maxResults) || 10))
  };
}

function persistableResult(result: IntelligenceSearchResult) {
  return {
    id: result.id,
    keyword: result.keyword,
    topic: result.topic,
    platform: result.platform,
    source: result.source,
    sourceUrl: result.sourceUrl,
    score: result.trendScore,
    confidence: result.confidence,
    volumeLabel: result.views === undefined ? "Signal available" : `${result.views.toLocaleString("en-US")} views`,
    trendDirection: result.trendDirection,
    category: result.platform,
    region: result.region,
    language: result.language,
    collectedAt: new Date(result.collectedAt),
    rawData: JSON.parse(JSON.stringify({ ...result.rawData, sourceType: result.isDemo ? "demo" : "real", normalizedResult: result })) as Prisma.InputJsonValue,
    isDemo: result.isDemo,
    notes: result.notes
  };
}

function mapStoredResult(row: {
  id: string; keyword: string; topic: string; platform: string; source: string; sourceUrl: string | null; score: number;
  confidence: number; region: string; language: string; collectedAt: Date; rawData: unknown; isDemo: boolean; notes: string;
}): IntelligenceSearchResult {
  const raw = row.rawData && typeof row.rawData === "object" && !Array.isArray(row.rawData) ? row.rawData as Record<string, unknown> : {};
  const normalized = raw.normalizedResult;
  if (normalized && typeof normalized === "object" && !Array.isArray(normalized)) return normalized as IntelligenceSearchResult;
  return {
    id: row.id, keyword: row.keyword, topic: row.topic, title: row.topic, platform: row.platform as IntelligencePlatform,
    source: row.source, sourceUrl: row.sourceUrl ?? undefined, trendScore: row.score, contentPotentialScore: row.score,
    competitionScore: 50, recencyScore: 50, platformFitScore: 50, confidence: row.confidence, trendDirection: "UNKNOWN",
    region: row.region, language: row.language, rawData: raw, isDemo: row.isDemo, notes: row.notes, collectedAt: row.collectedAt.toISOString()
  };
}

async function providerStates(platforms: IntelligencePlatform[]) {
  return Promise.all(platforms.map(async (platform) => {
    try {
      return { platform, status: await adapters[platform].getStatus(), message: adapters[platform].getProviderInfo().setupHint ?? adapters[platform].getProviderInfo().source };
    } catch (error) {
      if (process.env.NODE_ENV === "development") serverLogger.error("intelligence.search.provider_status_failed", error, { platform });
      return { platform, status: "ERROR" as const, message: "Provider status check failed." };
    }
  }));
}

export type IntelligenceSearchResponse = Awaited<ReturnType<typeof searchIntelligence>>;
