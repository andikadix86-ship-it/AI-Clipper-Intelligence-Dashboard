"use client";

import { FolderKanban } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AffiliateContentFactory } from "@/components/affiliate-content-factory";
import { defaultCampaignInsight, type AffiliateCampaignDraft } from "@/lib/intelligence/action-flow";
import { loadCampaign } from "@/lib/intelligence/affiliate-persistence";

export default function CampaignDetailPage({ params }: { params: { id: string } }) {
  const [campaign, setCampaign] = useState<AffiliateCampaignDraft | null>();
  useEffect(() => { loadCampaign(params.id).then((result) => setCampaign(result.item ?? null)); }, [params.id]);
  if (campaign === undefined) return <div className="text-sm text-slate-400">Loading campaign...</div>;
  if (!campaign) return <Empty />;
  const insight = defaultCampaignInsight(campaign);
  const plan = ["Problem awareness", "Product benefit", "Social proof", "Comparison", "Urgency / promo"];
  return (
    <div className="space-y-6">
      <header><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-sm text-emerald-100"><FolderKanban className="h-4 w-4" />Campaign Detail</div><h1 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">{campaign.campaignName}</h1><p className="mt-3 text-slate-300">{campaign.productName} affiliate content workspace.</p></header>
      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="glass rounded-2xl p-5"><div className="flex flex-wrap gap-2"><Badge>{campaign.isDemo ? "Demo Source" : "Real Source"}</Badge><Badge>{campaign.dataSource === "database" ? "DB Saved" : "Local Draft"}</Badge><Badge>{campaign.platform}</Badge></div><div className="mt-4 space-y-3"><Info label="Product" value={campaign.productName} /><Info label="Audience" value={campaign.targetAudience || "Audience belum diisi"} /><Info label="Goal" value={campaign.contentObjective || "Goal belum diisi"} /><Info label="Category" value={campaign.category} /><Info label="Trend Score" value={`${campaign.trendScore}/100`} /><Info label="Commission Estimate" value={campaign.commissionEstimate} /><Info label="Price Range" value={campaign.priceRange} /><Info label="Source" value={campaign.source} /></div></div>
        <div className="glass rounded-2xl p-5"><h2 className="text-xl font-semibold text-white">Product Insight</h2><div className="mt-4 grid gap-3 md:grid-cols-2"><Info label="Problem Solved" value={insight.problem} /><Info label="Target Audience" value={insight.targetAudience} /><Info label="Main Benefit" value={insight.mainBenefit} /><Info label="Content Angle" value={insight.contentAngle} /><Info label="Risk / Competition" value={insight.riskNote} /></div></div>
      </section>
      <section className="glass rounded-2xl p-5"><h2 className="text-xl font-semibold text-white">5-Day Content Plan</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{plan.map((item, index) => <Info key={item} label={`Day ${index + 1}`} value={item} />)}</div></section>
      <AffiliateContentFactory campaign={campaign} />
    </div>
  );
}

function Empty() { return <section className="glass grid min-h-72 place-items-center rounded-2xl p-8 text-center"><div><h1 className="text-xl font-semibold text-white">Campaign tidak ditemukan</h1><p className="mt-2 text-sm text-slate-400">Draft lokal mungkin belum dibuat pada browser ini.</p><Link href="/campaigns" className="mt-5 inline-flex rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white">Back to Campaign Center</Link></div></section>; }
function Badge({ children }: { children: React.ReactNode }) { return <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-slate-200">{children}</span>; }
function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3"><div className="text-xs font-semibold uppercase text-slate-500">{label}</div><p className="mt-1 text-sm leading-6 text-slate-300">{value}</p></div>; }
