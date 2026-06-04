import { NextResponse } from "next/server";
import { generateIntelligenceBrief, IntelligenceBriefValidationError } from "@/lib/intelligence/intelligence-engine";
import type { IntelligenceBriefInput } from "@/lib/intelligence/intelligence-engine";
import { saveBriefToMemory } from "@/lib/intelligence/intelligence-brief-repository";
import { serverLogger } from "@/lib/server-logger";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: IntelligenceBriefInput;
  try {
    body = await request.json();
  } catch {
    return validationError("Invalid JSON body.");
  }
  try {
    const result = await generateIntelligenceBrief(body, { apiKey: process.env.GEMINI_API_KEY, mode: process.env.GEMINI_API_KEY ? "REAL" : "DUMMY" });
    const stored = saveBriefToMemory(result.data, result.meta);
    serverLogger.info("intelligence.brief.generated", { provider: result.meta.provider, mode: result.meta.mode, platform: result.data.platform, briefId: stored.id });
    return NextResponse.json({ success: true, data: result.data, meta: { ...result.meta, brief_id: stored.id } });
  } catch (error) {
    if (error instanceof IntelligenceBriefValidationError) return validationError(error.message);
    serverLogger.error("intelligence.brief.failed", error);
    return NextResponse.json({ success: false, error: { code: "ENGINE_ERROR", message: "Intelligence brief could not be generated." } }, { status: 500 });
  }
}

function validationError(message: string) {
  return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message } }, { status: 400 });
}
