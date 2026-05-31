import { NextResponse } from "next/server";
import { ensureAgentsSeeded, mapRecommendation } from "@/lib/agent-service";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId") ?? undefined;
  const contentItemId = url.searchParams.get("contentItemId") ?? undefined;
  try {
    await ensureAgentsSeeded();
    const recommendations = await prisma.agentRecommendation.findMany({
      where: { projectId, contentItemId },
      orderBy: { createdAt: "desc" },
      include: { agent: true, project: true, contentItem: true },
      take: 50
    });
    return NextResponse.json({ recommendations: recommendations.map(mapRecommendation) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Agent recommendations could not be loaded." },
      { status: 500 }
    );
  }
}
