"use client";

import { BarChart3, Flame, Sparkles, Target, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DashboardPanel } from "@/components/dashboard/ui";
import { EmptyCard, ErrorCard } from "@/components/state-cards";
import { generateProductCampaignPlan } from "@/lib/affiliate/product-campaign-planner";
import { generateProductContentStrategy } from "@/lib/affiliate/product-content-strategy";
import { calculateAffiliateProductScore, productOpportunityInsight } from "@/lib/affiliate/product-scoring";
import type { AffiliateProductInsightDto } from "@/lib/intelligence/types";

const demoWarning = "Marketplace API not connected. Showing NOT CONNECTED sample data only.";
type ProductSourceType = "DEMO" | "MANUAL" | "CSV_IMPORT" | "REAL_API";

type Group = "trending" | "commission" | "competition" | "viral" | "recommended";

const groups: Array<{ id: Group; title: string; icon: typeof TrendingUp; pick: (rows: AffiliateProductInsightDto[]) => AffiliateProductInsightDto | undefined }> = [
  { id: "trending", title: "Trending Products", icon: TrendingUp, pick: (rows) => by(rows, (item) => score(item).trendScore) },
  { id: "commission", title: "High Commission Products", icon: BarChart3, pick: (rows) => by(rows, (item) => score(item).marginScore) },
  { id: "competition", title: "Low Competition Products", icon: Target, pick: (rows) => by(rows.filter((item) => item.competitionLevel === "Low"), (item) => score(item).competitionScore) },
  { id: "viral", title: "Viral Products", icon: Flame, pick: (rows) => by(rows, (item) => score(item).trendScore + score(item).contentEaseScore) },
  { id: "recommended", title: "Recommended Products", icon: Sparkles, pick: (rows) => by(rows, (item) => score(item).finalOpportunityScore) }
];

export function ProductOpportunityCards({ shortlistOnly = false }: { shortlistOnly?: boolean }) {
  const [products, setProducts] = useState<AffiliateProductInsightDto[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/affiliate/product-intelligence?take=70", { cache: "no-store" })
      .then((response) => response.json().then((payload) => ({ response, payload })))
      .then(({ response, payload }) => {
        if (!response.ok || !payload.success) throw new Error(payload.error?.message ?? "Product opportunity data failed to load.");
        setProducts(Array.isArray(payload.products) ? payload.products : []);
      })
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Product opportunity data failed to load."))
      .finally(() => setLoading(false));
  }, []);

  const cards = useMemo(() => {
    const selected = shortlistOnly ? groups.filter((item) => item.id === "recommended") : groups.filter((item) => item.id !== "recommended");
    return selected.map((group) => ({ ...group, product: group.pick(products) }));
  }, [products, shortlistOnly]);
  const demoActive = products.some((product) => sourceType(product.sourceType) === "DEMO" || product.isDemo);

  return (
    <DashboardPanel title={shortlistOnly ? "Recommended Product Shortlist" : "Product Opportunity Cards"} description={shortlistOnly ? "AI-curated product picks for the next affiliate campaign." : "Start here: compare real product opportunities before researching, campaigning, and publishing."}>
      {demoActive ? <p className="mb-4 rounded-xl border border-amber-300/20 bg-amber-300/[0.08] p-3 text-xs leading-5 text-amber-100">{demoWarning}</p> : null}
      {error ? <ErrorCard compact title="Product opportunities unavailable" description={error} /> : null}
      {loading ? <p className="text-sm text-slate-500">Loading product opportunities...</p> : null}
      {!loading && !products.length ? <EmptyCard title="No real product data" description="Configure product APIs, add a manual product, or import CSV data before reading opportunity cards." /> : null}
      <div className={`grid gap-3 sm:grid-cols-2 ${shortlistOnly ? "xl:grid-cols-4" : "xl:grid-cols-4"}`}>
        {cards.map(({ id, title, icon: Icon, product }) => (
          <article key={id} className="h-full rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-300/[0.08] text-cyan-200"><Icon className="h-4 w-4" /></div>
              <DataModeBadge mode={sourceType(product?.sourceType)} />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-white">{title}</h3>
            {product ? <ProductFields product={product} /> : <p className="mt-3 text-xs leading-5 text-slate-500">No complete product row available for this category.</p>}
          </article>
        ))}
      </div>
    </DashboardPanel>
  );
}

function ProductFields({ product }: { product: AffiliateProductInsightDto }) {
  const missing = product.missingFields ?? [];
  const productScore = score(product);
  const strategy = product.contentStrategy ?? generateProductContentStrategy(product, productScore);
  const campaignPlan = product.campaignPlan ?? generateProductCampaignPlan(product, productScore, strategy);
  return (
    <div className="mt-3 space-y-1.5 text-xs text-slate-400">
      <Field label="product_name" value={product.productName} strong />
      <Field label="platform" value={product.platform} />
      <Field label="category" value={product.category} />
      <Field label="price" value={money(product.price)} />
      <Field label="commission" value={product.commissionRate ? `${product.commissionRate}%` : product.commissionEstimate || "Missing"} />
      <Field label="sales_volume" value={number(product.salesVolume)} />
      <Field label="trend_score" value={number(productScore.trendScore)} />
      <Field label="trust_score" value={number(productScore.trustScore)} />
      <Field label="final_score" value={String(productScore.finalOpportunityScore)} />
      <Field label="label" value={productScore.opportunityLabel} />
      <Field label="content_format" value={strategy.bestContentFormat} />
      <Field label="best_angle" value={strategy.contentAngle} />
      <Field label="cta" value={strategy.CTA} />
      <Field label="campaign_duration" value={`${campaignPlan.campaignDurationDays} days`} />
      <Field label="posting_frequency" value={campaignPlan.recommendedPostingFrequency} />
      <Field label="campaign_cta" value={campaignPlan.dailyPlan[0]?.CTA ?? campaignPlan.campaignGoal} />
      <Field label="source" value={product.source} />
      <Field label="source_type" value={sourceLabel(sourceType(product.sourceType))} />
      <p className="pt-2 text-[11px] leading-5 text-slate-300">{productOpportunityInsight(product, productScore)}</p>
      <div className="pt-2 text-[11px] leading-5 text-slate-300">
        <p className="font-semibold text-slate-200">Hook ideas:</p>
        {strategy.hookIdeas.map((hook, index) => <p key={hook}>{index + 1}. {hook}</p>)}
      </div>
      {missing.length ? <p className="pt-2 text-[11px] leading-5 text-amber-100">Missing fields: {missing.join(", ")}. Score uses normalized fallback where needed.</p> : null}
    </div>
  );
}

function DataModeBadge({ mode }: { mode: ProductSourceType }) {
  const className = mode === "DEMO" ? "border-amber-300/20 bg-amber-300/[0.08] text-amber-100" : mode === "MANUAL" ? "border-cyan-300/20 bg-cyan-300/[0.08] text-cyan-100" : mode === "CSV_IMPORT" ? "border-blue-300/20 bg-blue-300/[0.08] text-blue-100" : "border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-100";
  return <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${className}`}>{sourceLabel(mode)}</span>;
}

function Field({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <div className="grid grid-cols-[120px_1fr] gap-2"><span className="text-slate-600">{label}</span><span className={strong ? "font-semibold text-white" : "text-slate-300"}>{value}</span></div>;
}
function by(rows: AffiliateProductInsightDto[], value: (item: AffiliateProductInsightDto) => number) { return [...rows].sort((a, b) => value(b) - value(a))[0]; }
function score(product: AffiliateProductInsightDto) { return calculateAffiliateProductScore(product); }
function sourceType(value: unknown): ProductSourceType { return value === "MANUAL" || value === "CSV_IMPORT" || value === "REAL_API" ? value : "DEMO"; }
function sourceLabel(value: ProductSourceType) { return value === "DEMO" ? "NOT CONNECTED - sample data" : value === "REAL_API" ? "REAL API" : value === "CSV_IMPORT" ? "CSV IMPORT" : value; }
function money(value?: number) { return value && value > 0 ? `Rp${Math.round(value).toLocaleString("id-ID")}` : "Missing"; }
function number(value?: number) { return Number.isFinite(value) && value ? value.toLocaleString("id-ID") : "Missing"; }
