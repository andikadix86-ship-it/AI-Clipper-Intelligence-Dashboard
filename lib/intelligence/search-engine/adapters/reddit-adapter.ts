import type { IntelligenceSearchAdapter } from "@/lib/intelligence/search-engine/types";
import { getRedditOAuthStatus } from "@/lib/intelligence/reddit-oauth";

export const redditSearchAdapter: IntelligenceSearchAdapter = {
  async search() {
    const oauth = getRedditOAuthStatus();
    return {
      status: oauth.status === "READY" ? "CONNECTED" : "MISSING",
      message: oauth.message,
      results: []
    };
  },
  async getStatus() {
    return getRedditOAuthStatus().status === "READY" ? "CONNECTED" : "MISSING";
  },
  getProviderInfo() {
    return { name: "Reddit", source: "Reddit API OAuth foundation", isDemo: false, setupHint: "Configure Reddit OAuth credentials before enabling search. Scraping is not used." };
  }
};
