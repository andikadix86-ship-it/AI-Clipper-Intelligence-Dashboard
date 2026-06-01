import { NextResponse } from "next/server";
import { getAutomationPlans } from "@/lib/agent-service";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json({ plans: await getAutomationPlans() });
  } catch (error) {
    console.error("[automation-plans] Database unavailable while loading plans.", error);
    return NextResponse.json({ plans: [], source: "fallback", message: "Database unavailable, using empty automation plan list." });
  }
}
