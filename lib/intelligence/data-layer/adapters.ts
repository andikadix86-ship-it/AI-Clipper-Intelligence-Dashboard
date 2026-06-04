import { searchKnowledge } from "../../knowledge-base/repository";
import { clampScore, fallbackTrendSignals } from "./fallback-data";
import type { TrendSignal, TrendSourceAdapter, TrendSourceInput, TrendSourceName, TrendSourceOptions } from "./types";

export const googleTrendsDataAdapter: TrendSourceAdapter = {
  source: "Google Trends",
  collect: (input, options) => collectGoogleTrends(input, options)
};

export const youtubeDataAdapter: TrendSourceAdapter = {
  source: "YouTube",
  collect: (input, options) => collectYouTube(input, options)
};

export const redditTrendAdapter: TrendSourceAdapter = {
  source: "Reddit",
  collect: (input, options) => collectReddit(input, options)
};

export const knowledgeBaseTrendAdapter: TrendSourceAdapter = {
  source: "Knowledge Base",
  collect: (input, options) => collectKnowledge(input, options)
};

export const trendSourceAdapters: TrendSourceAdapter[] = [googleTrendsDataAdapter, youtubeDataAdapter, redditTrendAdapter, knowledgeBaseTrendAdapter];

async function collectGoogleTrends(input: TrendSourceInput, options: TrendSourceOptions = {}) {
  const endpoint = environment(options).GOOGLE_TRENDS_API_URL;
  if (!endpoint) return fallbackTrendSignals("Google Trends", input, "Google Trends endpoint belum dikonfigurasi. Dummy trend data digunakan.");
  try {
    const url = new URL(endpoint);
    url.searchParams.set("keyword", input.keyword);
    url.searchParams.set("niche", input.niche);
    const payload = await fetchJson(url, options);
    const rows = array(payload.signals ?? payload.results);
    if (!rows.length) throw new Error("INVALID_RESPONSE");
    return rows.slice(0, 8).map((row) => signal("Google Trends", String(row.keyword ?? input.keyword), row.trend_score ?? row.score, row.confidence_score ?? row.confidence, "real", "Collected from configured Google Trends endpoint."));
  } catch (error) {
    return fallbackTrendSignals("Google Trends", input, fallbackMessage("Google Trends", error));
  }
}

async function collectYouTube(input: TrendSourceInput, options: TrendSourceOptions = {}) {
  const apiKey = environment(options).YOUTUBE_API_KEY ?? environment(options).YOUTUBE_DATA_API_KEY;
  if (!apiKey) return fallbackTrendSignals("YouTube", input, "YouTube API key belum dikonfigurasi. Dummy trend data digunakan.");
  try {
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("type", "video");
    url.searchParams.set("maxResults", "8");
    url.searchParams.set("order", "viewCount");
    url.searchParams.set("q", input.keyword);
    url.searchParams.set("key", apiKey);
    const payload = await fetchJson(url, options);
    const rows = array(payload.items);
    if (!rows.length) throw new Error("INVALID_RESPONSE");
    return rows.map((row, index) => {
      const snippet = object(row.snippet);
      const keyword = String(snippet.title ?? input.keyword);
      return signal("YouTube", keyword, 86 - index * 4, 78, "real", "Collected from YouTube Data API v3.");
    });
  } catch (error) {
    return fallbackTrendSignals("YouTube", input, fallbackMessage("YouTube", error));
  }
}

async function collectReddit(input: TrendSourceInput, options: TrendSourceOptions = {}) {
  const env = environment(options);
  if (!env.REDDIT_CLIENT_ID || !env.REDDIT_CLIENT_SECRET || !env.REDDIT_USER_AGENT) return fallbackTrendSignals("Reddit", input, "Reddit OAuth belum dikonfigurasi. Dummy trend data digunakan.");
  try {
    const token = await fetchJson(new URL("https://www.reddit.com/api/v1/access_token"), {
      ...options,
      method: "POST",
      headers: { Authorization: `Basic ${Buffer.from(`${env.REDDIT_CLIENT_ID}:${env.REDDIT_CLIENT_SECRET}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded", "User-Agent": env.REDDIT_USER_AGENT },
      body: "grant_type=client_credentials"
    });
    if (!token.access_token) throw new Error("INVALID_RESPONSE");
    const url = new URL("https://oauth.reddit.com/search");
    url.searchParams.set("q", input.keyword);
    url.searchParams.set("sort", "hot");
    url.searchParams.set("limit", "8");
    const payload = await fetchJson(url, { ...options, headers: { Authorization: `Bearer ${token.access_token}`, "User-Agent": env.REDDIT_USER_AGENT } });
    const rows = array(object(payload.data).children);
    if (!rows.length) throw new Error("INVALID_RESPONSE");
    return rows.map((row, index) => {
      const data = object(row.data);
      const engagement = Number(data.score ?? 0) + Number(data.num_comments ?? 0) * 2;
      return signal("Reddit", String(data.title ?? input.keyword), Math.min(92, 58 + Math.log10(engagement + 1) * 12 - index), 72, "real", "Collected from Reddit OAuth search.");
    });
  } catch (error) {
    return fallbackTrendSignals("Reddit", input, fallbackMessage("Reddit", error));
  }
}

async function collectKnowledge(input: TrendSourceInput, options: TrendSourceOptions = {}) {
  try {
    const rows = await searchKnowledge(input.keyword, { ...options.knowledgeOptions, platform: input.platform, niche: input.niche, take: 8 });
    if (!rows.length) return fallbackTrendSignals("Knowledge Base", input, "Belum ada Knowledge Base match. Dummy trend data digunakan.");
    return rows.map((row) => signal("Knowledge Base", row.title, row.confidence_score, row.confidence_score, "knowledge", "Collected from Internal Knowledge Base."));
  } catch (error) {
    return fallbackTrendSignals("Knowledge Base", input, fallbackMessage("Knowledge Base", error));
  }
}

async function fetchJson(url: URL, options: TrendSourceOptions & { method?: string; headers?: Record<string, string>; body?: string }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 5000);
  try {
    const response = await (options.fetchImpl ?? fetch)(url, { method: options.method ?? "GET", headers: options.headers, body: options.body, signal: controller.signal, cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP_${response.status}`);
    return object(await response.json());
  } finally {
    clearTimeout(timeout);
  }
}

function signal(source: TrendSourceName, keyword: string, score: unknown, confidence: unknown, mode: TrendSignal["mode"], message: string): TrendSignal {
  return { source, keyword, trend_score: clampScore(score), confidence_score: clampScore(confidence, 60), collected_at: new Date().toISOString(), mode, message };
}
function environment(options: TrendSourceOptions) { return options.env ?? process.env; }
function array(value: unknown): Array<Record<string, unknown>> { return Array.isArray(value) ? value.filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === "object") : []; }
function object(value: unknown): Record<string, any> { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, any> : {}; }
function fallbackMessage(source: string, error: unknown) { return `${source} gagal (${error instanceof Error ? error.message : "unknown error"}). Dummy trend data digunakan.`; }
