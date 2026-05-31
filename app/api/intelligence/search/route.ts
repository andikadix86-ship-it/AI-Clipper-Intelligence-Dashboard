import { NextResponse } from "next/server";
import { searchIntelligence } from "@/lib/intelligence/search-engine/intelligence-search-service";
import type { IntelligencePlatform } from "@/lib/intelligence/search-engine/types";

export const runtime = "nodejs";

const supported = new Set<IntelligencePlatform>(["YOUTUBE", "GOOGLE_TRENDS", "REDDIT", "TIKTOK", "SHOPEE", "TOKOPEDIA"]);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const platforms = Array.isArray(body.platforms) ? body.platforms.filter((value: unknown): value is IntelligencePlatform => typeof value === "string" && supported.has(value as IntelligencePlatform)) : [];
    const data = await searchIntelligence({
      keyword: typeof body.keyword === "string" ? body.keyword : "",
      niche: typeof body.niche === "string" ? body.niche : undefined,
      platforms,
      region: typeof body.region === "string" ? body.region : "ID",
      language: typeof body.language === "string" ? body.language : "id",
      timeRange: body.timeRange === "30d" || body.timeRange === "90d" ? body.timeRange : "7d",
      mode: body.mode === "affiliate" ? "affiliate" : "creator",
      maxResults: Number(body.maxResults) || 10,
      refresh: body.refresh === true
    });
    return NextResponse.json({ success: true, message: data.message, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Intelligence search gagal.";
    return NextResponse.json({ success: false, message, error: message }, { status: 400 });
  }
}

