import type { IntelligenceBrief, IntelligenceBriefMeta } from "@/lib/intelligence/intelligence-engine";

type StoredBrief = {
  id: string;
  data: IntelligenceBrief;
  meta: IntelligenceBriefMeta;
};

const briefStore = new Map<string, StoredBrief>();

export function saveBriefToMemory(data: IntelligenceBrief, meta: IntelligenceBriefMeta) {
  const id = `brief_${Date.now()}_${briefStore.size + 1}`;
  const entry = { id, data, meta };
  briefStore.set(id, entry);
  return entry;
}

export function listBriefsFromMemory() {
  return [...briefStore.values()];
}
