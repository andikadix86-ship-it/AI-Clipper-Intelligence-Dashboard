export type IntelligenceMode = "creator" | "affiliate";
export type IntelligenceTimeRange = "7d" | "30d" | "90d";
export type IntelligencePlatform = "YOUTUBE" | "GOOGLE_TRENDS" | "REDDIT" | "TIKTOK" | "SHOPEE" | "TOKOPEDIA";
export type AdapterStatus = "CONNECTED" | "MISSING" | "ERROR" | "DEMO";

export type IntelligenceSearchInput = {
  keyword: string;
  niche?: string;
  platforms: IntelligencePlatform[];
  region?: string;
  language?: string;
  timeRange?: IntelligenceTimeRange;
  mode?: IntelligenceMode;
  maxResults?: number;
  refresh?: boolean;
};

export type IntelligenceSearchResult = {
  id: string;
  keyword: string;
  topic: string;
  title: string;
  platform: IntelligencePlatform;
  source: string;
  sourceUrl?: string;
  thumbnailUrl?: string;
  author?: string;
  publishedAt?: string;
  views?: number;
  likes?: number;
  comments?: number;
  engagementRate?: number;
  trendScore: number;
  contentPotentialScore: number;
  competitionScore: number;
  recencyScore: number;
  platformFitScore: number;
  confidence: number;
  trendDirection: "RISING" | "STABLE" | "FALLING" | "UNKNOWN";
  region: string;
  language: string;
  rawData: Record<string, unknown>;
  isDemo: boolean;
  notes: string;
  collectedAt: string;
};

export type IntelligenceAdapterResult = {
  status: AdapterStatus;
  message: string;
  results: IntelligenceSearchResult[];
};

export interface IntelligenceSearchAdapter {
  search(input: IntelligenceSearchInput): Promise<IntelligenceAdapterResult>;
  getStatus(): Promise<AdapterStatus>;
  getProviderInfo(): { name: string; source: string; isDemo: boolean; setupHint?: string };
}

