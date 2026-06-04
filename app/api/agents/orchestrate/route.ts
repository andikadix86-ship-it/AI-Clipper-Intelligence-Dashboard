import { NextResponse } from "next/server";
import { listWorkflows } from "@/lib/agents/orchestration-repository";
import { orchestrateAgents, OrchestrationValidationError } from "@/lib/agents/orchestrator";
import type { OrchestrationInput } from "@/lib/agents/orchestration-types";
import { serverLogger } from "@/lib/server-logger";
export const runtime = "nodejs";
export async function GET() { return NextResponse.json({ success: true, workflows: listWorkflows() }); }
export async function POST(request: Request) {
  let body: OrchestrationInput; try { body = await request.json(); } catch { return validationError("Invalid JSON body."); }
  try { const result = await orchestrateAgents(body, { apiKey: process.env.GEMINI_API_KEY, mode: process.env.GEMINI_API_KEY ? "REAL" : "DUMMY" }); serverLogger.info("agents.workflow.completed", { workflowId: result.workflow_id, status: result.status, agents: result.selected_agents.length }); return NextResponse.json({ success: true, ...result }); }
  catch (error) { if (error instanceof OrchestrationValidationError) return validationError(error.message); serverLogger.error("agents.workflow.failed", error); return NextResponse.json({ success: false, error: { code: "ORCHESTRATION_ERROR", message: "Agent workflow could not be completed." } }, { status: 500 }); }
}
function validationError(message: string) { return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message } }, { status: 400 }); }
