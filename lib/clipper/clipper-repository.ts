import type { ClipPlan, ClipPlanMeta } from "@/lib/clipper/clipper-engine";

const clipPlans = new Map<string, { id: string; data: ClipPlan; meta: ClipPlanMeta }>();

export function saveClipPlanToMemory(data: ClipPlan, meta: ClipPlanMeta) {
  const id = `clip_plan_${Date.now()}_${clipPlans.size + 1}`;
  const entry = { id, data, meta };
  clipPlans.set(id, entry);
  return entry;
}
