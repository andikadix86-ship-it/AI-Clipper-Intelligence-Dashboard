"use client";

import { LoaderCircle, Scissors, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import { DashboardPanel } from "@/components/dashboard/ui";
import type { ClipPlan, ClipPlanMeta } from "@/lib/clipper/clipper-engine";

const initialForm = { sourceType: "youtube_url", sourceTitle: "Long-form creator workflow", sourceUrl: "", transcript: "", platform: "tiktok", language: "Bahasa Indonesia", contentObjective: "Temukan clip dengan hook dan retention terbaik", niche: "Creator Economy" };

export function ClipperEnginePanel() {
  const [form, setForm] = useState(initialForm);
  const [plan, setPlan] = useState<ClipPlan | null>(null);
  const [meta, setMeta] = useState<ClipPlanMeta | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/clipper/plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error?.message ?? "Clip plan gagal dibuat.");
      setPlan(payload.data); setMeta(payload.meta);
    } catch (requestError) {
      setPlan(null); setMeta(null); setError(requestError instanceof Error ? requestError.message : "Clip plan gagal dibuat.");
    } finally { setLoading(false); }
  }

  return <DashboardPanel title="Clipper Engine v1" description="Analisis transcript atau sumber video untuk menghasilkan rekomendasi clip pendek."><div className="grid gap-5 xl:grid-cols-[0.82fr_1.18fr]"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1"><Field label="Source title" value={form.sourceTitle} onChange={(sourceTitle) => setForm({ ...form, sourceTitle })} /><Field label="Source URL optional" value={form.sourceUrl} onChange={(sourceUrl) => setForm({ ...form, sourceUrl })} /><Select label="Platform" value={form.platform} options={["tiktok", "youtube", "instagram", "facebook"]} onChange={(platform) => setForm({ ...form, platform })} /><label><Label>Transcript optional</Label><textarea value={form.transcript} onChange={(event) => setForm({ ...form, transcript: event.target.value })} placeholder="Paste transcript jika tersedia." className="premium-input mt-1.5 min-h-20 px-3 py-2.5 text-xs" /></label><button type="button" onClick={generate} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60">{loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Scissors className="h-4 w-4" />} Generate Clip Plan</button></div><div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">{!plan ? <EmptyState icon={<Sparkles className="h-7 w-7 text-cyan-200" />} title={error || "Clip plan belum dibuat"} detail="Tambahkan sumber atau transcript, lalu jalankan engine." /> : <ClipResult plan={plan} meta={meta} />}</div></div></DashboardPanel>;
}

function ClipResult({ plan, meta }: { plan: ClipPlan; meta: ClipPlanMeta | null }) {
  return <div><div className="flex flex-wrap gap-2"><Badge>{meta?.provider === "gemini" ? "Gemini" : "Dummy"}</Badge><Badge>{meta?.mode === "real" ? "REAL" : "FALLBACK"}</Badge><Badge>{plan.policy_check.reused_content_risk} reuse risk</Badge></div><p className="mt-4 text-xs leading-5 text-slate-400">{plan.source_summary}</p><div className="mt-4 grid gap-2">{plan.best_segments.map((segment) => <div key={segment.segment_id} className="rounded-lg border border-white/[0.06] bg-white/[0.025] p-3"><div className="flex flex-wrap items-center justify-between gap-2"><div><div className="text-xs font-semibold text-white">{segment.clip_title}</div><div className="mt-1 text-[10px] uppercase tracking-wide text-slate-600">{segment.start_time} - {segment.end_time}</div></div><div className="text-[10px] font-semibold uppercase tracking-wide text-cyan-200">Hook {segment.hook_score} · Retention {segment.retention_score} · Fit {segment.platform_fit_score}</div></div><p className="mt-2 text-xs leading-5 text-slate-500">{segment.reason}</p></div>)}</div></div>;
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label><Label>{label}</Label><input value={value} onChange={(event) => onChange(event.target.value)} className="premium-input mt-1.5 px-3 py-2.5 text-sm" /></label>; }
function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) { return <label><Label>{label}</Label><select value={value} onChange={(event) => onChange(event.target.value)} className="premium-input mt-1.5 px-3 py-2.5 text-sm">{options.map((option) => <option key={option}>{option}</option>)}</select></label>; }
function Label({ children }: { children: React.ReactNode }) { return <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">{children}</span>; }
function Badge({ children }: { children: React.ReactNode }) { return <span className="inline-flex items-center gap-1 rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-cyan-100"><ShieldCheck className="h-3 w-3" />{children}</span>; }
function EmptyState({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) { return <div className="grid min-h-72 place-items-center text-center"><div>{icon}<p className="mt-3 text-sm font-semibold text-slate-300">{title}</p><p className="mt-1 text-xs text-slate-600">{detail}</p></div></div>; }
