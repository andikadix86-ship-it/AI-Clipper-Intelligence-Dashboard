import { prisma } from "@/lib/prisma";
import type { SocialPlatform } from "@/lib/types";

export function calculateEngagementRate(input: { views: number; likes: number; comments: number; shares: number; saves: number }) {
  if (!input.views) return 0;
  return Number((((input.likes + input.comments + input.shares + input.saves) / input.views) * 100).toFixed(2));
}

export type PerformanceInput = {
  contentItemId: string;
  socialAccountId: string;
  postingScheduleId?: string;
  platform: SocialPlatform;
  projectId?: string;
  postUrl?: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  watchTime: number;
  averageViewDuration: number;
  followersGained: number;
  postedAt?: string;
  notes?: string;
};

export async function upsertPerformance(input: PerformanceInput) {
  const engagementRate = calculateEngagementRate(input);
  const data = {
    projectId: input.projectId || undefined,
    contentItemId: input.contentItemId,
    socialAccountId: input.socialAccountId,
    postingScheduleId: input.postingScheduleId || undefined,
    platform: input.platform,
    postUrl: input.postUrl ?? "",
    views: Math.max(0, Number(input.views) || 0),
    likes: Math.max(0, Number(input.likes) || 0),
    comments: Math.max(0, Number(input.comments) || 0),
    shares: Math.max(0, Number(input.shares) || 0),
    saves: Math.max(0, Number(input.saves) || 0),
    watchTime: Math.max(0, Number(input.watchTime) || 0),
    averageViewDuration: Math.max(0, Number(input.averageViewDuration) || 0),
    followersGained: Math.max(0, Number(input.followersGained) || 0),
    engagementRate,
    postedAt: input.postedAt ? new Date(input.postedAt) : undefined,
    recordedAt: new Date(),
    capturedAt: new Date(),
    notes: input.notes ?? ""
  };

  if (input.postingScheduleId) {
    const existing = await prisma.postAnalytics.findFirst({ where: { postingScheduleId: input.postingScheduleId } });
    if (existing) {
      return prisma.postAnalytics.update({ where: { id: existing.id }, data });
    }
  }

  return prisma.postAnalytics.create({ data });
}

export async function getAnalyticsSummary() {
  const rows = await prisma.postAnalytics.findMany({
    orderBy: { recordedAt: "desc" },
    include: { contentItem: true, socialAccount: true }
  });

  const totals = rows.reduce(
    (acc, row) => ({
      views: acc.views + row.views,
      likes: acc.likes + row.likes,
      comments: acc.comments + row.comments,
      shares: acc.shares + row.shares,
      saves: acc.saves + row.saves,
      watchTime: acc.watchTime + row.watchTime
    }),
    { views: 0, likes: 0, comments: 0, shares: 0, saves: 0, watchTime: 0 }
  );

  const topContent = rows.reduce((best, row) => (!best || row.views > best.views ? row : best), rows[0]);
  const byAccount = new Map<string, { name: string; views: number; engagement: number; count: number }>();
  rows.forEach((row) => {
    const current = byAccount.get(row.socialAccountId) ?? { name: row.socialAccount.name, views: 0, engagement: 0, count: 0 };
    current.views += row.views;
    current.engagement += row.engagementRate;
    current.count += 1;
    byAccount.set(row.socialAccountId, current);
  });
  const topAccount = Array.from(byAccount.values()).sort((a, b) => b.views - a.views)[0];

  return {
    rows,
    totals,
    topContent,
    topAccount,
    engagementRate: calculateEngagementRate(totals)
  };
}
