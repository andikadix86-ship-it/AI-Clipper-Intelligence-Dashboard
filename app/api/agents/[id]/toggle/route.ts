import { NextResponse } from "next/server";
import { mapAgent } from "@/lib/agent-service";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    const current = await prisma.aIAgent.findUnique({ where: { id: params.id } });
    if (!current) return NextResponse.json({ error: "Agent not found." }, { status: 404 });
    const status = current.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    const agent = await prisma.aIAgent.update({ where: { id: params.id }, data: { status } });
    return NextResponse.json({ agent: mapAgent(agent) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Agent status could not be updated." },
      { status: 500 }
    );
  }
}
