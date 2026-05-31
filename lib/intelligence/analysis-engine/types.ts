import type { IntelligenceMode, IntelligenceSearchResult } from "@/lib/intelligence/search-engine/types";

export type AnalysisLevel = "LOW" | "MEDIUM" | "HIGH";
export type TrendStage = "EMERGING" | "GROWING" | "PEAK" | "DECLINING" | "UNKNOWN";

export type DataDrivenAnalysisInput = {
  result: IntelligenceSearchResult;
  mode: IntelligenceMode;
};

export type DataDrivenAnalysisOutput = {
  id?: string;
  resultId: string;
  keyword: string;
  mode: IntelligenceMode;
  summary: string;
  trendStage: TrendStage;
  audience: string;
  contentGap: string;
  opportunityLevel: AnalysisLevel;
  riskLevel: AnalysisLevel;
  competitionLevel: AnalysisLevel;
  recommendedAngles: string[];
  recommendedHooks: string[];
  recommendedContentFormats: string[];
  platformRecommendation: string;
  actionPlan: string[];
  score: number;
  scoreBreakdown: Record<string, number>;
  sourceBreakdown: Array<{ source: string; isDemo: boolean; collectedAt: string; confidence: number }>;
  confidence: number;
  isDemo: boolean;
  notes: string;
  createdAt: string;
};

