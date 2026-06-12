import { NextResponse } from "next/server";
import { aggregateTrendSignals, TrendAggregationValidationError } from "@/lib/intelligence/data-layer/aggregator";
import { contentOpportunitiesFromAggregate } from "@/lib/intelligence/data-layer/opportunities";
import { serverLogger } from "@/lib/server-logger";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { niche?: string; platform?: string; keyword?: string };
  try { body = await request.json(); } catch { return validationError("Invalid JSON body."); }
  try {
    const input = { niche: body.niche ?? "", platform: body.platform ?? "", keyword: body.keyword?.trim() || (body.niche ?? "") };
    const aggregate = await aggregateTrendSignals(input);
    const opportunities = contentOpportunitiesFromAggregate(input, aggregate);
    serverLogger.info("intelligence.trends.aggregated", { platform: input.platform, niche: input.niche, signals: aggregate.signals.length, feedbackSaved: aggregate.feedback.saved });
    return NextResponse.json({ success: true, data: { aggregate, opportunities, sourceStatuses: aggregate.source_statuses }, meta: { generated_at: new Date().toISOString(), sourceStatuses: aggregate.source_statuses } });
  } catch (error) {
    if (error instanceof TrendAggregationValidationError) return validationError(error.message);
    serverLogger.error("intelligence.trends.failed", error);
    return NextResponse.json({ success: false, error: { code: "ENGINE_ERROR", message: "Trend signals could not be aggregated." } }, { status: 500 });
  }
}
function validationError(message: string) { return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message } }, { status: 400 }); }
