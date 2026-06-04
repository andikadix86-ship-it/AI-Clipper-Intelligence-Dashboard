export type TrendSourceName = "Google Trends" | "YouTube" | "Reddit" | "Knowledge Base";
export type TrendSourceMode = "real" | "fallback" | "knowledge";

export type TrendSignal = {
  source: TrendSourceName;
  keyword: string;
  trend_score: number;
  confidence_score: number;
  collected_at: string;
  mode: TrendSourceMode;
  message: string;
};

export type TrendSourceInput = { niche: string; platform: string; keyword: string };
export type TrendSourceOptions = {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  env?: Record<string, string | undefined>;
  knowledgeOptions?: { disableDatabase?: boolean; localFile?: string; disableLocalJson?: boolean };
};

export interface TrendSourceAdapter {
  source: TrendSourceName;
  collect(input: TrendSourceInput, options?: TrendSourceOptions): Promise<TrendSignal[]>;
}

export type AggregatedTrendSignals = {
  source: TrendSourceName[];
  keyword: string;
  niche: string;
  platform: string;
  trend_score: number;
  opportunity_score: number;
  competition_score: number;
  confidence_score: number;
  recommended_topics: string[];
  rising_keywords: string[];
  declining_keywords: string[];
  collected_at: string;
  signals: TrendSignal[];
  feedback: { saved: number; skipped: number };
};
