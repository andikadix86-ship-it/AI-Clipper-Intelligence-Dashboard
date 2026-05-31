import { NextResponse } from "next/server";
import { generateIntelligenceRecommendations } from "@/lib/intelligence/recommendation-engine";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const niche = new URL(request.url).searchParams.get("niche")?.trim();
  const recommendations = await generateIntelligenceRecommendations({ niche });
  return NextResponse.json({ recommendations });
}
