import type { OrchestrationOutput } from "./orchestration-types";
const workflows = new Map<string, OrchestrationOutput>();
export function saveWorkflow(output: OrchestrationOutput) { workflows.set(output.workflow_id, output); return output; }
export function listWorkflows() { return [...workflows.values()].reverse().slice(0, 12); }
