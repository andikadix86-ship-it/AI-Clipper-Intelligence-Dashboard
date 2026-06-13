import { NextResponse } from "next/server";
import { getYouTubeKeywordIntelligence } from "@/lib/intelligence/service";
import { assertNoDemoAsReal } from "@/lib/intelligence/source-utils";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const keyword = new URL(request.url).searchParams.get("keyword")?.trim();
  const url = new URL(request.url);
  if (!keyword) {
    return NextResponse.json({ status: "ERROR", message: "Keyword YouTube wajib diisi.", results: [] }, { status: 400 });
  }
  const result = await getYouTubeKeywordIntelligence({
    keyword,
    regionCode: url.searchParams.get("regionCode") ?? "ID",
    maxResults: Number(url.searchParams.get("maxResults") ?? 10),
    publishedAfter: url.searchParams.get("publishedAfter") ?? undefined,
    order: (url.searchParams.get("order") as "relevance" | "date" | "viewCount" | null) ?? "relevance"
  });
  const status = result.status === "READY" ? 200 : result.status === "SETUP_REQUIRED" ? 503 : result.status === "QUOTA_LIMITED" ? 429 : 502;
  const payload = result.status === "READY"
    ? assertNoDemoAsReal(result)
    : { ...result, message: "YouTube API gagal atau quota habis. Data real tidak tersedia.", detail: result.message };
  return NextResponse.json(payload, { status });
}
