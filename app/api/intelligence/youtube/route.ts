import { NextResponse } from "next/server";
import { getYouTubeKeywordIntelligence } from "@/lib/intelligence/service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const keyword = new URL(request.url).searchParams.get("keyword")?.trim();
  const url = new URL(request.url);
  if (!keyword) {
    return NextResponse.json({ status: "ERROR", message: "Keyword YouTube wajib diisi.", results: [] }, { status: 400 });
  }
  return NextResponse.json(await getYouTubeKeywordIntelligence({
    keyword,
    regionCode: url.searchParams.get("regionCode") ?? "ID",
    maxResults: Number(url.searchParams.get("maxResults") ?? 10),
    publishedAfter: url.searchParams.get("publishedAfter") ?? undefined,
    order: (url.searchParams.get("order") as "relevance" | "date" | "viewCount" | null) ?? "relevance"
  }));
}
