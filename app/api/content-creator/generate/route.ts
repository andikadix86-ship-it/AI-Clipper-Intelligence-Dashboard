import { NextResponse } from "next/server";
import { ContentCreatorValidationError, generateContentPackage } from "@/lib/content-creator/content-creator-engine";
import type { ContentCreatorInput } from "@/lib/content-creator/content-creator-engine";
import { saveContentPackageToMemory } from "@/lib/content-creator/content-creator-repository";
import { serverLogger } from "@/lib/server-logger";
import { saveCreatorPattern } from "@/lib/knowledge-base/engine-learning";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: ContentCreatorInput;
  try {
    body = await request.json();
  } catch {
    return validationError("Invalid JSON body.");
  }
  try {
    const result = await generateContentPackage(body, { apiKey: process.env.GEMINI_API_KEY, mode: process.env.GEMINI_API_KEY ? "REAL" : "DUMMY" });
    const stored = saveContentPackageToMemory(result.data, result.meta);
    const knowledge = await saveCreatorPattern({ platform: body.platform, niche: body.niche, data: result.data });
    serverLogger.info("content_creator.package.generated", { provider: result.meta.provider, mode: result.meta.mode, platform: result.data.platform_metadata.platform, packageId: stored.id, knowledgeStorage: knowledge.storage });
    return NextResponse.json({ success: true, data: result.data, knowledge, meta: { ...result.meta, package_id: stored.id } });
  } catch (error) {
    if (error instanceof ContentCreatorValidationError) return validationError(error.message);
    serverLogger.error("content_creator.package.failed", error);
    return NextResponse.json({ success: false, error: { code: "ENGINE_ERROR", message: "Content package could not be generated." } }, { status: 500 });
  }
}

function validationError(message: string) {
  return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message } }, { status: 400 });
}
