import type { IntelligenceSourceStatus } from "./data-layer/types";

export async function getIntelligenceSourceStatuses(): Promise<IntelligenceSourceStatus[]> {
  const youtubeApiKey = process.env.YOUTUBE_API_KEY || process.env.YOUTUBE_DATA_API_KEY || "";
  const redditReady = Boolean(process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET && process.env.REDDIT_USER_AGENT);
  return [
    {
      source: "youtube",
      status: youtubeApiKey ? "real" : "disabled",
      message: youtubeApiKey ? "YouTube Data API key is configured." : "YOUTUBE_API_KEY is missing."
    },
    {
      source: "google_trends",
      status: process.env.GOOGLE_TRENDS_API_URL ? "real" : "disabled",
      message: process.env.GOOGLE_TRENDS_API_URL ? "Google Trends endpoint is configured." : "GOOGLE_TRENDS_API_URL is not configured; demo trend signals may be shown."
    },
    {
      source: "reddit",
      status: redditReady ? "real" : "disabled",
      message: redditReady ? "Reddit OAuth credentials are configured." : "Reddit is optional and currently disabled."
    },
    {
      source: "gemini",
      status: process.env.GEMINI_API_KEY ? "real" : "disabled",
      message: process.env.GEMINI_API_KEY ? "Gemini API key is configured." : "GEMINI_API_KEY is missing."
    }
  ];
}
