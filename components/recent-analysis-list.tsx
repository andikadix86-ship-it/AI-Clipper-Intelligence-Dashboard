"use client";

import clsx from "clsx";
import { ExternalLink, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type AnalysisRow = { id: string; topic: string; keyword: string; mode: "creator" | "affiliate"; summary: string; score: number; confidence: number; isDemo: boolean; trendStage: string; opportunityLevel: string; riskLevel: string; createdAt: string };

export function RecentAnalysisList() {
  const [filters, setFilters] = useState({ mode: "", dataMode: "", minConfidence: "0" });
  const [rows, setRows] = useState<AnalysisRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ ...filters, take: "12" });
      const response = await fetch(`/api/intelligence/analyses?${params}`);
      const body = await response.json();
      setRows(response.ok ? body.analyses ?? [] : []);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  return <section className="rounded-2xl border border-white/[0.06] bg-[#111A2E] p-5"><div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between"><div><div className="text-xs font-semibold uppercase text-primary">Persisted results</div><h2 className="mt-2 text-2xl font-semibold text-white">Recent Data-Driven Analysis</h2><p className="mt-2 text-sm text-slate-400">Open previous analyses or narrow the list by workflow and confidence.</p></div><button type="button" onClick={load} disabled={loading} className="inline-flex w-fit items-center gap-2 rounded-lg border border-white/[0.08] px-3 py-2 text-sm font-semibold text-slate-200 disabled:opacity-50">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}Apply Filters</button></div><div className="mt-4 grid gap-3 md:grid-cols-3"><select value={filters.mode} onChange={(event) => setFilters({ ...filters, mode: event.target.value })} className="premium-input px-3 py-2"><option value="">All modes</option><option value="creator">Creator</option><option value="affiliate">Affiliate</option></select><select value={filters.dataMode} onChange={(event) => setFilters({ ...filters, dataMode: event.target.value })} className="premium-input px-3 py-2"><option value="">Real + Demo</option><option value="real">Real only</option><option value="demo">Demo only</option></select><select value={filters.minConfidence} onChange={(event) => setFilters({ ...filters, minConfidence: event.target.value })} className="premium-input px-3 py-2"><option value="0">Any confidence</option><option value="40">Confidence ≥ 40%</option><option value="70">Confidence ≥ 70%</option></select></div><div className="mt-4 grid gap-3 xl:grid-cols-2">{rows.length ? rows.map((row) => <article key={row.id} className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4"><div className="flex flex-wrap gap-2"><Badge warning={row.isDemo}>{row.isDemo ? "Demo" : "Real"}</Badge><Badge>{row.mode}</Badge><Badge>{row.confidence}% confidence</Badge></div><h3 className="mt-3 font-semibold text-white">{row.topic}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">{row.summary}</p><div className="mt-3 text-xs text-slate-500">{row.trendStage} · {row.opportunityLevel} opportunity · {row.riskLevel} risk · {new Date(row.createdAt).toLocaleString("id-ID")}</div><Link href={`/analysis/${row.id}`} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white"><ExternalLink className="h-4 w-4" />Open Detail</Link></article>) : <div className="rounded-xl border border-dashed border-white/[0.08] p-5 text-sm text-slate-400 xl:col-span-2">Belum ada hasil analysis tersimpan. Mulai dari Trending Center, cari signal, lalu klik Analyze.</div>}</div></section>;
}

function Badge({ children, warning = false }: { children: React.ReactNode; warning?: boolean }) { return <span className={clsx("rounded-full border px-2.5 py-1 text-xs font-semibold", warning ? "border-amber-400/25 bg-amber-400/10 text-amber-100" : "border-blue-400/25 bg-blue-400/10 text-blue-100")}>{children}</span>; }
