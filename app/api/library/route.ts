import { NextResponse } from "next/server";
import { getLibraryItems } from "@/lib/library-service";
import { serverLogger } from "@/lib/server-logger";

export const runtime = "nodejs";

export async function GET() {
  try {
    const items = await getLibraryItems();
    return NextResponse.json({ items });
  } catch (error) {
    serverLogger.warn("library.items.database_fallback", undefined, error);
    return NextResponse.json({
      items: [],
      source: "fallback",
      warning: "Database unavailable. Content Library ditampilkan dalam empty state sampai Supabase aktif."
    });
  }
}
