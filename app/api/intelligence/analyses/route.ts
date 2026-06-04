import { apiSuccess } from "@/lib/api-response";
import { listDataDrivenAnalyses } from "@/lib/intelligence/analysis-engine/repository";
import { serverLogger } from "@/lib/server-logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const mode = url.searchParams.get("mode");
    const dataMode = url.searchParams.get("dataMode");
    const analyses = await listDataDrivenAnalyses({
      mode: mode === "creator" || mode === "affiliate" ? mode : undefined,
      dataMode: dataMode === "real" || dataMode === "demo" ? dataMode : undefined,
      minConfidence: Number(url.searchParams.get("minConfidence") ?? 0),
      take: Number(url.searchParams.get("take") ?? 12)
    });
    return apiSuccess("Data-driven analyses loaded.", { analyses }, { analyses });
  } catch (error) {
    serverLogger.warn("intelligence.analyses.database_fallback", undefined, error);
    return apiSuccess("Database unavailable, using empty analysis list.", { analyses: [], source: "fallback" }, { analyses: [], source: "fallback" });
  }
}
