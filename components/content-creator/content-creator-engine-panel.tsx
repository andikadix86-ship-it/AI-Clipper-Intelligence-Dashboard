"use client";

import { FileText, LoaderCircle, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import { DashboardPanel } from "@/components/dashboard/ui";
import type { ContentPackage, ContentPackageMeta } from "@/lib/content-creator/content-creator-engine";

const initialForm = { niche: "Creator Economy", platform: "TIKTOK", contentObjective: "Meningkatkan engagement", targetAudience: "UMKM dan content creator", language: "Bahasa Indonesia", contentType: "Short-form explainer", tone: "Professional and approachable", duration: "30 seconds", intelligenceBrief: undefined };

export function ContentCreatorEnginePanel() {
  const [form, setForm] = useState(initialForm);
  const [contentPackage, setContentPackage] = useState<ContentPackage | null>(null);
  const [meta, setMeta] = useState<ContentPackageMeta | null>(null);
  const [briefJson, setBriefJson] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const intelligenceBrief = briefJson.trim() ? JSON.parse(briefJson) : undefined;
      const response = await fetch("/api/content-creator/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, intelligenceBrief }) });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error?.message ?? "Content package gagal dibuat.");
      setContentPackage(payload.data);
      setMeta(payload.meta);
    } catch (requestError) {
      setContentPackage(null);
      setMeta(null);
      setError(requestError instanceof Error ? requestError.message : "Content package gagal dibuat.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardPanel title="AI Content Creator Engine v1" description="Gunakan Intelligence Brief atau input manual untuk membuat paket konten lengkap.">
      <div className="grid gap-5 xl:grid-cols-[0.82fr_1.18fr]">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <Field label="Niche" value={form.niche} onChange={(niche) => setForm({ ...form, niche })} />
          <Select label="Platform" value={form.platform} options={["TIKTOK", "YOUTUBE_SHORTS", "INSTAGRAM_REELS", "FACEBOOK_REELS"]} onChange={(platform) => setForm({ ...form, platform })} />
          <Field label="Objective" value={form.contentObjective} onChange={(contentObjective) => setForm({ ...form, contentObjective })} />
          <label><span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">Use Intelligence Brief optional</span><textarea value={briefJson} onChange={(event) => setBriefJson(event.target.value)} placeholder="Paste Intelligence Brief JSON, atau biarkan kosong untuk input manual." className="premium-input mt-1.5 min-h-24 px-3 py-2.5 text-xs" /></label>
          <button type="button" onClick={generate} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60">
            {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Generate Content Package
          </button>
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
          {!contentPackage ? <div className="grid min-h-72 place-items-center text-center"><div><FileText className="mx-auto h-7 w-7 text-cyan-200" /><p className="mt-3 text-sm font-semibold text-slate-300">{error || "Content package belum dibuat"}</p><p className="mt-1 text-xs text-slate-600">Gunakan brief atau input manual lalu jalankan engine.</p></div></div> : <PackageResult contentPackage={contentPackage} meta={meta} />}
        </div>
      </div>
    </DashboardPanel>
  );
}

function PackageResult({ contentPackage, meta }: { contentPackage: ContentPackage; meta: ContentPackageMeta | null }) {
  return <div><div className="flex flex-wrap gap-2"><Badge>{meta?.provider === "gemini" ? "Gemini" : "Dummy"}</Badge><Badge>{meta?.mode === "real" ? "REAL" : "FALLBACK"}</Badge><Badge>{contentPackage.policy_check.risk_level} policy risk</Badge></div><h3 className="mt-4 text-base font-semibold text-white">{contentPackage.platform_metadata.title}</h3><p className="mt-2 text-xs leading-5 text-slate-400">{contentPackage.caption}</p><div className="mt-4"><Label>Hook options</Label><div className="mt-2 space-y-1.5">{contentPackage.hook_options.map((hook) => <p key={hook} className="rounded-lg bg-white/[0.025] px-3 py-2 text-xs text-slate-400">{hook}</p>)}</div></div><div className="mt-4"><Label>Platform CTA</Label><p className="mt-2 rounded-lg border border-cyan-300/10 bg-cyan-300/[0.04] px-3 py-2 text-xs leading-5 text-cyan-100">{contentPackage.cta}</p></div><div className="mt-4 grid gap-2 sm:grid-cols-3">{contentPackage.scene_plan.map((scene) => <div key={scene.scene} className="rounded-lg border border-white/[0.06] bg-white/[0.025] p-3"><div className="text-[10px] font-semibold uppercase tracking-wide text-cyan-200">Scene {scene.scene}</div><p className="mt-2 text-xs leading-5 text-slate-400">{scene.visual_direction}</p></div>)}</div></div>;
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

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">{children}</div>;
}
