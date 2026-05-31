import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { affiliateBreakdown, affiliateScore } from "@/lib/intelligence/analysis-engine/affiliate-analysis";
import { creatorBreakdown, creatorScore } from "@/lib/intelligence/analysis-engine/creator-analysis";
import { level, trendStage } from "@/lib/intelligence/analysis-engine/opportunity-matrix";
import { recommendationContent } from "@/lib/intelligence/analysis-engine/recommendation-builder";
import { analyzeRisk } from "@/lib/intelligence/analysis-engine/risk-analysis";
import type { DataDrivenAnalysisInput, DataDrivenAnalysisOutput } from "@/lib/intelligence/analysis-engine/types";

export async function analyzeIntelligenceResult(input: DataDrivenAnalysisInput): Promise<DataDrivenAnalysisOutput> {
  const { result, mode } = input;
  const breakdown = mode === "affiliate" ? affiliateBreakdown(result) : creatorBreakdown(result);
  const score = mode === "affiliate" ? affiliateScore(result) : creatorScore(result);
  const risk = analyzeRisk(result);
  const content = recommendationContent(result, mode);
  const createdAt = new Date().toISOString();
  const analysis: DataDrivenAnalysisOutput = {
    resultId: result.id,
    keyword: result.keyword,
    mode,
    summary: `${result.topic} memiliki ${level(score).toLowerCase()} opportunity berdasarkan ${result.source}. ${result.isDemo ? "Signal masih demo dan wajib divalidasi manual." : "Signal memakai data publik real yang tercatat."}`,
    trendStage: trendStage(result.trendDirection, result.recencyScore),
    audience: content.audience,
    contentGap: content.contentGap,
    opportunityLevel: level(score),
    riskLevel: risk.risk,
    competitionLevel: level(result.competitionScore),
    recommendedAngles: content.angles,
    recommendedHooks: content.hooks,
    recommendedContentFormats: content.formats,
    platformRecommendation: result.platform,
    actionPlan: content.actionPlan,
    score,
    scoreBreakdown: breakdown,
    sourceBreakdown: [{ source: result.source, isDemo: result.isDemo, collectedAt: result.collectedAt, confidence: result.confidence }],
    confidence: result.isDemo ? Math.min(35, result.confidence) : result.confidence,
    isDemo: result.isDemo,
    notes: `${result.notes} Risk note: ${risk.note}`,
    createdAt
  };
  const stored = await prisma.dataDrivenAnalysis.create({
    data: {
      resultId: await existingResultId(result.id),
      keyword: analysis.keyword,
      mode,
      summary: analysis.summary,
      trendStage: analysis.trendStage,
      opportunityLevel: analysis.opportunityLevel,
      riskLevel: analysis.riskLevel,
      score,
      confidence: analysis.confidence,
      analysis: JSON.parse(JSON.stringify(analysis)) as Prisma.InputJsonValue,
      sourceBreakdown: JSON.parse(JSON.stringify(analysis.sourceBreakdown)) as Prisma.InputJsonValue,
      isDemo: analysis.isDemo
    }
  });
  return { ...analysis, id: stored.id };
}

async function existingResultId(id: string) {
  return (await prisma.intelligenceResult.findUnique({ where: { id }, select: { id: true } }))?.id;
}

