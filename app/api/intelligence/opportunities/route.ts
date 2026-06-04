import { NextResponse } from "next/server";
import { generateContentOpportunities } from "@/lib/intelligence/opportunity-engine";
import { TrendAggregationValidationError } from "@/lib/intelligence/trend-aggregator";
import { serverLogger } from "@/lib/server-logger";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { niche?: string; platform?: string; keyword?: string };
  try { body = await request.json(); } catch { return validationError("Invalid JSON body."); }
  try {
    const data = await generateContentOpportunities({ niche: body.niche ?? "", platform: body.platform ?? "", keyword: body.keyword });
    return NextResponse.json({ success: true, data, meta: { generated_at: new Date().toISOString() } });
  } catch (error) {
    if (error instanceof TrendAggregationValidationError) return validationError(error.message);
    serverLogger.error("intelligence.opportunities.failed", error);
    return NextResponse.json({ success: false, error: { code: "ENGINE_ERROR", message: "Content opportunities could not be generated." } }, { status: 500 });
  }
}
function validationError(message: string) { return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message } }, { status: 400 }); }
