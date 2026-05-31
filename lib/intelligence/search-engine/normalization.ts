import type { IntelligenceResultDto } from "@/lib/intelligence/types";
import { calculateCompetitionScore, calculateContentPotential } from "@/lib/intelligence/search-engine/scoring";
import type { IntelligencePlatform, IntelligenceSearchResult } from "@/lib/intelligence/search-engine/types";

export function normalizeLegacyResult(result: IntelligenceResultDto, platform = result.platform as IntelligencePlatform): IntelligenceSearchResult {
  const raw = result.rawData ?? {};
  const scoreBreakdown = typeof raw.scoreBreakdown === "object" && raw.scoreBreakdown ? raw.scoreBreakdown as Record<string, unknown> : {};
  const views = numberValue(raw.viewCount);
  const likes = numberValue(raw.likeCount);
  const comments = numberValue(raw.commentCount);
  const engagementRate = numberValue(scoreBreakdown.engagementRate) ?? (views ? ((likes ?? 0) + (comments ?? 0)) / views * 100 : undefined);
  const recencyScore = numberValue(scoreBreakdown.recencyScore) ?? recencyFromDate(stringValue(raw.publishedAt) ?? result.collectedAt);
  const platformFitScore = numberValue(raw.platformFit) ?? (platform === "YOUTUBE" ? 86 : 78);
  const competitionScore = calculateCompetitionScore({ views, title: result.topic, keyword: result.keyword });
  return {
    id: result.id,
    keyword: result.keyword,
    topic: result.topic,
    title: result.topic,
    platform,
    source: result.source,
    sourceUrl: result.sourceUrl,
    thumbnailUrl: stringValue(raw.thumbnail),
    author: stringValue(raw.channelTitle),
    publishedAt: stringValue(raw.publishedAt),
    views,
    likes,
    comments,
    engagementRate,
    trendScore: result.score,
    contentPotentialScore: calculateContentPotential({ trendScore: result.score, engagementRate, recencyScore, platformFitScore }),
    competitionScore,
    recencyScore,
    platformFitScore,
    confidence: result.confidence,
    trendDirection: result.trendDirection,
    region: result.region,
    language: result.language,
    rawData: raw,
    isDemo: result.isDemo,
    notes: result.notes,
    collectedAt: result.collectedAt
  };
}

function recencyFromDate(value: string) {
  const hours = Math.max(0, (Date.now() - new Date(value).getTime()) / 3600000);
  return Math.max(0, Math.min(100, Math.round(100 - Math.min(hours, 720) * 0.12)));
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

