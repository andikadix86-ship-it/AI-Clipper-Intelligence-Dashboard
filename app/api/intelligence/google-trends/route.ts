import { NextResponse } from "next/server";
import { demoGoogleTrendsAdapter } from "@/lib/intelligence/google-trends";
import { serverLogger } from "@/lib/server-logger";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const keyword = url.searchParams.get("keyword")?.trim();
  const region = url.searchParams.get("region") ?? "ID";
  const timeRange = url.searchParams.get("timeRange") === "30d" ? "30d" : "7d";
  if (process.env.GOOGLE_TRENDS_API_URL) {
    try {
      const endpoint = new URL(process.env.GOOGLE_TRENDS_API_URL);
      if (keyword) endpoint.searchParams.set("keyword", keyword);
      endpoint.searchParams.set("region", region);
      endpoint.searchParams.set("timeRange", timeRange);
      const response = await fetch(endpoint, { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error?.message ?? `HTTP_${response.status}`);
      return NextResponse.json({
        status: "REAL",
        message: "Google Trends real endpoint returned data.",
        results: payload.results ?? payload.signals ?? []
      });
    } catch (error) {
      if (process.env.NODE_ENV === "development") serverLogger.error("intelligence.google_trends.api_error", error);
    }
  }
  const results = keyword
    ? await demoGoogleTrendsAdapter.searchGoogleTrends(keyword, { region, timeRange })
    : await demoGoogleTrendsAdapter.getTrendingSearches(region);
  return NextResponse.json({
    status: "DEMO",
    message: "Demo Google Trends. Belum terhubung ke data real.",
    results
  });
}
