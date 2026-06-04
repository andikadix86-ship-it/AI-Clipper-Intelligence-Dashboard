import type { AffiliatePlan, AffiliatePlanMeta } from "@/lib/affiliate/affiliate-engine";

const affiliatePlans = new Map<string, { id: string; data: AffiliatePlan; meta: AffiliatePlanMeta }>();

export function saveAffiliatePlanToMemory(data: AffiliatePlan, meta: AffiliatePlanMeta) {
  const id = `affiliate_plan_${Date.now()}_${affiliatePlans.size + 1}`;
  const entry = { id, data, meta };
  affiliatePlans.set(id, entry);
  return entry;
}
