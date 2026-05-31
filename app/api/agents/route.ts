import { NextResponse } from "next/server";
import { getAgents } from "@/lib/agent-service";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json({ agents: await getAgents() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Agents could not be loaded." },
      { status: 500 }
    );
  }
}
