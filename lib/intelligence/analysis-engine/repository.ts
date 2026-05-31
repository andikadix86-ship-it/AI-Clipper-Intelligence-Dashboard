import { prisma } from "@/lib/prisma";
import type { DataDrivenAnalysisOutput } from "@/lib/intelligence/analysis-engine/types";

export async function listDataDrivenAnalyses(input?: { mode?: "creator" | "affiliate"; dataMode?: "real" | "demo"; minConfidence?: number; take?: number }) {
  const rows = await prisma.dataDrivenAnalysis.findMany({
    where: {
      mode: input?.mode,
      isDemo: input?.dataMode === "real" ? false : input?.dataMode === "demo" ? true : undefined,
      confidence: input?.minConfidence ? { gte: input.minConfidence } : undefined
    },
    include: { result: true },
    orderBy: { createdAt: "desc" },
    take: Math.max(1, Math.min(50, input?.take ?? 12))
  });
  return rows.map(mapAnalysis);
}

export async function getDataDrivenAnalysis(id: string) {
  const row = await prisma.dataDrivenAnalysis.findUnique({ where: { id }, include: { result: true } });
  return row ? mapAnalysis(row) : null;
}

function mapAnalysis(row: {
  id: string; keyword: string; mode: string; summary: string; trendStage: string; opportunityLevel: string; riskLevel: string; score: number;
  confidence: number; analysis: unknown; sourceBreakdown: unknown; isDemo: boolean; createdAt: Date;
  result: { topic: string; sourceUrl: string | null; platform: string } | null;
}) {
  const stored = row.analysis && typeof row.analysis === "object" && !Array.isArray(row.analysis) ? row.analysis as Partial<DataDrivenAnalysisOutput> : {};
  return {
    ...stored,
    id: row.id,
    keyword: row.keyword,
    topic: row.result?.topic ?? row.keyword,
    mode: row.mode as "creator" | "affiliate",
    summary: row.summary,
    trendStage: row.trendStage,
    opportunityLevel: row.opportunityLevel,
    riskLevel: row.riskLevel,
    score: row.score,
    confidence: row.confidence,
    isDemo: row.isDemo,
    sourceUrl: row.result?.sourceUrl ?? undefined,
    platformRecommendation: stored.platformRecommendation ?? row.result?.platform ?? "UNKNOWN",
    createdAt: row.createdAt.toISOString()
  };
}

export type StoredDataDrivenAnalysis = Awaited<ReturnType<typeof getDataDrivenAnalysis>> & {};

