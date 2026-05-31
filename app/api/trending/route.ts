import { NextResponse } from "next/server";
import { getTrendingIntelligence } from "@/lib/intelligence/service";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(await getTrendingIntelligence());
}
