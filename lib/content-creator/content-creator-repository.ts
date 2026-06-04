import type { ContentPackage, ContentPackageMeta } from "@/lib/content-creator/content-creator-engine";

type StoredPackage = {
  id: string;
  data: ContentPackage;
  meta: ContentPackageMeta;
};

const packageStore = new Map<string, StoredPackage>();

export function saveContentPackageToMemory(data: ContentPackage, meta: ContentPackageMeta) {
  const id = `content_${Date.now()}_${packageStore.size + 1}`;
  const entry = { id, data, meta };
  packageStore.set(id, entry);
  return entry;
}
