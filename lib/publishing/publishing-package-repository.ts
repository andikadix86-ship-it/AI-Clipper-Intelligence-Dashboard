import type { PublishingPackage, PublishingPackageMeta } from "@/lib/publishing/publishing-engine";
const packages = new Map<string, { id: string; data: PublishingPackage; meta: PublishingPackageMeta }>();
export function savePublishingPackageToMemory(data: PublishingPackage, meta: PublishingPackageMeta) { const id = `publishing_package_${Date.now()}_${packages.size + 1}`; const entry = { id, data, meta }; packages.set(id, entry); return entry; }
