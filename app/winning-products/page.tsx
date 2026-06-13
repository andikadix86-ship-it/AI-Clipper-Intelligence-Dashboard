"use client";

import { AlertTriangle, LoaderCircle, PackageSearch } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CampaignCreationModal, type CampaignProductSeed } from "@/components/affiliate/campaign-creation-modal";
import { persistOpportunity } from "@/lib/intelligence/affiliate-persistence";
import type { AffiliateProductInsightDto } from "@/lib/intelligence/types";

type ProductSourceType = NonNullable<AffiliateProductInsightDto["sourceType"]>;
type SourceView = "ACTIVE" | ProductSourceType;

const sourceFilters: Array<{ value: SourceView; label: string }> = [
  { value: "ACTIVE", label: "Active Source" },
  { value: "MANUAL", label: "Manual" },
  { value: "CSV_IMPORT", label: "CSV Import" },
  { value: "REAL_API", label: "Real API" },
  { value: "DEMO", label: "Demo" }
];

export default function WinningProductsPage() {
  const [products, setProducts] = useState<AffiliateProductInsightDto[]>([]);
  const [sourceView, setSourceView] = useState<SourceView>("ACTIVE");
  const [activeSourceType, setActiveSourceType] = useState<ProductSourceType>("DEMO");
  const [marketplaceStatus, setMarketplaceStatus] = useState("Loading Product Intelligence source status...");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [campaignSeed, setCampaignSeed] = useState<CampaignProductSeed>();

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      setMessage(null);
      try {
        const params = new URLSearchParams({ take: "12", sort: "Highest Score" });
        if (sourceView !== "ACTIVE") params.set("sourceType", sourceView);
        const payload = await fetchJson(`/api/affiliate/product-intelligence?${params.toString()}`);
        if (ignore) return;
        const rows = safeProducts(payload.products);
        const sourceType = productSourceType(payload.activeSourceType ?? (sourceView === "ACTIVE" ? rows[0]?.sourceType : sourceView));
        setProducts(rows);
        setActiveSourceType(sourceType);
        setMarketplaceStatus(typeof payload.marketplaceStatus === "string" ? payload.marketplaceStatus : sourceType === "DEMO" ? "Marketplace API not connected. Showing NOT CONNECTED sample data only." : `${sourceType} product data active.`);
      } catch (error) {
        if (ignore) return;
        setProducts([]);
        setActiveSourceType("DEMO");
        setMarketplaceStatus("Product Intelligence belum dapat dimuat.");
        setMessage(error instanceof Error ? error.message : "Winning Products gagal dimuat.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [sourceView]);

  const winningProducts = useMemo(() => [...products].sort((a, b) => finalScore(b) - finalScore(a)).slice(0, 8), [products]);
  const demoMode = winningProducts.length
    ? winningProducts.every((product) => productSourceType(product.sourceType) === "DEMO")
    : activeSourceType === "DEMO" && (sourceView === "ACTIVE" || sourceView === "DEMO");

  async function saveOpportunity(product: AffiliateProductInsightDto) {
    const sourceType = productSourceType(product.sourceType);
    setSavingId(product.id);
    try {
      const result = await persistOpportunity({
        topic: product.productName,
        type: "affiliate_product",
        sourceType,
        source: product.source,
        sourceUrl: product.sourceUrl,
        score: finalScore(product),
        confidence: product.confidence,
        platform: product.platform,
        reason: product.notes,
        notes: sourceType === "DEMO" ? `${product.notes} NOT CONNECTED - sample data: belum berasal dari marketplace real.` : product.notes,
        isDemo: sourceType === "DEMO"
      });
      setMessage(sourceType === "DEMO" ? `${result.message} Warning: NOT CONNECTED sample opportunity hanya contoh dan belum valid untuk keputusan affiliate.` : result.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Opportunity gagal disimpan.");
    } finally {
      setSavingId("");
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-sm text-emerald-100"><PackageSearch className="h-4 w-4" />Affiliate Discovery</div>
        <h1 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">Winning Products</h1>
        <p className="mt-3 max-w-3xl text-slate-300">Demo product discovery preview. Import CSV or add manual products to analyze real opportunities.</p>
      </header>

      {demoMode ? <div className="flex gap-3 rounded-xl border border-amber-300/20 bg-amber-300/[0.08] p-4 text-sm leading-6 text-amber-100"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span>Demo Discovery Mode — produk ini hanya contoh, belum berasal dari marketplace real.</span></div> : null}
      {message ? <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">{message}</div> : null}

      <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">Source Filter</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {sourceFilters.map((item) => <button key={item.value} type="button" onClick={() => setSourceView(item.value)} className={`rounded-lg border px-3 py-2 text-[11px] font-semibold uppercase tracking-wide ${sourceView === item.value ? "border-cyan-300/30 bg-cyan-300/[0.12] text-cyan-100" : "border-white/10 bg-white/[0.035] text-slate-400"}`}>{item.label}</button>)}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <SourceBadge source={activeSourceType} demoOnly={activeSourceType === "DEMO"} />
            <Badge>{winningProducts.length} products</Badge>
            <Badge>{marketplaceStatus}</Badge>
          </div>
        </div>
      </section>

      {loading ? <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 text-sm text-slate-400"><LoaderCircle className="mr-2 inline h-4 w-4 animate-spin" />Loading Product Intelligence products...</div> : winningProducts.length ? (
        <section className="grid gap-4 xl:grid-cols-2">
          {winningProducts.map((product) => {
            const sourceType = productSourceType(product.sourceType);
            const demo = sourceType === "DEMO";
            return (
              <article key={product.id} className={`rounded-2xl border p-5 ${demo ? "border-amber-300/15 bg-amber-300/[0.035]" : "border-white/[0.07] bg-white/[0.025]"}`}>
                <div className="flex flex-wrap gap-2"><SourceBadge source={sourceType} demoOnly={demo} /><Badge>{product.platform}</Badge><Badge>{finalScore(product)}/100</Badge>{product.campaignPlan ? <Badge>Campaign Plan Ready</Badge> : null}</div>
                <h2 className="mt-4 text-xl font-semibold text-white">{product.productName}</h2>
                <p className="mt-1 text-xs text-slate-500">{product.category} / {product.commissionEstimate} commission / {product.priceRange}</p>
                <p className="mt-3 text-sm leading-6 text-slate-400">{product.notes}</p>
                {demo ? <p className="mt-3 rounded-lg border border-amber-300/15 bg-amber-300/[0.06] p-3 text-xs leading-5 text-amber-100">NOT CONNECTED - sample data: produk ini hanya preview discovery dan belum valid untuk keputusan affiliate.</p> : null}
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  <Metric label="Demand" value={`${product.scoreBreakdown?.demandScore ?? product.salesVolume ?? 0}`} />
                  <Metric label="Trend" value={`${product.scoreBreakdown?.trendScore ?? product.trendScore}`} />
                  <Metric label="Trust" value={`${product.scoreBreakdown?.trustScore ?? product.confidence}`} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => saveOpportunity(product)} disabled={savingId === product.id} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{savingId === product.id ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : null}Save Opportunity</button>
                  <button type="button" onClick={() => setCampaignSeed(productSeed(product))} className="rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white">Create Campaign</button>
                </div>
              </article>
            );
          })}
        </section>
      ) : <EmptyState sourceView={sourceView} />}

      <CampaignCreationModal open={Boolean(campaignSeed)} seed={campaignSeed} onClose={() => setCampaignSeed(undefined)} onSaved={(_, savedMessage) => setMessage(`${savedMessage} Lanjutkan Generate Affiliate Plan di Affiliate Center.`)} />
    </div>
  );
}

async function fetchJson(url: string) {
  const response = await fetch(url, { cache: "no-store" });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error?.message ?? payload.message ?? "Product Intelligence belum dapat dimuat.");
  return payload;
}

function safeProducts(value: unknown): AffiliateProductInsightDto[] {
  return Array.isArray(value) ? value.filter((item): item is AffiliateProductInsightDto => Boolean(item && typeof item === "object" && "id" in item && "productName" in item)) : [];
}

function finalScore(product: AffiliateProductInsightDto) {
  return Math.round(product.scoreBreakdown?.finalOpportunityScore ?? product.opportunityScore ?? product.trendScore ?? 0);
}

function productSourceType(value: unknown): ProductSourceType {
  return value === "MANUAL" || value === "CSV_IMPORT" || value === "REAL_API" ? value : "DEMO";
}

function dataMode(sourceType: ProductSourceType): CampaignProductSeed["dataMode"] {
  if (sourceType === "MANUAL") return "MANUAL DATA";
  if (sourceType === "CSV_IMPORT") return "CSV IMPORT";
  if (sourceType === "REAL_API") return "REAL API";
  return "DEMO DATA";
}

function productSeed(product: AffiliateProductInsightDto): CampaignProductSeed {
  const sourceType = productSourceType(product.sourceType);
  return {
    ...product,
    productId: product.id,
    finalOpportunityScore: finalScore(product),
    dataMode: product.dataMode ?? dataMode(sourceType),
    missingProductFields: product.missingFields,
    contentStrategy: product.contentStrategy,
    campaignPlan: product.campaignPlan,
    isDemo: sourceType === "DEMO",
    notes: sourceType === "DEMO" ? `${product.notes} NOT CONNECTED - sample data: belum berasal dari marketplace real.` : product.notes
  };
}

function SourceBadge({ source, demoOnly = false }: { source: ProductSourceType; demoOnly?: boolean }) {
  const tone = source === "DEMO" ? "border-amber-300/20 bg-amber-300/[0.08] text-amber-100" : source === "MANUAL" ? "border-cyan-300/20 bg-cyan-300/[0.08] text-cyan-100" : source === "CSV_IMPORT" ? "border-blue-300/20 bg-blue-300/[0.08] text-blue-100" : "border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-100";
  return <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${tone}`}>{demoOnly ? "NOT CONNECTED - sample data" : source.replace("_", " ")}</span>;
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-slate-200">{children}</span>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-600">{label}</p><p className="mt-1 text-sm font-semibold text-white">{value}</p></div>;
}

function EmptyState({ sourceView }: { sourceView: SourceView }) {
  return <section className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-white/10 bg-white/[0.025] p-8 text-center"><div><PackageSearch className="mx-auto mb-4 h-10 w-10 text-slate-500" /><h2 className="text-xl font-semibold text-white">Belum ada winning products</h2><p className="mt-2 max-w-md text-sm leading-6 text-slate-400">{sourceView === "DEMO" ? "Demo source belum tersedia dari Product Intelligence." : "Tambahkan manual product atau import CSV di Product Intelligence Center untuk melihat real opportunities."}</p></div></section>;
}
