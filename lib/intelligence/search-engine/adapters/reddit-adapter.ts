import type { IntelligenceSearchAdapter } from "@/lib/intelligence/search-engine/types";
import { getRedditOAuthStatus } from "@/lib/intelligence/reddit-oauth";

export const redditSearchAdapter: IntelligenceSearchAdapter = {
  async search() {
    const oauth = getRedditOAuthStatus();
    return {
      status: oauth.status === "READY" ? "CONNECTED" : "NOT_CONFIGURED",
      message: oauth.message,
      results: []
    };
  },
  async getStatus() {
    return getRedditOAuthStatus().status === "READY" ? "CONNECTED" : "NOT_CONFIGURED";
  },
  getProviderInfo() {
    return { name: "Reddit", source: "Optional Reddit API OAuth insight source", isDemo: false, setupHint: "Optional. Configure Reddit OAuth only when additional community insight is needed. Scraping is not used." };
  }
};
