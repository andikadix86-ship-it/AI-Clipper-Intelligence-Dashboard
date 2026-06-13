import { apiError, apiSuccess, parseJsonBody } from "@/lib/api-response";
import { withTimeout } from "@/lib/db-timeout";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notification-service";
import { getConnectionStatus } from "@/lib/intelligence/source-utils";

export const runtime = "nodejs";

export async function GET() {
  try { const opportunities = await withTimeout(prisma.savedOpportunity.findMany({ orderBy: { updatedAt: "desc" } })); return apiSuccess("Saved opportunities loaded.", { opportunities }, { opportunities }); }
  catch { return apiError("Database belum tersedia. Opportunity lokal tetap dapat digunakan.", 503); }
}

export async function POST(request: Request) {
  const body = await parseJsonBody<Record<string, unknown>>(request);
  if (!body || !["title", "type", "source", "platform"].every((field) => typeof body[field] === "string" && body[field])) return apiError("Opportunity payload tidak lengkap.", 400);
  try {
    const existing = await withTimeout(prisma.savedOpportunity.findFirst({ where: { title: String(body.title), source: String(body.source) } }));
    const metadata = json(body.metadata) ?? {};
    const sourceType = productSourceType(body.sourceType ?? metadata.sourceType ?? (body.isDemo === false ? "MANUAL" : "DEMO"));
    const connectionStatus = body.sourceStatus === "REAL" || body.sourceStatus === "NOT CONNECTED"
      ? body.sourceStatus
      : getConnectionStatus({ source: body.source, sourceType, sourceUrl: body.sourceUrl, isDemo: body.isDemo });
    const isRealOpportunity = connectionStatus === "REAL" || body.isDemo === false || sourceType !== "DEMO";
    const opportunityData = {
      title: String(body.title),
      type: String(body.type),
      source: String(body.source),
      sourceUrl: optional(body.sourceUrl),
      platform: String(body.platform),
      score: number(body.score),
      confidence: number(body.confidence),
      reason: String(body.reason ?? ""),
      notes: String(body.notes ?? ""),
      isDemo: !isRealOpportunity,
      status: String(body.status ?? "saved"),
      metadata: { ...metadata, sourceType, sourceStatus: isRealOpportunity ? "REAL" : "NOT CONNECTED" }
    };
    const opportunity = existing
      ? await withTimeout(prisma.savedOpportunity.update({ where: { id: existing.id }, data: opportunityData }))
      : await withTimeout(prisma.savedOpportunity.create({ data: opportunityData }));
    if (!existing) await createNotification({ title: "Recommendation saved", message: `${opportunity.title} tersimpan sebagai opportunity.`, type: "RECOMMENDATION_READY", severity: "INFO", source: "Recommendation Engine", actionUrl: "/trending-center" });
    return apiSuccess(existing ? "Opportunity database sudah tersedia." : "Opportunity tersimpan ke database.", { opportunity }, { opportunity }, existing ? 200 : 201);
  } catch { return apiError("Database belum tersedia. Data disimpan sementara secara lokal.", 503); }
}

function number(value: unknown) { return Number.isFinite(Number(value)) ? Number(value) : 0; }
function optional(value: unknown) { return typeof value === "string" && value ? value : undefined; }
function json(value: unknown) { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined; }
function productSourceType(value: unknown) { return value === "MANUAL" || value === "CSV_IMPORT" || value === "REAL_API" ? value : "DEMO"; }
