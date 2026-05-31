import { NextResponse } from "next/server";
import { analyzeIntelligenceResult } from "@/lib/intelligence/analysis-engine/data-driven-engine";
import type { IntelligenceSearchResult } from "@/lib/intelligence/search-engine/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.result || typeof body.result !== "object") return NextResponse.json({ success: false, message: "Result intelligence wajib dipilih." }, { status: 400 });
    const analysis = await analyzeIntelligenceResult({ result: body.result as IntelligenceSearchResult, mode: body.mode === "affiliate" ? "affiliate" : "creator" });
    return NextResponse.json({ success: true, message: "Data-driven analysis tersimpan.", data: analysis });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Data-driven analysis gagal.";
    return NextResponse.json({ success: false, message, error: message }, { status: 400 });
  }
}

