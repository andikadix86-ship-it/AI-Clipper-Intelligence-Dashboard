import { NextResponse } from "next/server";
import { generatePublishingPackage, PublishingValidationError } from "@/lib/publishing/publishing-engine";
import type { PublishingInput } from "@/lib/publishing/publishing-engine";
import { savePublishingPackageToMemory } from "@/lib/publishing/publishing-package-repository";
import { serverLogger } from "@/lib/server-logger";
import { requestTelegramApproval } from "@/lib/approval/telegram-approval";
import { savePublishingPolicy } from "@/lib/knowledge-base/engine-learning";
export const runtime = "nodejs";
export async function POST(request: Request) {
  let body: PublishingInput; try { body = await request.json(); } catch { return validationError("Invalid JSON body."); }
  try { const result = await generatePublishingPackage(body, { apiKey: process.env.GEMINI_API_KEY, mode: process.env.GEMINI_API_KEY ? "REAL" : "DUMMY" }); const stored = savePublishingPackageToMemory(result.data, result.meta); const knowledge = await savePublishingPolicy({ platform: body.platform, data: result.data }); const approval = result.data.approval_flow.required ? await requestTelegramApproval({ contentTitle: result.data.final_metadata.title, platform: result.data.platform, objective: body.contentObjective, riskLevel: result.data.policy_check.risk_level, metadataSummary: `${result.data.final_metadata.hashtags.length} hashtags, metadata ${result.data.export_package.metadata_file_status}.` }) : null; serverLogger.info("publishing.package.generated", { provider: result.meta.provider, mode: result.meta.mode, platform: result.data.platform, packageId: stored.id, approvalMode: approval?.approval.mode, knowledgeStorage: knowledge.storage }); return NextResponse.json({ success: true, data: result.data, approval, knowledge, meta: { ...result.meta, package_id: stored.id } }); }
  catch (error) { if (error instanceof PublishingValidationError) return validationError(error.message); serverLogger.error("publishing.package.failed", error); return NextResponse.json({ success: false, error: { code: "ENGINE_ERROR", message: "Publishing package could not be generated." } }, { status: 500 }); }
}
function validationError(message: string) { return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message } }, { status: 400 }); }
