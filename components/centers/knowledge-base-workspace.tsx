"use client";

import {
  BookOpen,
  BrainCircuit,
  Database,
  Filter,
  Gauge,
  Layers3,
  Megaphone,
  MousePointerClick,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Video
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { DashboardPanel } from "@/components/dashboard/ui";
import { PageHeader, StatCard } from "@/components/studio-ui";

type SourceType = "Manual" | "AI" | "Data-driven";

const knowledgeItems: Array<{ category: string; platform: string; entries: number; updated: string; confidence: string; source: SourceType; description: string; icon: LucideIcon }> = [
  { category: "Platform Algorithm Knowledge", platform: "All Platforms", entries: 248, updated: "Today, 08:30", confidence: "94%", source: "Data-driven", description: "YouTube, TikTok, Instagram, and Facebook algorithm signals.", icon: BrainCircuit },
  { category: "Creator Pattern Library", platform: "All Platforms", entries: 186, updated: "Yesterday", confidence: "91%", source: "AI", description: "Reusable creator structures based on winning content formats.", icon: Sparkles },
  { category: "Hook Intelligence Database", platform: "TikTok", entries: 412, updated: "Today, 10:15", confidence: "96%", source: "Data-driven", description: "High-retention opening hooks for short-form content.", icon: Database },
  { category: "Retention Editing Pattern", platform: "YouTube", entries: 124, updated: "2 days ago", confidence: "89%", source: "Data-driven", description: "Editing rhythm, scene changes, and watch-time patterns.", icon: Video },
  { category: "Content Archetype Engine", platform: "Instagram", entries: 92, updated: "3 days ago", confidence: "87%", source: "AI", description: "Educational, comparison, storytelling, and conversion archetypes.", icon: Layers3 },
  { category: "CTA Database", platform: "Facebook", entries: 156, updated: "Yesterday", confidence: "90%", source: "Manual", description: "Save, share, follow, DM, WhatsApp, and affiliate CTA patterns.", icon: MousePointerClick },
  { category: "Affiliate Conversion Knowledge", platform: "All Platforms", entries: 138, updated: "Today, 07:45", confidence: "93%", source: "Data-driven", description: "Product positioning, campaign, and conversion learnings.", icon: TrendingUp },
  { category: "Policy & Originality Rules", platform: "All Platforms", entries: 74, updated: "4 days ago", confidence: "98%", source: "Manual", description: "Originality, copyright reminder, disclosure, and safety rules.", icon: ShieldCheck },
  { category: "Performance Learning Loop", platform: "All Platforms", entries: 224, updated: "Today, 09:10", confidence: "95%", source: "AI", description: "Feedback loop that converts performance metrics into recommendations.", icon: Gauge }
];

const platforms = ["All Platforms", "YouTube", "TikTok", "Instagram", "Facebook"];
const categories = ["All Categories", ...knowledgeItems.map((item) => item.category)];

function KnowledgeCard({ item }: { item: (typeof knowledgeItems)[number] }) {
  return (
    <article className="premium-panel rounded-2xl p-5 transition hover:border-cyan-300/20 hover:bg-cyan-300/[0.025]">
      <div className="flex items-start justify-between gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl border border-cyan-300/10 bg-cyan-300/[0.06] text-cyan-200"><item.icon className="h-5 w-5" /></div>
        <span className="rounded-full border border-white/[0.07] bg-white/[0.035] px-2.5 py-1 text-[10px] font-semibold text-slate-400">{item.platform}</span>
      </div>
      <h2 className="mt-5 font-semibold text-white">{item.category}</h2>
      <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">{item.description}</p>
      <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 border-y border-white/[0.06] py-3">
        <div><div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">Entries</div><div className="mt-1 text-xs font-semibold text-slate-300">{item.entries}</div></div>
        <div><div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">Confidence</div><div className="mt-1 text-xs font-semibold text-cyan-100">{item.confidence}</div></div>
        <div><div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">Last updated</div><div className="mt-1 text-xs font-semibold text-slate-300">{item.updated}</div></div>
        <div><div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">Source type</div><div className="mt-1 text-xs font-semibold text-emerald-200">{item.source}</div></div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" className="rounded-lg border border-cyan-300/15 bg-cyan-300/[0.06] px-3 py-2 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-300/[0.1]">Open</button>
        <button type="button" className="rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.05]">Add Knowledge</button>
      </div>
    </article>
  );
}

export function KnowledgeBaseWorkspace() {
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState("All Platforms");
  const [category, setCategory] = useState("All Categories");
  const filteredItems = useMemo(() => knowledgeItems.filter((item) => {
    const normalizedQuery = query.trim().toLowerCase();
    const matchesQuery = !normalizedQuery || `${item.category} ${item.description} ${item.source}`.toLowerCase().includes(normalizedQuery);
    const matchesPlatform = platform === "All Platforms" || item.platform === platform || item.platform === "All Platforms";
    const matchesCategory = category === "All Categories" || item.category === category;
    return matchesQuery && matchesPlatform && matchesCategory;
  }), [category, platform, query]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Studio Intelligence"
        title="Knowledge Base"
        subtitle="Manage reusable knowledge for algorithms, creator patterns, hooks, CTA, policy, and performance learning."
        description="Knowledge cards menggunakan clean dummy data. Search dan filter berjalan lokal tanpa koneksi backend berat."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Knowledge Entries" value="1,654" detail="Across nine knowledge categories" />
        <StatCard label="Data-driven Sources" value="05" detail="Performance-backed collections" />
        <StatCard label="Average Confidence" value="93%" detail="Dummy knowledge quality score" />
        <StatCard label="Learning Updates" value="12" detail="Added in the last seven days" />
      </div>

      <DashboardPanel title="Search Knowledge" description="Filter the dummy library by keyword, platform, or category.">
        <div className="grid gap-3 lg:grid-cols-[1.35fr_0.7fr_1fr]">
          <label className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-3">
            <Search className="h-4 w-4 text-cyan-200" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search knowledge" className="min-w-0 flex-1 bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-600" />
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-3">
            <Filter className="h-4 w-4 text-cyan-200" />
            <select value={platform} onChange={(event) => setPlatform(event.target.value)} className="min-w-0 flex-1 bg-[#10172A] text-sm text-slate-300 outline-none">
              {platforms.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-3">
            <BookOpen className="h-4 w-4 text-cyan-200" />
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="min-w-0 flex-1 bg-[#10172A] text-sm text-slate-300 outline-none">
              {categories.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
        </div>
      </DashboardPanel>

      <DashboardPanel title="Knowledge Collections" description={`${filteredItems.length} dummy collections match the current filter.`}>
        {filteredItems.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredItems.map((item) => <KnowledgeCard key={item.category} item={item} />)}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-white/[0.1] bg-white/[0.018] px-6 py-10 text-center">
            <Search className="mx-auto h-5 w-5 text-slate-500" />
            <p className="mt-3 text-sm font-semibold text-slate-300">No knowledge collections found</p>
            <p className="mt-1 text-xs text-slate-600">Adjust the keyword or filter selection to display another dummy collection.</p>
          </div>
        )}
      </DashboardPanel>

      <DashboardPanel title="Performance Learning Loop" description="Dummy learning workflow prepared for future analytics integration.">
        <div className="grid gap-3 md:grid-cols-4">
          {[
            ["Collect Performance", "Gather views, retention, CTA, and conversion signals.", Database],
            ["Analyze Pattern", "Compare creator patterns, hooks, and algorithm signals.", BrainCircuit],
            ["Update Knowledge", "Store reusable learnings with a confidence score.", Plus],
            ["Recommend Action", "Feed the next content and campaign decisions.", Megaphone]
          ].map(([title, detail, Icon]) => (
            <article key={String(title)} className="rounded-xl border border-cyan-300/10 bg-cyan-300/[0.04] p-4">
              <Icon className="h-4 w-4 text-cyan-200" />
              <div className="mt-3 text-xs font-semibold text-slate-200">{String(title)}</div>
              <p className="mt-1.5 text-xs leading-5 text-slate-500">{String(detail)}</p>
            </article>
          ))}
        </div>
      </DashboardPanel>
    </div>
  );
}
