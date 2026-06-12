import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Prisma } from "@prisma/client";
import type { KnowledgeCategory, KnowledgeEntry, KnowledgeInput, KnowledgeStorage } from "@/lib/knowledge-base/types";
import { serverLogger } from "../server-logger";

const memoryEntries = new Map<string, KnowledgeEntry>();
const defaultLocalFile = path.join(process.cwd(), "data", "knowledge-base.json");
type RepositoryOptions = { disableDatabase?: boolean; localFile?: string; disableLocalJson?: boolean };

export async function saveKnowledge(input: KnowledgeInput, options: RepositoryOptions = {}) {
  const entry = normalizeEntry(input);
  if (!options.disableDatabase) {
    try { await saveDatabase(entry); return { entry, storage: "supabase" as const }; }
    catch (error) { warn("knowledge_base.supabase.unavailable", error); }
  }
  if (!options.disableLocalJson) {
    try { await saveLocal(entry, options.localFile ?? defaultLocalFile); memoryEntries.set(entry.id, entry); return { entry, storage: "local-json" as const }; }
    catch (error) { warn("knowledge_base.local_json.unavailable", error); }
  }
  memoryEntries.set(entry.id, entry); return { entry, storage: "memory" as const };
}

export async function searchKnowledge(query = "", options: RepositoryOptions & { platform?: string; niche?: string; tags?: string[]; take?: number } = {}) {
  const entries = await loadEntries(options);
  const needle = query.trim().toLowerCase(), tags = options.tags?.map((tag) => tag.toLowerCase()) ?? [];
  return entries.filter((entry) => (!needle || `${entry.title} ${entry.content} ${entry.tags.join(" ")}`.toLowerCase().includes(needle)) && (!options.platform || entry.platform === options.platform || entry.platform === "all") && (!options.niche || entry.niche === options.niche || entry.niche === "general") && (!tags.length || tags.some((tag) => entry.tags.map((item) => item.toLowerCase()).includes(tag)))).slice(0, options.take ?? 40);
}
export async function getKnowledgeByCategory(category: KnowledgeCategory, options: RepositoryOptions = {}) { return (await loadEntries(options)).filter((entry) => entry.category === category); }
export async function recommendKnowledge(input: { platform?: string; niche?: string; tags?: string[]; take?: number }, options: RepositoryOptions = {}) {
  const entries = await searchKnowledge("", { ...options, ...input, take: input.take ?? 6 });
  return entries.sort((a, b) => b.confidence_score - a.confidence_score).slice(0, input.take ?? 6);
}

async function loadEntries(options: RepositoryOptions): Promise<KnowledgeEntry[]> {
  if (!options.disableDatabase) { try { return await loadDatabase(); } catch (error) { warn("knowledge_base.search.supabase_unavailable", error); } }
  if (!options.disableLocalJson) { try { const local = await readLocal(options.localFile ?? defaultLocalFile); if (local.length) return local; } catch (error) { warn("knowledge_base.search.local_json_unavailable", error); } }
  return [...memoryEntries.values()];
}
async function saveDatabase(entry: KnowledgeEntry) {
  const [{ prisma }, { withTimeout }] = await Promise.all([import("../prisma"), import("../db-timeout")]);
  const fingerprint = hash([entry.category, entry.platform, entry.niche, entry.title].join("|"));
  await withTimeout(prisma.knowledgeEntry.upsert({ where: { fingerprint }, update: { category: entry.category, topic: entry.title, niche: entry.niche, platform: entry.platform, content: entry.content as unknown as Prisma.InputJsonValue, tags: entry.tags, confidence: entry.confidence_score, sourceType: entry.source_type }, create: { fingerprint, category: entry.category, topic: entry.title, niche: entry.niche, platform: entry.platform, content: entry.content as unknown as Prisma.InputJsonValue, tags: entry.tags, confidence: entry.confidence_score, sourceType: entry.source_type } }), 900);
}
async function loadDatabase() {
  const [{ prisma }, { withTimeout }] = await Promise.all([import("../prisma"), import("../db-timeout")]);
  const entries = await withTimeout(prisma.knowledgeEntry.findMany({ orderBy: { updatedAt: "desc" }, take: 100 }), 900);
  return entries.map((entry): KnowledgeEntry => ({ id: entry.id, category: asCategory(entry.category), platform: entry.platform, niche: entry.niche, title: entry.topic, content: typeof entry.content === "string" ? entry.content : JSON.stringify(entry.content), tags: entry.tags, confidence_score: entry.confidence, source_type: asSource(entry.sourceType), created_at: entry.createdAt.toISOString(), updated_at: entry.updatedAt.toISOString() }));
}
async function saveLocal(entry: KnowledgeEntry, file: string) { const entries = await readLocal(file); const index = entries.findIndex((item) => item.id === entry.id || hash(`${item.category}|${item.platform}|${item.niche}|${item.title}`) === hash(`${entry.category}|${entry.platform}|${entry.niche}|${entry.title}`)); if (index >= 0) entries[index] = { ...entry, id: entries[index].id, created_at: entries[index].created_at }; else entries.unshift(entry); await mkdir(path.dirname(file), { recursive: true }); await writeFile(file, `${JSON.stringify(entries, null, 2)}\n`, "utf8"); }
async function readLocal(file: string): Promise<KnowledgeEntry[]> { try { const value = JSON.parse(await readFile(file, "utf8")); return Array.isArray(value) ? value : []; } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return []; throw error; } }
function normalizeEntry(input: KnowledgeInput): KnowledgeEntry { const now = new Date().toISOString(); return { ...input, id: input.id ?? `knowledge_${randomUUID()}`, tags: [...new Set(input.tags.map((tag) => tag.trim()).filter(Boolean))], confidence_score: Math.min(100, Math.max(0, Math.round(input.confidence_score))), created_at: now, updated_at: now }; }
function hash(value: string) { return createHash("sha256").update(value.toLowerCase()).digest("hex"); }
function asCategory(value: string): KnowledgeCategory { return ["algorithm-knowledge", "creator-patterns", "hook-library", "cta-library", "affiliate-patterns", "policy-rules", "performance-learning"].includes(value) ? value as KnowledgeCategory : "creator-patterns"; }
function asSource(value: string) { return value === "manual" || value === "ai" || value === "data-driven" || value === "engine" || value === "real" ? value : "engine"; }
function warn(event: string, error: unknown) { serverLogger.warn(event, undefined, error); }
export function knowledgeRepositoryStatus(storage: KnowledgeStorage) { return { storage, fallback: storage !== "supabase", message: storage === "supabase" ? "Knowledge persisted to Supabase." : storage === "local-json" ? "Supabase unavailable, knowledge persisted to local JSON." : "Supabase and local JSON unavailable, knowledge retained in memory." }; }
