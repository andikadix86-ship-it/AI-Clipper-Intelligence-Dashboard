import { NextResponse } from "next/server";
import { getAutomationPlans } from "@/lib/agent-service";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json({ plans: await getAutomationPlans() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Automation plans could not be loaded." },
      { status: 500 }
    );
  }
}
