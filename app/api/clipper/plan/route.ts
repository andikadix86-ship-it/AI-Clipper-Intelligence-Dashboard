import { NextResponse } from "next/server";
import { ClipperValidationError, generateClipPlan } from "@/lib/clipper/clipper-engine";
import type { ClipperInput } from "@/lib/clipper/clipper-engine";
import { saveClipPlanToMemory } from "@/lib/clipper/clipper-repository";
import { serverLogger } from "@/lib/server-logger";
import { saveClipperPattern } from "@/lib/knowledge-base/engine-learning";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: ClipperInput;
  try { body = await request.json(); } catch { return validationError("Invalid JSON body."); }
  try {
    const result = await generateClipPlan(body, { apiKey: process.env.GEMINI_API_KEY, mode: process.env.GEMINI_API_KEY ? "REAL" : "DUMMY" });
    const stored = saveClipPlanToMemory(result.data, result.meta);
    const knowledge = await saveClipperPattern({ platform: body.platform, niche: body.niche, data: result.data });
    serverLogger.info("clipper.plan.generated", { provider: result.meta.provider, mode: result.meta.mode, platform: result.data.platform_metadata.platform, planId: stored.id, knowledgeStorage: knowledge.storage });
    return NextResponse.json({ success: true, data: result.data, knowledge, meta: { ...result.meta, plan_id: stored.id } });
  } catch (error) {
    if (error instanceof ClipperValidationError) return validationError(error.message);
    serverLogger.error("clipper.plan.failed", error);
    return NextResponse.json({ success: false, error: { code: "ENGINE_ERROR", message: "Clip plan could not be generated." } }, { status: 500 });
  }
}

function validationError(message: string) {
  return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message } }, { status: 400 });
}
