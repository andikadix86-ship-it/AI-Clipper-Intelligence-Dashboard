import { NextResponse } from "next/server";
import { runAgent } from "@/lib/agent-service";

export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    return NextResponse.json(await runAgent(params.id));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Agent could not be run." },
      { status: 500 }
    );
  }
}
