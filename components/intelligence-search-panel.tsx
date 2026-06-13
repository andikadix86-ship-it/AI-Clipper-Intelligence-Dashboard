"use client";

import clsx from "clsx";
import { ExternalLink, Loader2, RefreshCw, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { studioHref } from "@/lib/intelligence/action-flow";
import type { DataDrivenAnalysisOutput } from "@/lib/intelligence/analysis-engine/types";
import { getSourceBadge, isDemoSource } from "@/lib/intelligence/source-utils";
import type { IntelligenceMode, IntelligencePlatform, IntelligenceSearchResult } from "@/lib/intelligence/search-engine/types";

const platformOptions: Array<{ value: IntelligencePlatform; label: string }> = [
  { value: "YOUTUBE", label: "YouTube Real" },
  { value: "GOOGLE_TRENDS", label: "Google Trends NOT CONNECTED" },
  { value: "REDDIT", label: "Reddit optional / NOT CONNECTED" },
  { value: "TIKTOK", label: "TikTok NOT CONNECTED" },
  { value: "SHOPEE", label: "Shopee NOT CONNECTED" },
  { value: "TOKOPEDIA", label: "Tokopedia NOT CONNECTED" }
];

export function IntelligenceSearchPanel({ mode }: { mode: IntelligenceMode }) {
  const [form, setForm] = useState({ keyword: "AI tools", niche: "", region: "ID", language: "id", timeRange: "7d", platforms: ["YOUTUBE"] as IntelligencePlatform[] });
  const [loading, setLoading] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [results, setResults] = useState<IntelligenceSearchResult[]>([]);
  const [providers, setProviders] = useState<Array<{ platform: IntelligencePlatform; status: string; message: string }>>([]);
  const [analysis, setAnalysis] = useState<DataDrivenAnalysisOutput | null>(null);
  const [message, setMessage] = useState("Real-data-first: Search Intelligence memakai YouTube Real secara default. Source NOT CONNECTED hanya berjalan jika dipilih manual.");
  const [cached, setCached] = useState(false);

  async function search(refresh = false) {
    setLoading(true);
    setAnalysis(null);
    try {
      const response = await fetch("/api/intelligence/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, mode, refresh }) });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.message ?? "Intelligence search gagal.");
      setResults(body.data.results ?? []);
      setProviders(body.data.providers ?? []);
      setCached(body.data.cached === true);
      setMessage(body.data.message);
    } catch (error) {
      setResults([]);
      setMessage(error instanceof Error ? `${error.message} Source NOT CONNECTED hanya dipakai jika dipilih manual.` : "Intelligence search gagal.");
    } finally {
      setLoading(false);
    }
  }

  async function analyze(result: IntelligenceSearchResult) {
    setAnalyzingId(result.id);
    try {
      const response = await fetch("/api/intelligence/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode, result }) });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.message ?? "Analysis gagal.");
      setAnalysis(body.data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Analysis gagal.");
    } finally {
      setAnalyzingId(null);
    }
  }

  function togglePlatform(platform: IntelligencePlatform) {
    setForm((current) => ({ ...current, platforms: current.platforms.includes(platform) ? current.platforms.filter((item) => item !== platform) : [...current.platforms, platform] }));
  }

  return (
    <section className="rounded-2xl border border-white/[0.06] bg-[#111A2E] p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase text-primary">Data-driven foundation</div>
          <h2 className="mt-2 text-2xl font-semibold text-white">Intelligence Search Engine</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Search real public signals first. NOT CONNECTED sources are opt-in fallback for manual exploration.</p>
        </div>
        <div className="flex gap-2">
          {cached ? <Badge tone="info">Cached 30 min</Badge> : null}
          <Badge tone={mode === "affiliate" ? "success" : "info"}>{mode} mode</Badge>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-[1.5fr_1fr_110px_110px_120px]">
        <input value={form.keyword} onChange={(event) => setForm({ ...form, keyword: event.target.value })} className="premium-input px-4 py-3" placeholder="Keyword: AI tools, blender portable..." />
        <input value={form.niche} onChange={(event) => setForm({ ...form, niche: event.target.value })} className="premium-input px-4 py-3" placeholder="Niche optional" />
        <select value={form.region} onChange={(event) => setForm({ ...form, region: event.target.value })} className="premium-input px-3 py-3"><option value="ID">ID</option><option value="US">US</option><option value="SG">SG</option></select>
        <select value={form.language} onChange={(event) => setForm({ ...form, language: event.target.value })} className="premium-input px-3 py-3"><option value="id">id</option><option value="en">en</option></select>
        <select value={form.timeRange} onChange={(event) => setForm({ ...form, timeRange: event.target.value })} className="premium-input px-3 py-3"><option value="7d">7 days</option><option value="30d">30 days</option><option value="90d">90 days</option></select>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {platformOptions.map((platform) => <button key={platform.value} type="button" onClick={() => togglePlatform(platform.value)} className={clsx("rounded-lg border px-3 py-2 text-xs font-semibold", form.platforms.includes(platform.value) ? "border-primary/50 bg-primary/15 text-blue-100" : "border-white/[0.06] bg-white/[0.03] text-slate-400")}>{platform.label}</button>)}
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" disabled={loading || !form.platforms.length} onClick={() => search()} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}Search Intelligence</button>
        <button type="button" disabled={loading || !results.length} onClick={() => search(true)} className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] px-4 py-3 text-sm font-semibold text-slate-200 disabled:opacity-50"><RefreshCw className="h-4 w-4" />Refresh Source</button>
      </div>
      <p className="mt-3 text-sm text-slate-400">{message}</p>
      {providers.length ? <div className="mt-4 flex flex-wrap gap-2">{providers.map((provider) => <span key={provider.platform} title={provider.message} className="rounded-full border border-white/[0.08] px-3 py-1 text-xs text-slate-300">{provider.platform}: {provider.status}</span>)}</div> : null}

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {results.map((result) => <article key={result.id} className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
          <div className="flex flex-wrap items-center gap-2"><Badge tone={result.isDemo || isDemoSource(result.source) ? "warning" : "success"}>{getSourceBadge(result.source)}</Badge><Badge tone="default">{result.platform}</Badge><Badge tone="default">{result.trendDirection}</Badge></div>
          <h3 className="mt-3 text-lg font-semibold text-white">{result.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">{result.notes}</p>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
            <Metric label="Trend" value={result.trendScore} />
            <Metric label="Potential" value={result.contentPotentialScore} />
            <Metric label="Competition" value={result.competitionScore} />
            <Metric label="Recency" value={result.recencyScore} />
            <Metric label="Fit" value={result.platformFitScore} />
          </div>
          <div className="mt-3 text-xs leading-5 text-slate-500">{result.source} | Confidence {result.confidence}% | Collected {new Date(result.collectedAt).toLocaleString("id-ID")}</div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => analyze(result)} disabled={analyzingId === result.id} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{analyzingId === result.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}Analyze</button>
            <Link href={studioHref({ topic: result.topic, keyword: result.keyword, source: result.source, sourceUrl: result.sourceUrl, score: result.trendScore, confidence: result.confidence, platform: result.platform, reason: result.notes, recommendedContentAngle: `Create an original ${result.topic} angle.`, isDemo: result.isDemo, notes: result.notes, suggestedHook: `Perhatikan ini sebelum mencoba ${result.keyword}.`, suggestedCaption: `${result.topic}: buat angle original dan validasi hasilnya.`, generationType: "AI_VIDEO" })} className="rounded-lg border border-white/[0.08] px-3 py-2 text-xs font-semibold text-slate-200">Creative Studio</Link>
            {result.sourceUrl ? <a href={result.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] px-3 py-2 text-xs font-semibold text-slate-200"><ExternalLink className="h-3.5 w-3.5" />Source</a> : null}
          </div>
        </article>)}
        {!results.length ? <div className="rounded-xl border border-dashed border-white/[0.08] p-5 text-sm leading-6 text-slate-400 xl:col-span-2">Belum ada hasil. Masukkan keyword lalu klik Search Intelligence. Jika YouTube API gagal atau quota habis, source NOT CONNECTED hanya bisa dipilih manual.</div> : null}
      </div>
      {analysis ? <AnalysisSummary analysis={analysis} /> : null}
    </section>
  );
}

function AnalysisSummary({ analysis }: { analysis: DataDrivenAnalysisOutput }) {
  return <div className="mt-5 rounded-xl border border-primary/30 bg-primary/10 p-5"><div className="flex flex-wrap gap-2"><Badge tone={analysis.isDemo ? "warning" : "success"}>{analysis.isDemo ? "NOT CONNECTED" : "REAL"}</Badge><Badge tone="info">{analysis.opportunityLevel} opportunity</Badge><Badge tone="warning">{analysis.riskLevel} risk</Badge></div><h3 className="mt-3 text-lg font-semibold text-white">Data-driven Analysis: {analysis.keyword}</h3><p className="mt-2 text-sm leading-6 text-blue-100">{analysis.summary}</p><div className="mt-4 grid gap-3 md:grid-cols-3"><Summary label="Trend Stage" value={analysis.trendStage} /><Summary label="Audience Fit" value={analysis.audience} /><Summary label="Content Gap" value={analysis.contentGap} /></div><div className="mt-4 text-sm text-slate-300"><strong>Action plan:</strong> {analysis.actionPlan.join(" -> ")}</div><div className="mt-3 text-xs leading-5 text-slate-400">{analysis.notes}</div></div>;
}

function Metric({ label, value }: { label: string; value: number }) { return <div className="rounded-lg border border-white/[0.06] p-2"><div className="text-[10px] uppercase text-slate-500">{label}</div><div className="mt-1 font-semibold text-white">{value}</div></div>; }
function Summary({ label, value }: { label: string; value: string }) { return <div className="rounded-lg border border-white/[0.06] bg-black/10 p-3"><div className="text-[10px] uppercase text-slate-500">{label}</div><div className="mt-1 text-sm leading-5 text-slate-200">{value}</div></div>; }
function Badge({ children, tone }: { children: React.ReactNode; tone: "default" | "info" | "success" | "warning" }) { return <span className={clsx("rounded-full border px-2.5 py-1 text-xs font-semibold", tone === "success" && "border-emerald-400/25 bg-emerald-400/10 text-emerald-200", tone === "warning" && "border-amber-400/25 bg-amber-400/10 text-amber-100", tone === "info" && "border-blue-400/25 bg-blue-400/10 text-blue-100", tone === "default" && "border-white/[0.08] bg-white/[0.03] text-slate-300")}>{children}</span>; }
