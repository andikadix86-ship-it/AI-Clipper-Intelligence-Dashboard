"use client";

import { BadgeDollarSign, CheckCircle2, FolderKanban, LoaderCircle, LockKeyhole, Plus, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CampaignCreationModal } from "@/components/affiliate/campaign-creation-modal";
import { DashboardPanel } from "@/components/dashboard/ui";
import type { AffiliatePlan, AffiliatePlanMeta, AffiliateInput } from "@/lib/affiliate/affiliate-engine";
import { markAffiliatePlanReady, type AffiliateCampaignDraft } from "@/lib/intelligence/action-flow";
import { listCampaigns } from "@/lib/intelligence/affiliate-persistence";

export function AffiliateEnginePanel() {
  const [campaigns, setCampaigns] = useState<AffiliateCampaignDraft[]>([]);
  const [campaignId, setCampaignId] = useState("");
  const [plan, setPlan] = useState<AffiliatePlan | null>(null);
  const [meta, setMeta] = useState<AffiliatePlanMeta | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const campaign = campaigns.find((item) => item.id === campaignId);

  const loadCampaigns = useCallback(() => {
    listCampaigns().then((result) => {
      const databaseCampaigns = result.items.filter((item) => item.dataSource === "database");
      setCampaigns(databaseCampaigns);
      setCampaignId((current) => databaseCampaigns.some((item) => item.id === current) ? current : databaseCampaigns[0]?.id ?? "");
      setNotice(result.message ?? (databaseCampaigns.length !== result.items.length ? "Draft lokal ditemukan. Simpan ulang campaign ke Supabase sebelum menjalankan engine." : ""));
      setLoadingCampaigns(false);
    });
  }, []);

  useEffect(() => {
    loadCampaigns();
    window.addEventListener("affiliate:campaign-saved", loadCampaigns);
    return () => window.removeEventListener("affiliate:campaign-saved", loadCampaigns);
  }, [loadCampaigns]);

  async function generate() {
    if (!campaign?.affiliateAccounts?.length) {
      setError("Pilih produk, buat campaign, lalu pilih minimal satu affiliate account sebelum Generate Affiliate Plan.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/affiliate/plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(campaignInput(campaign)) });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error?.message ?? "Affiliate plan gagal dibuat.");
      setPlan(payload.data);
      setMeta(payload.meta);
      markAffiliatePlanReady(campaign.id);
    } catch (requestError) {
      setPlan(null);
      setMeta(null);
      setError(requestError instanceof Error ? requestError.message : "Affiliate plan gagal dibuat.");
    } finally {
      setLoading(false);
    }
  }

  function saved(savedCampaign: AffiliateCampaignDraft, message: string) {
    setCampaigns((current) => [savedCampaign, ...current.filter((item) => item.id !== savedCampaign.id)]);
    setCampaignId(savedCampaign.id);
    setPlan(null);
    setMeta(null);
    setError("");
    setNotice(message);
  }

  const campaignReady = Boolean(campaign?.affiliateAccounts?.length);
  const step = plan ? 5 : campaignReady ? 4 : campaign ? 3 : 2;

  return (
    <>
      <DashboardPanel title="Affiliate Engine v1" description="Campaign-first workflow untuk product scoring dan rencana soft selling lima hari.">
        <WorkflowProgress current={step} />
        {notice ? <p className="mt-4 rounded-xl border border-cyan-300/15 bg-cyan-300/[0.04] p-3 text-xs leading-5 text-cyan-100">{notice}</p> : null}
        <div className="mt-5 grid gap-5 xl:grid-cols-[0.82fr_1.18fr]">
          <div className="space-y-3">
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Active Campaign</p><p className="mt-1 text-sm text-slate-400">Affiliate Engine aktif setelah campaign tersimpan.</p></div>
                <button type="button" onClick={() => setModalOpen(true)} className="inline-flex items-center gap-2 rounded-lg border border-cyan-300/15 bg-cyan-300/[0.06] px-3 py-2 text-xs font-semibold text-cyan-100"><Plus className="h-3.5 w-3.5" />Create Campaign</button>
              </div>
              {loadingCampaigns ? <p className="mt-4 inline-flex items-center gap-2 text-xs text-slate-500"><LoaderCircle className="h-3.5 w-3.5 animate-spin" />Loading campaigns...</p> : campaigns.length ? <select value={campaignId} onChange={(event) => { setCampaignId(event.target.value); setPlan(null); setMeta(null); }} className="premium-input mt-4 px-3 py-2.5 text-sm">{campaigns.map((item) => <option key={item.id} value={item.id}>{item.campaignName}</option>)}</select> : <p className="mt-4 rounded-lg border border-dashed border-white/10 p-3 text-xs leading-5 text-slate-500">Belum ada campaign. Pilih Winning Product, simpan opportunity, lalu buat campaign.</p>}
            </div>
            {campaign ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1"><ReadOnly label="Product" value={campaign.productName} /><ReadOnly label="Audience" value={campaign.targetAudience || "Audience belum diisi"} /><ReadOnly label="Target Platforms" value={campaign.targetPlatforms?.join(", ") || campaign.platform} /><ReadOnly label="Affiliate Accounts" value={campaign.affiliateAccounts?.map((account) => `${account.platform}: ${account.handle}`).join(", ") || "Pilih account pada Campaign Manager"} /><ReadOnly label="Goal" value={campaign.contentObjective || "Goal belum diisi"} /></div> : null}
            <button type="button" onClick={generate} disabled={loading || !campaignReady} title={!campaignReady ? "Pilih produk, buat campaign, lalu pilih affiliate account terlebih dahulu." : undefined} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45">{loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : campaignReady ? <BadgeDollarSign className="h-4 w-4" /> : <LockKeyhole className="h-4 w-4" />}Generate Affiliate Plan</button>
          </div>
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">{!plan ? <EmptyState title={error || (campaignReady ? "Campaign siap untuk Generate Affiliate Plan" : "Affiliate Engine terkunci")} campaignReady={campaignReady} /> : <AffiliateResult campaign={campaign!} plan={plan} meta={meta} />}</div>
        </div>
      </DashboardPanel>
      <CampaignCreationModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={saved} />
    </>
  );
}

function WorkflowProgress({ current }: { current: number }) {
  const steps = ["Choose Product", "Save Opportunity", "Create Campaign", "Select Accounts", "Generate Plan", "Generate Content", "Publishing"];
  return <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">{steps.map((label, index) => { const complete = index < current; const active = index === current; return <div key={label} className={`rounded-xl border px-3 py-3 ${complete ? "border-emerald-300/20 bg-emerald-300/[0.06]" : active ? "border-cyan-300/25 bg-cyan-300/[0.07]" : "border-white/[0.07] bg-white/[0.025]"}`}><div className="flex items-center gap-2"><span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold ${complete ? "bg-emerald-300/15 text-emerald-100" : active ? "bg-cyan-300/15 text-cyan-100" : "bg-white/[0.05] text-slate-600"}`}>{complete ? <CheckCircle2 className="h-3.5 w-3.5" /> : index + 1}</span><span className={`text-[10px] font-semibold uppercase tracking-wide ${complete ? "text-emerald-100" : active ? "text-cyan-100" : "text-slate-600"}`}>{label}</span></div></div>; })}</div>;
}

function AffiliateResult({ campaign, plan, meta }: { campaign: AffiliateCampaignDraft; plan: AffiliatePlan; meta: AffiliatePlanMeta | null }) {
  return <div><div className="flex flex-wrap gap-2"><Badge>{meta?.provider === "gemini" ? "Gemini" : "Dummy"}</Badge><Badge>{meta?.mode === "real" ? "REAL" : "FALLBACK"}</Badge><Badge>{plan.risk_check.exaggerated_claim_risk} claim risk</Badge></div><div className="mt-4 flex items-end gap-3"><div className="text-4xl font-bold text-cyan-200">{plan.product_score.overall_score}</div><div className="pb-1 text-xs uppercase tracking-wide text-slate-500">Product score - {plan.product_score.recommendation}</div></div><p className="mt-3 text-xs leading-5 text-slate-400">{plan.content_strategy.recommended_angle}</p><div className="mt-4 rounded-lg border border-cyan-300/10 bg-cyan-300/[0.035] p-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-cyan-100">Account Recommendation</p><p className="mt-2 text-xs leading-5 text-slate-300">{plan.account_recommendation.join(" | ")}</p></div><div className="mt-4 grid gap-2 sm:grid-cols-5">{plan.campaign_plan.map((item) => <div key={item.day} className="rounded-lg border border-white/[0.06] bg-white/[0.025] p-3"><div className="text-[10px] font-semibold uppercase tracking-wide text-cyan-200">Day {item.day}</div><p className="mt-2 text-xs font-semibold text-slate-300">{item.content_idea}</p><p className="mt-1 text-[11px] leading-4 text-slate-600">{item.goal}</p></div>)}</div><p className="mt-4 rounded-lg border border-amber-300/10 bg-amber-300/[0.035] px-3 py-2 text-xs leading-5 text-amber-100">{plan.affiliate_cta.disclosure_note}</p><Link href={`/content-factory?campaign=${campaign.id}`} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white"><Sparkles className="h-4 w-4" />Generate Content</Link></div>;
}

function campaignInput(campaign: AffiliateCampaignDraft): AffiliateInput {
  return { campaignId: campaign.id, productId: campaign.productId, dataMode: campaign.dataMode, isDemo: campaign.isDemo, productName: campaign.productName, productCategory: campaign.category, platform: normalizePlatform(campaign.platform), targetAudience: campaign.targetAudience || `Audience produk ${campaign.category}`, priceRange: campaign.priceRange, commissionRate: campaign.commissionEstimate, contentObjective: campaign.contentObjective || "sales conversion", language: "Bahasa Indonesia", affiliateAccounts: campaign.affiliateAccounts?.map((account) => ({ platform: account.platform, handle: account.handle, role: account.role })) };
}

function normalizePlatform(platform: string): AffiliateInput["platform"] {
  const value = platform.toLowerCase();
  if (value.includes("youtube")) return "youtube";
  if (value.includes("instagram")) return "instagram";
  if (value.includes("facebook")) return "facebook";
  if (value.includes("shopee")) return "shopee";
  return "tiktok";
}

function ReadOnly({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">{label}</p><p className="mt-1 text-sm text-slate-300">{value}</p></div>; }
function Badge({ children }: { children: React.ReactNode }) { return <span className="inline-flex items-center gap-1 rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-cyan-100"><ShieldCheck className="h-3 w-3" />{children}</span>; }
function EmptyState({ title, campaignReady }: { title: string; campaignReady: boolean }) { return <div className="grid min-h-72 place-items-center text-center"><div>{campaignReady ? <Sparkles className="mx-auto h-7 w-7 text-cyan-200" /> : <FolderKanban className="mx-auto h-7 w-7 text-slate-500" />}<p className="mt-3 text-sm font-semibold text-slate-300">{title}</p><p className="mt-1 text-xs leading-5 text-slate-600">{campaignReady ? "Campaign dan account target siap. Jalankan engine untuk membuat affiliate plan." : "Pilih produk dari Product Intelligence Center, buat campaign, lalu pilih affiliate account terlebih dahulu."}</p></div></div>; }
