"use client";

import clsx from "clsx";
import { Check, Copy, Save, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  generateContentKit,
  productStudioContext,
  isAffiliatePlanReady,
  saveGeneratedContent,
  studioHref,
  type AffiliateCampaignDraft,
  type AffiliateContentKit
} from "@/lib/intelligence/action-flow";
import { loadContentKit, persistContentKit } from "@/lib/intelligence/affiliate-persistence";

type Tab = "hooks" | "scripts" | "captions" | "hashtags" | "ctas" | "voiceOverScripts" | "scenePlans" | "videoPrompts";
const tabs: Array<{ id: Tab; label: string; action: string }> = [
  { id: "hooks", label: "Hooks", action: "Generate 5 Hooks" },
  { id: "scripts", label: "Scripts", action: "Generate Script" },
  { id: "captions", label: "Captions", action: "Generate 5 Captions" },
  { id: "hashtags", label: "Hashtags", action: "Generate Hashtag" },
  { id: "ctas", label: "CTA", action: "Generate 5 CTA" },
  { id: "voiceOverScripts", label: "Voice Over", action: "Generate Voice Over" },
  { id: "scenePlans", label: "Scene Plan", action: "Generate Scene Plan" },
  { id: "videoPrompts", label: "Video Prompts", action: "Generate 3 Video Prompts" }
];

export function AffiliateContentFactory({ campaign }: { campaign: AffiliateCampaignDraft }) {
  const [kit, setKit] = useState<AffiliateContentKit>(() => generateContentKit(campaign));
  const [activeTab, setActiveTab] = useState<Tab>("hooks");
  const [copied, setCopied] = useState<string | null>(null);
  const [message, setMessage] = useState("Editable template kit ready.");
  const [storageSource, setStorageSource] = useState<"database" | "local">("local");
  const [loaded, setLoaded] = useState(false);
  const [planReady, setPlanReady] = useState(false);

  useEffect(() => {
    setPlanReady(isAffiliatePlanReady(campaign.id));
  }, [campaign.id]);
  useEffect(() => {
    if (!planReady) return;
    setLoaded(false);
    loadContentKit(campaign.id).then((result) => {
      setKit(result.item ?? generateContentKit(campaign));
      setStorageSource(result.source);
      setMessage(result.message ?? (result.item ? "Generated content loaded." : "Editable template kit ready."));
      setLoaded(true);
    });
  }, [campaign, planReady]);
  useEffect(() => {
    if (!loaded || kit.campaignId !== campaign.id) return;
    saveGeneratedContent(kit);
    const timeout = setTimeout(() => persistContentKit(campaign, kit).then((result) => { setStorageSource(result.source); setMessage(result.message); }), 900);
    return () => clearTimeout(timeout);
  }, [campaign, kit, loaded]);

  const studioContext = useMemo(() => {
    const context = productStudioContext({
      id: campaign.id,
      productName: campaign.productName,
      platform: campaign.platform as "TikTok Shop" | "Shopee" | "Tokopedia" | "Lazada" | "Facebook" | "Instagram" | "Custom Affiliate",
      category: campaign.category,
      trendScore: campaign.trendScore,
      competitionLevel: campaign.competitionLevel as "Low" | "Medium" | "High",
      commissionEstimate: campaign.commissionEstimate,
      priceRange: campaign.priceRange,
      contentPotentialScore: campaign.contentPotentialScore,
      source: campaign.source,
      sourceUrl: campaign.sourceUrl,
      confidence: 30,
      collectedAt: campaign.createdAt,
      isDemo: campaign.isDemo,
      notes: campaign.notes
    });
    context.campaignId = campaign.id;
    context.recommendedContentAngle = kit.videoPrompts[0] ?? kit.contentAngle;
    context.suggestedHook = kit.hooks[0] ?? "";
    context.suggestedCaption = kit.captions[0] ?? "";
    context.script = kit.scripts[0];
    context.cta = kit.ctas[0];
    return context;
  }, [campaign, kit]);

  function updateField(field: keyof Pick<AffiliateContentKit, "targetAudience" | "mainBenefit" | "problem" | "tone" | "contentAngle">, value: string) {
    setKit((current) => ({ ...current, [field]: value, updatedAt: new Date().toISOString() }));
  }

  function updateResult(index: number, value: string) {
    setKit((current) => ({ ...current, [activeTab]: current[activeTab].map((item, itemIndex) => itemIndex === index ? value : item), updatedAt: new Date().toISOString() }));
  }

  function regenerate() {
    setKit((current) => {
      const generated = generateContentKit(campaign, { targetAudience: current.targetAudience, mainBenefit: current.mainBenefit, problem: current.problem, tone: current.tone, contentAngle: current.contentAngle });
      return { ...current, [activeTab]: generated[activeTab], updatedAt: new Date().toISOString() };
    });
    setMessage(`${tabs.find((tab) => tab.id === activeTab)?.action ?? "Template"} ready.`);
  }

  async function saveKit() {
    const result = await persistContentKit(campaign, kit);
    setStorageSource(result.source);
    setMessage(result.message);
  }

  async function copyText(value: string, key: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setMessage("Copied to clipboard.");
    } catch {
      setMessage("Copy gagal. Pilih teks lalu salin secara manual.");
    }
  }

  if (!planReady) {
    return <section className="glass grid min-h-60 place-items-center rounded-2xl p-6 text-center"><div><Sparkles className="mx-auto h-8 w-8 text-slate-600" /><h2 className="mt-3 text-lg font-semibold text-white">Generate Affiliate Plan terlebih dahulu</h2><p className="mt-2 max-w-md text-sm leading-6 text-slate-400">Content Factory dibuka setelah campaign tersimpan dan Affiliate Engine selesai membuat plan.</p><Link href="/affiliate-center" className="mt-4 inline-flex rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white">Open Affiliate Engine</Link></div></section>;
  }

  return (
    <section className="glass rounded-2xl p-5 md:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex flex-wrap gap-2"><Badge>{campaign.isDemo ? "Demo Source" : "Real Source"}</Badge><Badge>{storageSource === "database" ? "DB Saved" : "Local Draft"}</Badge><Badge>Template Generator</Badge></div>
          <h2 className="mt-3 text-xl font-semibold text-white">Generate Content Kit</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">Edit campaign assumptions, generate reusable variations, then send the selected direction to Creative Studio.</p>
          <p className="mt-2 text-xs leading-5 text-cyan-100">Target accounts: {campaign.affiliateAccounts?.map((account) => `${account.platform} ${account.handle}`).join(" | ") || "Belum dipilih"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={saveKit} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-white"><Save className="h-4 w-4" />Save Kit</button>
          <Link href={studioHref(studioContext)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white"><Sparkles className="h-4 w-4" />Use in Creative Studio</Link>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <Field label="Target audience" value={kit.targetAudience} onChange={(value) => updateField("targetAudience", value)} />
        <Field label="Main benefit" value={kit.mainBenefit} onChange={(value) => updateField("mainBenefit", value)} />
        <Field label="Problem solved" value={kit.problem} onChange={(value) => updateField("problem", value)} />
        <Field label="Tone" value={kit.tone} onChange={(value) => updateField("tone", value)} />
        <div className="md:col-span-2"><Field label="Content angle" value={kit.contentAngle} onChange={(value) => updateField("contentAngle", value)} /></div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((tab) => <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={clsx("rounded-xl border px-3 py-2 text-xs font-semibold", activeTab === tab.id ? "border-primary bg-primary text-white" : "border-white/10 bg-white/[0.04] text-slate-300")}>{tab.label}</button>)}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-emerald-200">{message}</p>
        <button type="button" onClick={regenerate} className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-white">{tabs.find((tab) => tab.id === activeTab)?.action}</button>
      </div>
      <div className="mt-4 space-y-3">
        {kit[activeTab].map((value, index) => (
          <div key={`${activeTab}-${index}`} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <textarea value={value} onChange={(event) => updateResult(index, event.target.value)} rows={activeTab === "scripts" || activeTab === "voiceOverScripts" || activeTab === "scenePlans" || activeTab === "videoPrompts" ? 4 : 2} className="premium-input px-3 py-2 text-sm" />
            <button type="button" onClick={() => copyText(value, `${activeTab}-${index}`)} className="mt-2 inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200">
              {copied === `${activeTab}-${index}` ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
              {copied === `${activeTab}-${index}` ? "Copied" : "Copy"}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block"><span className="mb-2 block text-xs font-semibold uppercase text-slate-500">{label}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} rows={3} className="premium-input px-3 py-2 text-sm" /></label>;
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-slate-200">{children}</span>;
}
