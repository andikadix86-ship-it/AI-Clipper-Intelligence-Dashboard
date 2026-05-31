import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateRecommendationInsights } from "@/lib/recommendation-service";
import { runTextWorkflow } from "@/lib/text-ai-service";
import { createNotification } from "@/lib/notification-service";

export const runtime = "nodejs";

export async function POST() {
  try {
    const recommendations = await generateRecommendationInsights();
    const explanation = await runTextWorkflow({
      operation: "RECOMMENDATION",
      topic: JSON.stringify(recommendations.slice(0, 5))
    });
    const providerText = explanation.result.analysis ?? explanation.result.script ?? explanation.result.caption ?? explanation.result.description;

    if (explanation.mode === "REAL") {
      await prisma.recommendationInsight.create({
        data: {
          insightType: "AI_EXPLANATION",
          title: "OpenAI Recommendation Explanation",
          description: providerText,
          recommendation: providerText,
          score: 86,
          priority: "High"
        }
      });
    }
    await createNotification({ title: "Recommendation ready", message: `${recommendations.length} recommendation insights tersedia untuk ditinjau.`, type: "RECOMMENDATION_READY", severity: "INFO", source: "Recommendation Engine", actionUrl: "/analytics" });

    return NextResponse.json({
      recommendations,
      provider: {
        mode: explanation.mode,
        warning: explanation.warning,
        generationJobId: explanation.jobId,
        output: providerText
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Recommendations could not be generated." },
      { status: 500 }
    );
  }
}
