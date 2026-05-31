import { NextResponse } from "next/server";
import { mapAutomationPlan } from "@/lib/agent-service";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    const plan = await prisma.automationPlan.update({
      where: { id: params.id },
      data: { status: "APPROVED" },
      include: { project: true, socialAccount: true, createdByAgent: true }
    });
    return NextResponse.json({ plan: mapAutomationPlan(plan) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Automation plan could not be approved." },
      { status: 500 }
    );
  }
}
