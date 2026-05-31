import { prisma } from "@/lib/prisma";

export type RecommendationDto = {
  id?: string;
  insightType: string;
  title: string;
  description: string;
  score: number;
  recommendation: string;
  priority: "High" | "Medium" | "Low";
  projectId?: string;
  socialAccountId?: string;
  contentItemId?: string;
  createdAt?: string;
  source: string;
  confidence: number;
  isDemo: boolean;
  notes: string;
};

export const fallbackRecommendations: RecommendationDto[] = [
  {
    insightType: "NEXT_CONTENT",
    title: "Create another proof-first AI workflow clip",
    description: "Dummy insight: educational AI workflow content with visible proof tends to generate saves and shares.",
    score: 88,
    recommendation: "Produce a 30-45s clip that opens with the final result, then reveals the workflow in three steps.",
    priority: "High",
    source: "Sample recommendation dataset",
    confidence: 30,
    isDemo: true,
    notes: "Demo insight. Generate recommendations after entering manual PostAnalytics for data-backed output."
  },
  {
    insightType: "POSTING_TIME",
    title: "Best posting window: 19:00-21:00",
    description: "Dummy insight: evening posts usually match creator audience availability in Asia/Jakarta.",
    score: 82,
    recommendation: "Schedule the next three approved posts between 19:00 and 21:00.",
    priority: "Medium",
    source: "Sample recommendation dataset",
    confidence: 30,
    isDemo: true,
    notes: "Demo insight. No real posting-time dataset is connected."
  },
  {
    insightType: "RETENTION",
    title: "Strengthen first 3 seconds",
    description: "Dummy insight: short-form content needs immediate proof or a direct problem statement.",
    score: 74,
    recommendation: "Use a stronger opening hook and show the payoff before explaining the process.",
    priority: "Medium",
    source: "Sample recommendation dataset",
    confidence: 30,
    isDemo: true,
    notes: "Demo insight. Enter average view duration to generate a data-backed retention recommendation."
  }
];

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function priority(score: number): "High" | "Medium" | "Low" {
  if (score >= 80) return "High";
  if (score >= 60) return "Medium";
  return "Low";
}

const manualAnalyticsMeta = {
  source: "Manual PostAnalytics",
  confidence: 72,
  isDemo: false,
  notes: "Rule-based recommendation calculated from manually recorded performance metrics."
};

function scoreRow(row: {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  watchTime: number;
  averageViewDuration: number;
  followersGained: number;
  engagementRate: number;
}) {
  const performanceScore = clampScore(Math.log10(Math.max(row.views, 1)) * 18);
  const engagementScore = clampScore(row.engagementRate * 8);
  const retentionScore = clampScore(row.averageViewDuration * 4);
  const growthScore = clampScore(row.followersGained * 3 + row.saves * 0.2);
  const viralPotentialScore = clampScore(performanceScore * 0.28 + engagementScore * 0.28 + retentionScore * 0.18 + growthScore * 0.18 + Math.min(row.shares, 250) * 0.08);
  return { performanceScore, engagementScore, retentionScore, growthScore, viralPotentialScore };
}

export async function generateRecommendationInsights() {
  const rows = await prisma.postAnalytics.findMany({
    orderBy: { recordedAt: "desc" },
    include: { contentItem: { include: { project: true } }, socialAccount: true }
  });

  if (!rows.length) {
    await prisma.recommendationInsight.createMany({
      data: fallbackRecommendations.map((item) => ({
        insightType: item.insightType,
        title: item.title,
        description: item.description,
        score: item.score,
        recommendation: item.recommendation,
        priority: item.priority
      }))
    });
    return getRecommendationInsights();
  }

  const insights: RecommendationDto[] = [];
  const best = [...rows].sort((a, b) => scoreRow(b).viralPotentialScore - scoreRow(a).viralPotentialScore)[0];
  const weakest = [...rows].sort((a, b) => scoreRow(a).viralPotentialScore - scoreRow(b).viralPotentialScore)[0];
  const bestScores = scoreRow(best);
  const weakScores = scoreRow(weakest);

  insights.push({
    insightType: "HIGH_PERFORMING",
    title: `Scale: ${best.contentItem.title}`,
    description: `Performance ${bestScores.performanceScore}, engagement ${bestScores.engagementScore}, retention ${bestScores.retentionScore}, growth ${bestScores.growthScore}.`,
    score: bestScores.viralPotentialScore,
    recommendation: best.engagementRate > 8
      ? "Create a similar content angle and keep the CTA because engagement is above 8%."
      : "Views are promising, but improve CTA and payoff clarity to lift engagement.",
    priority: priority(bestScores.viralPotentialScore),
    projectId: best.projectId ?? undefined,
    socialAccountId: best.socialAccountId,
    contentItemId: best.contentItemId,
    ...manualAnalyticsMeta
  });

  insights.push({
    insightType: "LOW_PERFORMING",
    title: `Improve: ${weakest.contentItem.title}`,
    description: `This content has viral potential score ${weakScores.viralPotentialScore}. Average view duration is ${weakest.averageViewDuration}s.`,
    score: weakScores.viralPotentialScore,
    recommendation: weakest.averageViewDuration < 8
      ? "Rewrite the first 3 seconds with a direct result or stronger curiosity gap."
      : "Keep the topic, but tighten pacing and add a clearer CTA before the ending.",
    priority: weakScores.viralPotentialScore < 55 ? "High" : "Medium",
    projectId: weakest.projectId ?? undefined,
    socialAccountId: weakest.socialAccountId,
    contentItemId: weakest.contentItemId,
    ...manualAnalyticsMeta
  });

  const shareWinner = [...rows].sort((a, b) => b.shares - a.shares)[0];
  insights.push({
    insightType: "CONTENT_PATTERN",
    title: "Replicate shareable pattern",
    description: `${shareWinner.contentItem.title} produced ${shareWinner.shares} shares and ${shareWinner.saves} saves.`,
    score: clampScore(shareWinner.shares * 1.5 + shareWinner.saves),
    recommendation: shareWinner.saves > shareWinner.shares
      ? "Make the next content more educational: checklist, workflow, or step-by-step format."
      : "Make a follow-up with the same emotional trigger and a sharper share CTA.",
    priority: priority(clampScore(shareWinner.shares * 1.5 + shareWinner.saves)),
    projectId: shareWinner.projectId ?? undefined,
    socialAccountId: shareWinner.socialAccountId,
    contentItemId: shareWinner.contentItemId,
    ...manualAnalyticsMeta
  });

  const growthWinner = [...rows].sort((a, b) => b.followersGained - a.followersGained)[0];
  insights.push({
    insightType: "ACCOUNT_GROWTH",
    title: `Potential niche: ${growthWinner.contentItem.project?.niche ?? growthWinner.socialAccount.niche ?? "Creator workflow"}`,
    description: `${growthWinner.followersGained} followers gained from ${growthWinner.contentItem.title}.`,
    score: clampScore(growthWinner.followersGained * 4 + growthWinner.engagementRate * 4),
    recommendation: "Prioritize this niche for the next batch and schedule one variant for each active social account.",
    priority: priority(clampScore(growthWinner.followersGained * 4 + growthWinner.engagementRate * 4)),
    projectId: growthWinner.projectId ?? undefined,
    socialAccountId: growthWinner.socialAccountId,
    contentItemId: growthWinner.contentItemId,
    ...manualAnalyticsMeta
  });

  insights.push({
    insightType: "POSTING_TIME",
    title: "Best posting time: 19:00-21:00",
    description: "Rule-based recommendation using current manual analytics and the app's Asia/Jakarta operating window.",
    score: 84,
    recommendation: "Post the next approved content between 19:00 and 21:00, then compare performance after 24 hours.",
    priority: "Medium",
    ...manualAnalyticsMeta
  });

  await prisma.recommendationInsight.createMany({
    data: insights.map((item) => ({
      projectId: item.projectId,
      socialAccountId: item.socialAccountId,
      contentItemId: item.contentItemId,
      insightType: item.insightType,
      title: item.title,
      description: item.description,
      score: item.score,
      recommendation: item.recommendation,
      priority: item.priority
    }))
  });

  return getRecommendationInsights();
}

export async function getRecommendationInsights() {
  const rows = await prisma.recommendationInsight.findMany({
    orderBy: { createdAt: "desc" },
    take: 12
  });

  if (!rows.length) return fallbackRecommendations;

  return rows.map((row) => {
    const isDemo = row.description.toLowerCase().includes("dummy insight");
    return {
    id: row.id,
    insightType: row.insightType,
    title: row.title,
    description: row.description,
    score: row.score,
    recommendation: row.recommendation,
    priority: row.priority as "High" | "Medium" | "Low",
    projectId: row.projectId ?? undefined,
    socialAccountId: row.socialAccountId ?? undefined,
    contentItemId: row.contentItemId ?? undefined,
      createdAt: row.createdAt.toISOString(),
      source: isDemo ? "Sample recommendation dataset" : "Manual PostAnalytics",
      confidence: isDemo ? 30 : 72,
      isDemo,
      notes: isDemo ? "Demo insight. Record manual performance to generate data-backed recommendations." : "Rule-based recommendation calculated from manually recorded performance metrics."
    };
  });
}
