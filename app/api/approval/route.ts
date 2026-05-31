import { NextResponse } from "next/server";
import { getLibraryItems } from "@/lib/library-service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const items = await getLibraryItems();
    return NextResponse.json({
      items: items.filter((item) => item.workflowStatus === "REVIEW")
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Approval queue could not be loaded." },
      { status: 500 }
    );
  }
}
