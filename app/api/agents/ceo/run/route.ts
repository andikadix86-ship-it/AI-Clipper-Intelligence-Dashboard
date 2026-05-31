import { NextResponse } from "next/server";
import { runCeoAgentPlan } from "@/lib/agent-service";

export const runtime = "nodejs";

export async function POST() {
  try {
    return NextResponse.json({ plan: await runCeoAgentPlan() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "CEO Agent could not create an automation plan." },
      { status: 500 }
    );
  }
}
