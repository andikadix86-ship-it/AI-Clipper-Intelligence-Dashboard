import { NextResponse } from "next/server";
import { ensureAgentsSeeded, mapAgent, mapRecommendation, mapTask } from "@/lib/agent-service";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    await ensureAgentsSeeded();
    const agent = await prisma.aIAgent.findUnique({
      where: { id: params.id },
      include: {
        tasks: { include: { project: true, contentItem: true, agent: true }, orderBy: { createdAt: "desc" } },
        recommendations: { include: { project: true, contentItem: true, agent: true }, orderBy: { createdAt: "desc" } }
      }
    });
    if (!agent) return NextResponse.json({ error: "Agent not found." }, { status: 404 });
    return NextResponse.json({
      agent: mapAgent(agent),
      tasks: agent.tasks.map(mapTask),
      recommendations: agent.recommendations.map(mapRecommendation),
      logs: agent.tasks.map((task) => ({
        id: task.id,
        message: `${agent.name} completed ${task.title}`,
        detail: task.result,
        createdAt: task.completedAt?.toISOString() ?? task.createdAt.toISOString()
      }))
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Agent detail could not be loaded." },
      { status: 500 }
    );
  }
}
