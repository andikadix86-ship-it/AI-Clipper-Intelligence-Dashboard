"use client";

import { BrainCircuit, LoaderCircle, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import type { IntelligenceBrief, IntelligenceBriefMeta } from "@/lib/intelligence/intelligence-engine";
import { DashboardPanel } from "@/components/dashboard/ui";

const initialForm = { niche: "Creator Economy", platform: "TIKTOK", contentObjective: "Meningkatkan engagement", targetAudience: "UMKM dan content creator", language: "Bahasa Indonesia", contentType: "Short-form explainer", keyword: "" };

export function IntelligenceBriefPanel() {
  const [form, setForm] = useState(initialForm);
  const [brief, setBrief] = useState<IntelligenceBrief | null>(null);
  const [meta, setMeta] = useState<IntelligenceBriefMeta | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/intelligence/brief", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error?.message ?? "Intelligence brief gagal dibuat.");
      setBrief(payload.data);
      setMeta(payload.meta);
    } catch (requestError) {
      setBrief(null);
      setMeta(null);
      setError(requestError instanceof Error ? requestError.message : "Intelligence brief gagal dibuat.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardPanel title="Intelligence Brief Engine v1" description="Generate rekomendasi awal berbasis niche, platform, audience intent, dan policy guardrail.">
      <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <Field label="Niche" value={form.niche} onChange={(niche) => setForm({ ...form, niche })} />
          <Select label="Platform" value={form.platform} options={["TIKTOK", "YOUTUBE_SHORTS", "INSTAGRAM_REELS", "FACEBOOK_REELS"]} onChange={(platform) => setForm({ ...form, platform })} />
          <Field label="Objective" value={form.contentObjective} onChange={(contentObjective) => setForm({ ...form, contentObjective })} />
          <Field label="Keyword optional" value={form.keyword} onChange={(keyword) => setForm({ ...form, keyword })} />
          <button type="button" onClick={generate} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60">
            {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Generate Intelligence Brief
          </button>
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
          {!brief ? <div className="grid min-h-64 place-items-center text-center"><div><BrainCircuit className="mx-auto h-7 w-7 text-cyan-200" /><p className="mt-3 text-sm font-semibold text-slate-300">{error || "Brief belum dibuat"}</p><p className="mt-1 text-xs text-slate-600">Isi parameter lalu jalankan Intelligence Engine.</p></div></div> : <BriefResult brief={brief} meta={meta} />}
        </div>
      </div>
    </DashboardPanel>
  );
}

function BriefResult({ brief, meta }: { brief: IntelligenceBrief; meta: IntelligenceBriefMeta | null }) {
  return <div><div className="flex flex-wrap items-center gap-2"><Badge>{meta?.mode === "real" ? "REAL" : "FALLBACK"}</Badge><Badge>{meta?.provider === "gemini" ? "Gemini" : "Dummy"}</Badge><Badge>{brief.policy_risk} policy risk</Badge></div><h3 className="mt-4 text-base font-semibold text-white">{brief.topic}</h3><p className="mt-2 text-xs leading-5 text-slate-400">{brief.recommended_angle}</p><div className="mt-4 grid gap-3 sm:grid-cols-3"><Metric label="Trend" value={String(brief.trend_score)} /><Metric label="Opportunity" value={String(brief.opportunity_score)} /><Metric label="Competition" value={brief.competition_level} /></div><div className="mt-4"><div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">Hook ideas</div><div className="mt-2 space-y-1.5">{brief.hook_ideas.map((hook) => <p key={hook} className="rounded-lg bg-white/[0.025] px-3 py-2 text-xs text-slate-400">{hook}</p>)}</div></div><div className="mt-4 flex flex-wrap gap-1.5">{brief.knowledge_base_tags.map((tag) => <span key={tag} className="rounded-full border border-cyan-300/10 bg-cyan-300/[0.04] px-2 py-1 text-[10px] text-cyan-100">{tag}</span>)}</div></div>;
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label><span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} className="premium-input mt-1.5 px-3 py-2.5 text-sm" /></label>;
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label><span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="premium-input mt-1.5 px-3 py-2.5 text-sm">{options.map((option) => <option key={option}>{option}</option>)}</select></label>;
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center gap-1 rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-cyan-100"><ShieldCheck className="h-3 w-3" />{children}</span>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-white/[0.06] bg-white/[0.025] p-3"><div className="text-[10px] uppercase tracking-[0.12em] text-slate-600">{label}</div><div className="mt-1 text-sm font-bold capitalize text-slate-200">{value}</div></div>;
}
