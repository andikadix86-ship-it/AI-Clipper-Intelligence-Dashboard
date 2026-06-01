import { NextResponse } from "next/server";
import { getRecommendationInsights } from "@/lib/recommendation-service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const recommendations = await getRecommendationInsights();
    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error("[recommendations] Database unavailable while loading recommendations.", error);
    return NextResponse.json({ recommendations: [], source: "fallback", message: "Database unavailable, using empty recommendation list." });
  }
}
