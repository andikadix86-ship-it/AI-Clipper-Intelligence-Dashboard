"use client";

import { PackageSearch } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { productStudioContext, studioHref } from "@/lib/intelligence/action-flow";
import { persistCampaign, persistOpportunity } from "@/lib/intelligence/affiliate-persistence";
import type { AffiliateProductInsightDto } from "@/lib/intelligence/types";

export default function WinningProductsPage() {
  const [products, setProducts] = useState<AffiliateProductInsightDto[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/intelligence/products").then((response) => response.json()).then((data) => setProducts(data.products ?? [])).catch(() => setMessage("Demo product insight gagal dimuat."));
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-sm text-emerald-100"><PackageSearch className="h-4 w-4" />Affiliate Discovery</div>
        <h1 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">Winning Products</h1>
        <p className="mt-3 max-w-3xl text-slate-300">Explore demo product insights, save an opportunity, or create a local affiliate campaign draft.</p>
      </header>
      {message ? <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">{message}</div> : null}
      <section className="grid gap-4 xl:grid-cols-2">
        {products.map((product) => (
          <article key={product.id} className="glass rounded-2xl p-5">
            <div className="flex flex-wrap gap-2"><Badge>Demo Source</Badge><Badge>{product.platform}</Badge><Badge>{product.trendScore}/100</Badge></div>
            <h2 className="mt-4 text-xl font-semibold text-white">{product.productName}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">{product.notes}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={studioHref(productStudioContext(product))} className="rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white">Generate Content</Link>
              <button type="button" onClick={async () => { const result = await persistOpportunity({ topic: product.productName, type: "affiliate_product", source: product.source, sourceUrl: product.sourceUrl, score: product.trendScore, confidence: product.confidence, platform: product.platform, reason: product.notes, notes: product.notes, isDemo: product.isDemo }); setMessage(result.message); }} className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-white">Save Opportunity</button>
              <button type="button" onClick={async () => { const result = await persistCampaign({ campaignName: `${product.productName} Campaign`, productName: product.productName, platform: product.platform, category: product.category, trendScore: product.trendScore, competitionLevel: product.competitionLevel, commissionEstimate: product.commissionEstimate, priceRange: product.priceRange, contentPotentialScore: product.contentPotentialScore, source: product.source, sourceUrl: product.sourceUrl, notes: product.notes, isDemo: product.isDemo }); setMessage(result.message); }} className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-white">Create Campaign</button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-slate-200">{children}</span>;
}
