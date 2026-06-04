import { NextResponse } from "next/server";
import { getRecommendationInsights } from "@/lib/recommendation-service";
import { serverLogger } from "@/lib/server-logger";

export const runtime = "nodejs";

export async function GET() {
  try {
    const recommendations = await getRecommendationInsights();
    return NextResponse.json({ recommendations });
  } catch (error) {
    serverLogger.warn("recommendations.list.database_fallback", undefined, error);
    return NextResponse.json({ recommendations: [], source: "fallback", message: "Database unavailable, using empty recommendation list." });
  }
}
