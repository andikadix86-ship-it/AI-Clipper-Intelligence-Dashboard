import { NextResponse } from "next/server";
import { getAffiliateProductIntelligence } from "@/lib/intelligence/service";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(getAffiliateProductIntelligence());
}
