import { prisma } from "@/lib/prisma";
import type { IntelligenceSearchInput } from "@/lib/intelligence/search-engine/types";

export const SEARCH_CACHE_MINUTES = 30;

export function makeSearchCacheKey(input: IntelligenceSearchInput) {
  return [
    input.keyword.trim().toLowerCase(),
    input.niche?.trim().toLowerCase() ?? "",
    [...input.platforms].sort().join(","),
    input.region ?? "ID",
    input.language ?? "id",
    input.timeRange ?? "7d",
    input.mode ?? "creator"
  ].join("|");
}

export async function findCachedSearch(input: IntelligenceSearchInput) {
  if (input.refresh) return null;
  return prisma.intelligenceSearchRun.findFirst({
    where: { cacheKey: makeSearchCacheKey(input), cachedUntil: { gt: new Date() }, status: "COMPLETED" },
    include: { results: true }
  });
}

