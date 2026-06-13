import { NextResponse } from "next/server";
import { generateIntelligenceRecommendations } from "@/lib/intelligence/recommendation-engine";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const niche = url.searchParams.get("niche")?.trim();
  const source = url.searchParams.get("source");
  const includeDemo = source === "demo" || source === "all";
  const recommendations = await generateIntelligenceRecommendations({ niche, includeDemo });
  return NextResponse.json({ recommendations, sourceMode: includeDemo ? "demo_enabled" : "real_only" });
}
