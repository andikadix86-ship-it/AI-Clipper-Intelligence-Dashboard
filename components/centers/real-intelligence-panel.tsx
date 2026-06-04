"use client";

import { ArrowUpRight, Database, Search, TrendingDown, TrendingUp } from "lucide-react";
import { useState } from "react";
import { DashboardPanel } from "@/components/dashboard/ui";

type Signal = { source: string; keyword: string; trend_score: number; confidence_score: number; collected_at: string; mode: "real" | "fallback" | "knowledge"; message: string };
type Opportunity = { topic: string; score: number; opportunity_reason: string; audience_intent: string; content_angle: string; estimated_difficulty: string };
type Result = { aggregate: { trend_score: number; opportunity_score: number; competition_score: number; confidence_score: number; rising_keywords: string[]; declining_keywords: string[]; signals: Signal[]; feedback: { saved: number } }; opportunities: Opportunity[] };

export function RealIntelligencePanel() {
  const [form, setForm] = useState({ niche: "creator economy", platform: "tiktok", keyword: "AI content workflow" });
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/intelligence/trends", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error?.message ?? "Trend signals gagal dikumpulkan.");
      setResult(payload.data);
    } catch (requestError) {
      setResult(null); setError(requestError instanceof Error ? requestError.message : "Trend signals gagal dikumpulkan.");
    } finally { setLoading(false); }
  }

  return <DashboardPanel title="Real Intelligence Data Layer" description="Collect source signals, aggregate trend opportunity, and preserve dummy fallback when external data is unavailable.">
    <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto]">
      <Field label="Niche" value={form.niche} onChange={(value) => setForm({ ...form, niche: value })} />
      <Field label="Platform" value={form.platform} onChange={(value) => setForm({ ...form, platform: value })} />
      <Field label="Keyword" value={form.keyword} onChange={(value) => setForm({ ...form, keyword: value })} />
      <button type="button" onClick={generate} disabled={loading} className="mt-auto inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 px-4 text-xs font-bold text-white disabled:opacity-60"><Search className="h-4 w-4" />{loading ? "Collecting..." : "Collect Signals"}</button>
    </div>
    {error ? <div className="mt-4 rounded-xl border border-rose-300/15 bg-rose-300/[0.06] p-3 text-xs text-rose-100">{error}</div> : null}
    {result ? <div className="mt-5 space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[["Trend Score", result.aggregate.trend_score], ["Opportunity", result.aggregate.opportunity_score], ["Competition", result.aggregate.competition_score], ["Confidence", result.aggregate.confidence_score]].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4"><div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div><div className="mt-2 text-2xl font-bold text-white">{value}</div></div>)}</div>
      <div><h3 className="text-sm font-semibold text-white">Trending Keywords</h3><div className="mt-3 flex flex-wrap gap-2">{result.aggregate.signals.map((signal, index) => <span key={`${signal.source}-${signal.keyword}-${index}`} title={signal.message} className="rounded-full border border-white/[0.08] bg-white/[0.035] px-3 py-1.5 text-[11px] text-slate-300"><SourceBadge source={signal.source} mode={signal.mode} /> {signal.keyword} <b className="text-cyan-100">{signal.trend_score}</b></span>)}</div></div>
      <div className="grid gap-5 xl:grid-cols-2"><Board title="Rising Topics" icon={TrendingUp} tone="text-emerald-300" rows={result.aggregate.rising_keywords} /><Board title="Declining Keywords" icon={TrendingDown} tone="text-rose-300" rows={result.aggregate.declining_keywords} /></div>
      <div><h3 className="text-sm font-semibold text-white">Opportunity Board</h3><div className="mt-3 grid gap-3 xl:grid-cols-3">{result.opportunities.map((item) => <article key={item.topic} className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4"><div className="flex items-center justify-between gap-3"><span className="rounded-full bg-cyan-300/[0.08] px-2 py-1 text-[10px] font-semibold uppercase text-cyan-100">{item.estimated_difficulty}</span><strong className="text-cyan-100">{item.score}</strong></div><h4 className="mt-3 text-sm font-semibold text-white">{item.topic}</h4><p className="mt-2 text-xs leading-5 text-slate-500">{item.content_angle}</p><div className="mt-3 flex items-center gap-1 text-[10px] uppercase tracking-wide text-slate-600"><ArrowUpRight className="h-3 w-3" />Top Content Angle</div></article>)}</div></div>
      <div className="flex items-center gap-2 rounded-xl border border-cyan-300/10 bg-cyan-300/[0.04] p-3 text-xs text-slate-500"><Database className="h-4 w-4 text-cyan-200" />{result.aggregate.feedback.saved} high-score signals persisted to Knowledge Base.</div>
    </div> : <div className="mt-4 rounded-xl border border-dashed border-white/10 p-4 text-xs text-slate-500">Collect signals to populate Trending Keywords, Opportunity Board, Top Content Angles, and Rising Topics.</div>}
  </DashboardPanel>;
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="text-xs font-semibold text-slate-400">{label}<input value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-300/30" /></label>; }
function SourceBadge({ source, mode }: { source: string; mode: string }) { return <span className={mode === "real" ? "text-emerald-200" : mode === "knowledge" ? "text-blue-200" : "text-amber-200"}>{source}</span>; }
function Board({ title, icon: Icon, tone, rows }: { title: string; icon: typeof TrendingUp; tone: string; rows: string[] }) { return <div><h3 className="flex items-center gap-2 text-sm font-semibold text-white"><Icon className={`h-4 w-4 ${tone}`} />{title}</h3><div className="mt-3 space-y-2">{rows.length ? rows.map((row) => <div key={row} className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3 text-xs text-slate-400">{row}</div>) : <div className="rounded-xl border border-dashed border-white/10 p-3 text-xs text-slate-600">No signal yet.</div>}</div></div>; }
