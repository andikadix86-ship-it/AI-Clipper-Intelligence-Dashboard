export const knowledgeCategories = ["algorithm-knowledge", "creator-patterns", "hook-library", "cta-library", "affiliate-patterns", "policy-rules", "performance-learning"] as const;
export type KnowledgeCategory = typeof knowledgeCategories[number];
export type KnowledgeSourceType = "manual" | "ai" | "data-driven" | "engine" | "real";
export type KnowledgeEntry = { id: string; category: KnowledgeCategory; platform: string; niche: string; title: string; content: string; tags: string[]; confidence_score: number; source_type: KnowledgeSourceType; created_at: string; updated_at: string };
export type KnowledgeInput = Omit<KnowledgeEntry, "id" | "created_at" | "updated_at"> & { id?: string };
export type KnowledgeStorage = "supabase" | "local-json" | "memory";
