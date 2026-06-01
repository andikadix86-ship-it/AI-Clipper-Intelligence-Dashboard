import { NextResponse } from "next/server";
import { ensureAgentsSeeded } from "@/lib/agent-service";
import { getAgentCenter } from "@/lib/operations-analytics-service";

export const runtime = "nodejs";

export async function GET() {
  try {
    await ensureAgentsSeeded();
    return NextResponse.json(await getAgentCenter());
  } catch (error) {
    console.error("[agents] Database unavailable while loading AI Team Center.", error);
    return NextResponse.json({
      agents: [],
      ceo: { projects: 0, campaigns: 0, pendingApproval: 0, failedJobs: 0, providerIssues: 0, opportunities: 0, automationPlans: 0 },
      logs: [],
      source: "fallback",
      message: "Database unavailable, using empty agent center."
    });
  }
}
