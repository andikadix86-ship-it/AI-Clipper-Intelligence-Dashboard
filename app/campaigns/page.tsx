"use client";

import { FolderKanban } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { generateContentKit, getCampaignDrafts, productStudioContext, studioHref, type AffiliateCampaignDraft } from "@/lib/intelligence/action-flow";
import { listCampaigns, migrateLocalCampaigns } from "@/lib/intelligence/affiliate-persistence";

export default function CampaignCenterPage() {
  const [campaigns, setCampaigns] = useState<AffiliateCampaignDraft[]>([]);
  const [notice, setNotice] = useState("");
  const [hasLocal, setHasLocal] = useState(false);
  useEffect(() => {
    setHasLocal(getCampaignDrafts().some((item) => item.dataSource !== "database"));
    listCampaigns().then((result) => { setCampaigns(result.items); setNotice(result.message ?? "Campaign database loaded."); });
  }, []);

  async function migrate() {
    const result = await migrateLocalCampaigns();
    const loaded = await listCampaigns();
    setCampaigns(loaded.items);
    setHasLocal(result.migrated < result.total);
    setNotice(result.migrated === result.total ? "Data lokal berhasil dipindahkan ke database." : "Sebagian data belum dapat dipindahkan. Draft lokal tetap aman.");
  }

  return (
    <div className="space-y-6">
      <header>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-sm text-emerald-100"><FolderKanban className="h-4 w-4" />Affiliate Workflow</div>
        <h1 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">Campaign Center</h1>
        <p className="mt-3 max-w-3xl text-slate-300">Manage local campaign drafts and continue each product into a structured affiliate content kit.</p>
      </header>
      {notice ? <Notice message={notice} /> : null}
      {hasLocal ? <MigrationNotice onMigrate={migrate} onKeep={() => setHasLocal(false)} /> : null}
      {campaigns.length ? <section className="grid gap-4 xl:grid-cols-2">{campaigns.map((campaign) => <CampaignCard key={campaign.id} campaign={campaign} />)}</section> : <Empty />}
    </div>
  );
}

function CampaignCard({ campaign }: { campaign: AffiliateCampaignDraft }) {
  const templates = generateContentKit(campaign);
  const context = productStudioContext({ id: campaign.id, productName: campaign.productName, platform: campaign.platform as "Shopee" | "TikTok Shop" | "Tokopedia", category: campaign.category, trendScore: campaign.trendScore, competitionLevel: campaign.competitionLevel as "Low" | "Medium" | "High", commissionEstimate: campaign.commissionEstimate, priceRange: campaign.priceRange, contentPotentialScore: campaign.contentPotentialScore, source: campaign.source, sourceUrl: campaign.sourceUrl, confidence: 30, collectedAt: campaign.createdAt, isDemo: campaign.isDemo, notes: campaign.notes });
  context.campaignId = campaign.id;
  context.recommendedContentAngle = templates.videoPrompts[0];
  context.suggestedHook = templates.hooks[0];
  context.suggestedCaption = templates.captions[0];
  return (
    <article className="glass rounded-2xl p-5">
      <div className="flex flex-wrap gap-2"><Badge>{campaign.isDemo ? "Demo Source" : "Real Source"}</Badge><Badge>{campaign.dataSource === "database" ? "DB Saved" : "Local Draft"}</Badge><Badge>{campaign.platform}</Badge></div>
      <h2 className="mt-4 text-xl font-semibold text-white">{campaign.campaignName}</h2>
      <p className="mt-1 text-sm text-slate-300">{campaign.productName}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">Created: {new Date(campaign.createdAt).toLocaleString("id-ID")} | Source: {campaign.source}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2"><Info label="Score" value={`${campaign.trendScore}/100`} /><Info label="Next Action" value="Open campaign and generate content kit" /></div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={`/campaigns/${campaign.id}`} className="rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white">Open Campaign</Link>
        <Link href={`/content-factory?campaign=${campaign.id}`} className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-white">Generate Content Kit</Link>
        <Link href={studioHref(context)} className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-white">Send to Creative Studio</Link>
      </div>
    </article>
  );
}

function Empty() {
  return <section className="glass grid min-h-72 place-items-center rounded-2xl p-8 text-center"><div><FolderKanban className="mx-auto mb-4 h-10 w-10 text-emerald-300" /><h2 className="text-xl font-semibold text-white">Belum ada campaign affiliate</h2><p className="mt-2 max-w-md text-sm leading-6 text-slate-400">Mulai dari Product Hunter untuk mencari produk potensial.</p><Link href="/trending-center" className="mt-5 inline-flex rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white">Open Product Hunter</Link></div></section>;
}

function Badge({ children }: { children: React.ReactNode }) { return <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-slate-200">{children}</span>; }
function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3"><div className="text-xs font-semibold uppercase text-slate-500">{label}</div><p className="mt-1 text-sm text-slate-300">{value}</p></div>; }
function Notice({ message }: { message: string }) { return <div className="rounded-xl border border-blue-300/20 bg-blue-300/10 p-4 text-sm text-blue-100">{message}</div>; }
function MigrationNotice({ onMigrate, onKeep }: { onMigrate: () => void; onKeep: () => void }) { return <div className="rounded-xl border border-amber-300/20 bg-amber-300/10 p-4"><p className="text-sm text-amber-100">Data lokal ditemukan. Pindahkan ke database?</p><div className="mt-3 flex gap-2"><button type="button" onClick={onMigrate} className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white">Migrate Now</button><button type="button" onClick={onKeep} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200">Keep Local</button></div></div>; }
