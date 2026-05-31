export type IntelligenceDirection = "RISING" | "STABLE" | "FALLING";

export type IntelligenceResultDto = {
  id: string;
  keyword: string;
  topic: string;
  platform: string;
  source: string;
  sourceUrl?: string;
  score: number;
  confidence: number;
  volumeLabel: string;
  trendDirection: IntelligenceDirection;
  category: string;
  region: string;
  language: string;
  collectedAt: string;
  rawData?: Record<string, unknown>;
  isDemo: boolean;
  notes: string;
  hashtag: string;
  competitionLevel: "Low" | "Medium" | "High";
  monetizationPotential: "Low" | "Medium" | "High";
  viralReason: string;
  opportunity: string;
  socialPlatform: "TIKTOK" | "YOUTUBE_SHORTS" | "INSTAGRAM_REELS" | "FACEBOOK_REELS";
};

export type AffiliateProductInsightDto = {
  id: string;
  productName: string;
  platform: "Shopee" | "TikTok Shop" | "Tokopedia";
  category: string;
  trendScore: number;
  competitionLevel: "Low" | "Medium" | "High";
  commissionEstimate: string;
  priceRange: string;
  contentPotentialScore: number;
  source: string;
  sourceUrl?: string;
  confidence: number;
  collectedAt: string;
  isDemo: boolean;
  notes: string;
};

export type TrendScoreInput = {
  trendSignal: number;
  contentPotential: number;
  competitionLevel: "Low" | "Medium" | "High";
  recencyHours: number;
  platformFit: number;
};

export type RecommendationScoreBreakdown = {
  trendStrength: number;
  contentPotential: number;
  competitionOpportunity: number;
  recency: number;
  platformFit: number;
  historicalPerformance?: number;
  commissionPotential?: number;
  campaignReadiness?: number;
};

export type IntelligenceRecommendationDto = {
  id: string;
  recommendedTopic: string;
  reason: string;
  contentAngle: string;
  platformFit: string;
  score: number;
  confidence: number;
  recommendedAction: "Create short video" | "Create product review" | "Save to campaign" | "Send to Creative Studio" | "Monitor first";
  sourceBreakdown: Array<{ source: string; label: string; value: string; isDemo: boolean }>;
  scoreBreakdown: RecommendationScoreBreakdown;
  collectedAt: string;
  isDemo: boolean;
  notes: string;
  keyword: string;
  socialPlatform: IntelligenceResultDto["socialPlatform"];
  sourceUrl?: string;
  riskNote: string;
};
