import { NextResponse } from "next/server";
import { fallbackLibraryItems } from "@/lib/content-library";
import { getLibraryItems } from "@/lib/library-service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const items = await getLibraryItems();
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json({
      items: fallbackLibraryItems,
      warning: error instanceof Error ? error.message : "Using fallback library items."
    });
  }
}
