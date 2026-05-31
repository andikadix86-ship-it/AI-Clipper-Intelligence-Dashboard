import { prisma } from "@/lib/prisma";

export const youtubeQuotaCosts = {
  "search.list": 100,
  "videos.list": 1
} as const;

export async function logYouTubeQuota(input: {
  endpoint: keyof typeof youtubeQuotaCosts;
  keyword: string;
  region: string;
  status: "SUCCESS" | "ERROR";
  errorMessage?: string;
}) {
  try {
    return await prisma.youTubeQuotaLog.create({
      data: {
        endpoint: input.endpoint,
        keyword: input.keyword,
        region: input.region,
        estimatedCost: youtubeQuotaCosts[input.endpoint],
        status: input.status,
        errorMessage: input.errorMessage
      }
    });
  } catch {
    return undefined;
  }
}

export async function getYouTubeQuotaSummary() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const [aggregate, lastRequest, recent] = await Promise.all([
    prisma.youTubeQuotaLog.aggregate({ where: { createdAt: { gte: startOfDay } }, _sum: { estimatedCost: true }, _count: true }),
    prisma.youTubeQuotaLog.findFirst({ orderBy: { createdAt: "desc" } }),
    prisma.youTubeQuotaLog.findMany({ orderBy: { createdAt: "desc" }, take: 10 })
  ]);
  const estimatedUsedToday = aggregate._sum.estimatedCost ?? 0;
  return {
    estimatedUsedToday,
    requestCountToday: aggregate._count,
    lastRequest,
    recent,
    warning: estimatedUsedToday >= 8000
      ? "Quota estimate tinggi. Hentikan exploratory search dan tunggu reset quota."
      : estimatedUsedToday >= 5000
        ? "Quota estimate sudah melewati 50% dari default 10,000 unit harian."
        : ""
  };
}
