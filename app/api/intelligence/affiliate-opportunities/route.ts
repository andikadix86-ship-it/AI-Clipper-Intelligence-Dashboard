import { NextResponse } from "next/server";
import { generateAffiliateOpportunities } from "@/lib/intelligence/data-layer/opportunities";
import { TrendAggregationValidationError } from "@/lib/intelligence/data-layer/aggregator";
import { serverLogger } from "@/lib/server-logger";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { productCategory?: string; platform?: string };
  try { body = await request.json(); } catch { return validationError("Invalid JSON body."); }
  try {
    const data = await generateAffiliateOpportunities({ productCategory: body.productCategory ?? "", platform: body.platform ?? "" });
    return NextResponse.json({ success: true, data, meta: { generated_at: new Date().toISOString() } });
  } catch (error) {
    if (error instanceof TrendAggregationValidationError) return validationError(error.message);
    serverLogger.error("intelligence.affiliate_opportunities.failed", error);
    return NextResponse.json({ success: false, error: { code: "ENGINE_ERROR", message: "Affiliate opportunity could not be generated." } }, { status: 500 });
  }
}
function validationError(message: string) { return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message } }, { status: 400 }); }
