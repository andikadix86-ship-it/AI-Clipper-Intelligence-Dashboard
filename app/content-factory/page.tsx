"use client";

import { Factory } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AffiliateContentFactory } from "@/components/affiliate-content-factory";
import type { AffiliateCampaignDraft } from "@/lib/intelligence/action-flow";
import { listCampaigns } from "@/lib/intelligence/affiliate-persistence";

export default function ContentFactoryPage() { return <Suspense fallback={<div className="text-sm text-slate-400">Loading Content Factory...</div>}><ContentFactory /></Suspense>; }

function ContentFactory() {
  const params = useSearchParams();
  const [campaigns, setCampaigns] = useState<AffiliateCampaignDraft[]>([]);
  const [campaignId, setCampaignId] = useState("");
  useEffect(() => { listCampaigns().then((result) => { setCampaigns(result.items); setCampaignId(params.get("campaign") ?? result.items[0]?.id ?? ""); }); }, [params]);
  const campaign = campaigns.find((item) => item.id === campaignId);
  return (
    <div className="space-y-6">
      <header><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-sm text-emerald-100"><Factory className="h-4 w-4" />Affiliate Production</div><h1 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">Content Factory</h1><p className="mt-3 max-w-3xl text-slate-300">Choose a campaign, generate editable content variations, and send the final direction to Creative Studio.</p></header>
      {campaigns.length ? <><section className="glass rounded-2xl p-5"><label className="block max-w-xl"><span className="mb-2 block text-sm font-medium text-slate-300">Choose Campaign</span><select value={campaignId} onChange={(event) => setCampaignId(event.target.value)} className="premium-input px-4 py-3">{campaigns.map((item) => <option key={item.id} value={item.id}>{item.campaignName}</option>)}</select></label>{campaign ? <p className="mt-3 text-sm text-slate-400">{campaign.productName} | {campaign.platform} | Score {campaign.trendScore} | {campaign.isDemo ? "Demo Source" : "Real Source"}</p> : null}</section>{campaign ? <AffiliateContentFactory campaign={campaign} /> : null}</> : <Empty />}
    </div>
  );
}

function Empty() { return <section className="glass grid min-h-72 place-items-center rounded-2xl p-8 text-center"><div><Factory className="mx-auto mb-4 h-10 w-10 text-emerald-300" /><h2 className="text-xl font-semibold text-white">Belum ada campaign</h2><p className="mt-2 max-w-md text-sm leading-6 text-slate-400">Mulai dari Product Hunter untuk mencari produk potensial.</p><Link href="/trending-center" className="mt-5 inline-flex rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white">Open Product Hunter</Link></div></section>; }
