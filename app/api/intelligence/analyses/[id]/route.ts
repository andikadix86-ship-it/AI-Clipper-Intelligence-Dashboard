import { apiError, apiSuccess } from "@/lib/api-response";
import { getDataDrivenAnalysis } from "@/lib/intelligence/analysis-engine/repository";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const analysis = await getDataDrivenAnalysis(params.id);
    if (!analysis) return apiError("Analysis tidak ditemukan.", 404);
    return apiSuccess("Data-driven analysis loaded.", { analysis }, { analysis });
  } catch (error) {
    return apiError("Analysis could not be loaded.", 500, error);
  }
}

