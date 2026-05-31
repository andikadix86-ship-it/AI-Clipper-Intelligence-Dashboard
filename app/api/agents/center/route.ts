import { NextResponse } from "next/server";
import { ensureAgentsSeeded } from "@/lib/agent-service";
import { getAgentCenter } from "@/lib/operations-analytics-service";

export const runtime = "nodejs";

export async function GET() {
  try {
    await ensureAgentsSeeded();
    return NextResponse.json(await getAgentCenter());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI Team Center could not be loaded." },
      { status: 500 }
    );
  }
}
