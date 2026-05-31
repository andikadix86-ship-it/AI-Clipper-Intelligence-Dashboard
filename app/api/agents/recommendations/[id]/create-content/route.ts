import { NextResponse } from "next/server";
import { createContentFromRecommendation } from "@/lib/agent-service";
import { getLibraryItem } from "@/lib/library-service";

export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    const result = await createContentFromRecommendation(params.id);
    const item = await getLibraryItem(result.content.id);
    return NextResponse.json({ item, recommendation: result.recommendation });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Recommendation could not be converted to content." },
      { status: 500 }
    );
  }
}
