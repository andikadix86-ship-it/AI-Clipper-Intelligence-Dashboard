import { NextResponse } from "next/server";
import { getRecommendationInsights } from "@/lib/recommendation-service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const recommendations = await getRecommendationInsights();
    return NextResponse.json({ recommendations });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Recommendations could not be loaded." },
      { status: 500 }
    );
  }
}
