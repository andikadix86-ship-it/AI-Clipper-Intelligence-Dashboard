import { NextResponse } from "next/server";
import { convertPlanToContent } from "@/lib/agent-service";
import { getLibraryItem } from "@/lib/library-service";

export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    const result = await convertPlanToContent(params.id);
    return NextResponse.json({ plan: result.plan, item: await getLibraryItem(result.content.id) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Automation plan could not be converted to content." },
      { status: 500 }
    );
  }
}
