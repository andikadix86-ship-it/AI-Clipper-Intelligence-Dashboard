import { NextResponse } from "next/server";
import { getAutomationPlans } from "@/lib/agent-service";
import { serverLogger } from "@/lib/server-logger";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json({ plans: await getAutomationPlans() });
  } catch (error) {
    serverLogger.warn("automation_plans.list.database_fallback", undefined, error);
    return NextResponse.json({ plans: [], source: "fallback", message: "Database unavailable, using empty automation plan list." });
  }
}
