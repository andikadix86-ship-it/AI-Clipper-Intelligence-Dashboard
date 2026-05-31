import { NextResponse } from "next/server";
import { ensureAgentsSeeded, mapTask } from "@/lib/agent-service";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    await ensureAgentsSeeded();
    const tasks = await prisma.agentTask.findMany({
      orderBy: { createdAt: "desc" },
      include: { agent: true, project: true, contentItem: true },
      take: 50
    });
    return NextResponse.json({ tasks: tasks.map(mapTask) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Agent tasks could not be loaded." },
      { status: 500 }
    );
  }
}
