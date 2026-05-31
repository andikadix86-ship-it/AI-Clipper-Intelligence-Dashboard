import { NextResponse } from "next/server";
import { demoGoogleTrendsAdapter } from "@/lib/intelligence/google-trends";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const keyword = url.searchParams.get("keyword")?.trim();
  const region = url.searchParams.get("region") ?? "ID";
  const timeRange = url.searchParams.get("timeRange") === "30d" ? "30d" : "7d";
  const results = keyword
    ? await demoGoogleTrendsAdapter.searchGoogleTrends(keyword, { region, timeRange })
    : await demoGoogleTrendsAdapter.getTrendingSearches(region);
  return NextResponse.json({
    status: "DEMO",
    message: "Demo Google Trends. Belum terhubung ke data real.",
    results
  });
}
