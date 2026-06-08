import { NextResponse } from "next/server";
import { AffiliateValidationError, generateAffiliatePlan } from "@/lib/affiliate/affiliate-engine";
import type { AffiliateInput } from "@/lib/affiliate/affiliate-engine";
import { saveAffiliatePlanToMemory } from "@/lib/affiliate/affiliate-repository";
import { serverLogger } from "@/lib/server-logger";
import { saveAffiliatePattern } from "@/lib/knowledge-base/engine-learning";
import { prisma } from "@/lib/prisma";
import { withTimeout } from "@/lib/db-timeout";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: AffiliateInput;
  try { body = await request.json(); } catch { return validationError("Invalid JSON body."); }
  try {
    const result = await generateAffiliatePlan(body, { apiKey: process.env.GEMINI_API_KEY, mode: process.env.GEMINI_API_KEY ? "REAL" : "DUMMY" });
    const stored = saveAffiliatePlanToMemory(result.data, result.meta);
    const knowledge = await saveAffiliatePattern({ platform: body.platform, category: body.productCategory, data: result.data });
    await persistPlan(body, result.data, result.meta).catch((error) => serverLogger.warn("affiliate.plan.persist_failed", {}, error));
    serverLogger.info("affiliate.plan.generated", { provider: result.meta.provider, mode: result.meta.mode, platform: result.data.affiliate_cta.platform, planId: stored.id, knowledgeStorage: knowledge.storage });
    return NextResponse.json({ success: true, data: result.data, knowledge, meta: { ...result.meta, plan_id: stored.id } });
  } catch (error) {
    if (error instanceof AffiliateValidationError) return validationError(error.message);
    serverLogger.error("affiliate.plan.failed", error);
    return NextResponse.json({ success: false, error: { code: "ENGINE_ERROR", message: "Affiliate plan could not be generated." } }, { status: 500 });
  }
}

async function persistPlan(input: AffiliateInput & { campaignId?: string }, plan: unknown, meta: unknown) {
  if (!input.campaignId) return;
  await withTimeout(prisma.generatedContent.deleteMany({ where: { campaignId: input.campaignId, contentType: "affiliate_plan" } }));
  await withTimeout(prisma.generatedContent.create({
    data: {
      campaignId: input.campaignId,
      contentType: "affiliate_plan",
      title: "Affiliate Plan",
      body: JSON.stringify(plan, null, 2),
      platform: input.platform,
      tone: "Strategy",
      source: "Affiliate Plan Engine",
      isDemo: input.dataMode === "DEMO DATA" || input.isDemo === true || (meta as { mode?: string }).mode !== "real",
      metadata: { meta: JSON.parse(JSON.stringify(meta)), productId: input.productId, dataMode: input.dataMode }
    }
  }));
}

function validationError(message: string) {
  return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message } }, { status: 400 });
}
