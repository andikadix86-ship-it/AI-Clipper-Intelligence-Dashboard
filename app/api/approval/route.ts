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
    console.error("[approval] Database unavailable while loading approval queue.", error);
    return NextResponse.json({ items: [], source: "fallback", message: "Database unavailable, using empty approval queue." });
  }
}
