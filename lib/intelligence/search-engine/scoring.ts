function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function calculateContentPotential(input: { trendScore: number; engagementRate?: number; recencyScore: number; platformFitScore: number }) {
  const engagementSignal = clamp((input.engagementRate ?? 0) * 12);
  return clamp(input.trendScore * 0.45 + engagementSignal * 0.2 + input.recencyScore * 0.15 + input.platformFitScore * 0.2);
}

export function calculateCompetitionScore(input: { views?: number; title?: string; keyword: string }) {
  const viewPressure = Math.min(50, Math.log10(Math.max(1, input.views ?? 1)) * 8);
  const tokens = input.keyword.toLowerCase().split(/\s+/).filter(Boolean);
  const title = input.title?.toLowerCase() ?? "";
  const relevancePressure = tokens.length ? tokens.filter((token) => title.includes(token)).length / tokens.length * 35 : 0;
  return clamp(15 + viewPressure + relevancePressure);
}

export function competitionOpportunity(competitionScore: number) {
  return clamp(100 - competitionScore);
}

