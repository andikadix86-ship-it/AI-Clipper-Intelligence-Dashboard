"use client";

import { AlertTriangle, ArrowDownWideNarrow, BarChart3, Check, ChevronRight, ExternalLink, Filter, LoaderCircle, PackageSearch, Plus, RefreshCw, Save, Search, Sparkles, Store, Target, TrendingUp, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CampaignCreationModal, type CampaignProductSeed } from "@/components/affiliate/campaign-creation-modal";
import { DashboardPanel } from "@/components/dashboard/ui";
import { EmptyCard, ErrorCard } from "@/components/state-cards";
import { calculateAffiliateProductScore } from "@/lib/affiliate/product-scoring";
import { allCategoriesLabel, sourceCategoryMap } from "@/lib/affiliate/product-intelligence-catalog";
import { persistOpportunity } from "@/lib/intelligence/affiliate-persistence";
import type { AffiliateProductInsightDto } from "@/lib/intelligence/types";

type MarketplacePlatform = "Shopee" | "TikTok Shop" | "Tokopedia" | "Lazada";
type DataStatus = "Demo Data" | "Manual Data" | "API Ready";
type OpportunityLevel = "All Levels" | "High Opportunity" | "Medium Opportunity" | "Low Opportunity" | "Risky Product";
type MarginFilter = "All Margins" | "High Margin" | "Medium Margin" | "Low Margin";
type TrendFilter = "All Trends" | "Rising" | "Stable" | "Monitor";
type SortOption = "Highest Score" | "Highest Demand" | "Lowest Competition" | "Highest Margin" | "Viral Potential";

type ProductView = AffiliateProductInsightDto & {
  affiliateOpportunityScore: number;
  estimatedDemand: "High" | "Medium" | "Low";
  marginPotential: "High" | "Medium" | "Low";
  viralPotential: "High" | "Medium" | "Low";
  contentDifficulty: "Easy" | "Medium" | "Hard";
  opportunityLevel: Exclude<OpportunityLevel, "All Levels">;
  recommendedAction: string;
  dataStatus: DataStatus;
  trendStatus: Exclude<TrendFilter, "All Trends">;
};

const platforms: MarketplacePlatform[] = ["Shopee", "TikTok Shop", "Tokopedia", "Lazada"];
const affiliateCategories = ["Beauty & Personal Care", "Mom & Baby", "Home Living", "Kitchen Tools", "Fashion Muslim", "Health Lifestyle", "Digital Accessories", "Food & Snack"];
const sortOptions: SortOption[] = ["Highest Score", "Highest Demand", "Lowest Competition", "Highest Margin", "Viral Potential"];

const initialManual = { programName: "", websiteUrl: "", dashboardUrl: "", affiliateLink: "", commission: "", price: "", salesVolume: "", trendScore: "", opportunityScore: "", productName: "", category: sourceCategoryMap["Custom Affiliate"][0], notes: "" };

export function ProductIntelligenceCenter() {
  const [products, setProducts] = useState<AffiliateProductInsightDto[]>([]);
  const [sourceConfig, setSourceConfig] = useState<Record<string, { mode: string; configured: boolean }>>({});
  const [platform, setPlatform] = useState<string>("All Platforms");
  const [category, setCategory] = useState<string>(allCategoriesLabel);
  const [opportunityLevel, setOpportunityLevel] = useState<OpportunityLevel>("All Levels");
  const [competition, setCompetition] = useState<string>("All Competition");
  const [marginPotential, setMarginPotential] = useState<MarginFilter>("All Margins");
  const [trendStatus, setTrendStatus] = useState<TrendFilter>("All Trends");
  const [sortBy, setSortBy] = useState<SortOption>("Highest Score");
  const [query, setQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<ProductView>();
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [manualOpen, setManualOpen] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);
  const [affiliateUrl, setAffiliateUrl] = useState("");
  const [csv, setCsv] = useState("");
  const [manual, setManual] = useState(initialManual);
  const [campaignSeed, setCampaignSeed] = useState<CampaignProductSeed>();

  const loadProducts = useCallback(async (forceSync = false) => {
    setLoading(true);
    setError("");
    try {
      const rows = await loadMarketplaceProducts(forceSync);
      setProducts(rows.products);
      setSourceConfig(rows.sourceConfig);
      const savedResponse = await fetch("/api/affiliate/opportunities", { cache: "no-store" });
      const savedPayload = await savedResponse.json();
      if (savedResponse.ok) {
        setSavedKeys(new Set((savedPayload.opportunities ?? []).map((item: { title: string; source: string }) => savedKey(item.title, item.source))));
      }
    } catch (requestError) {
      setProducts([]);
      setError(requestError instanceof Error ? requestError.message : "Product Intelligence gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const productViews = useMemo(() => products.map(toProductView), [products]);
  const filteredProducts = useMemo(() => filterAndSortProducts(productViews, { platform, category, opportunityLevel, competition, marginPotential, trendStatus, sortBy, query }), [category, competition, marginPotential, opportunityLevel, platform, productViews, query, sortBy, trendStatus]);
  const shortlist = useMemo(() => filteredProducts.slice(0, 5), [filteredProducts]);
  const categoryRows = useMemo(() => buildCategoryRows(productViews), [productViews]);
  const platformGroups = useMemo(() => platforms.map((item) => ({ platform: item, products: filteredProducts.filter((product) => product.platform === item).slice(0, 4) })), [filteredProducts]);
  const hasDemo = productViews.some((product) => product.dataStatus === "Demo Data");

  async function syncProductData() {
    setSyncing(true);
    setNotice("");
    await loadProducts(true);
    setNotice("Product Intelligence synced. Demo/manual structure is ready for API replacement.");
    setSyncing(false);
  }

  async function saveOpportunity(product: ProductView) {
    setSaving(`save-${product.id}`);
    const result = await persistOpportunity({ topic: product.productName, type: "affiliate_product", source: product.source, sourceUrl: product.sourceUrl, score: product.affiliateOpportunityScore, confidence: product.confidence, platform: product.platform, reason: opportunityReason(product), notes: product.notes, isDemo: product.isDemo });
    setNotice(result.message);
    setSavedKeys((current) => new Set([...current, savedKey(product.productName, product.source)]));
    setSaving("");
  }

  async function addManualProduct() {
    if (!manual.programName.trim() || !manual.websiteUrl.trim() || !manual.dashboardUrl.trim() || !manual.affiliateLink.trim() || !manual.productName.trim()) {
      setError("Program name, website URL, dashboard URL, affiliate link, dan product/service wajib diisi.");
      return;
    }
    setSaving("manual");
    setError("");
    try {
      const response = await fetch("/api/affiliate/product-intelligence", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "manual", ...manual }) });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error?.message ?? "Custom affiliate product gagal disimpan.");
      setNotice(`${payload.product.productName} ditambahkan ke Product Intelligence Center.`);
      setManual(initialManual);
      setManualOpen(false);
      await loadProducts();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Custom affiliate product gagal disimpan.");
    } finally {
      setSaving("");
    }
  }

  async function importCsv() {
    if (!csv.trim()) return setError("Paste CSV rows before importing.");
    setSaving("csv");
    setError("");
    try {
      const response = await fetch("/api/affiliate/product-intelligence", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ csv }) });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error?.message ?? "CSV import gagal.");
      setNotice(`${payload.products?.length ?? 0} manual product rows imported.`);
      setCsv("");
      setCsvOpen(false);
      await loadProducts();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "CSV import gagal.");
    } finally {
      setSaving("");
    }
  }

  async function scanProgram() {
    if (!affiliateUrl.trim()) return setError("Masukkan affiliate program URL terlebih dahulu.");
    setSaving("scan");
    setError("");
    try {
      const response = await fetch("/api/affiliate/product-intelligence", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ affiliateProgramUrl: affiliateUrl.trim() }) });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error?.message ?? "Affiliate program gagal dipindai.");
      setNotice(`${payload.product.productName} tersimpan dengan opportunity score ${payload.product.opportunityScore ?? "review needed"}.`);
      setAffiliateUrl("");
      await loadProducts();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Affiliate program gagal dipindai.");
    } finally {
      setSaving("");
    }
  }

  return (
    <>
      <DashboardPanel title="Recommended Product Shortlist" description="Produk terbaik berdasarkan Affiliate Opportunity Score, siap dipakai sebagai starting point campaign affiliate.">
        {notice ? <p className="mb-4 rounded-xl border border-emerald-300/20 bg-emerald-300/[0.06] p-3 text-xs leading-5 text-emerald-100">{notice}</p> : null}
        {hasDemo ? <p className="mb-4 rounded-xl border border-amber-300/20 bg-amber-300/[0.08] p-3 text-xs leading-5 text-amber-100">Demo Data aktif. Struktur sudah siap untuk Manual Data dan API Ready saat integrasi marketplace tersedia.</p> : null}
        {error ? <div className="mb-4"><ErrorCard compact title="Product Intelligence unavailable" description={error} /></div> : null}
        {loading ? <ShortlistSkeleton /> : shortlist.length ? <Shortlist products={shortlist} saving={saving} savedKeys={savedKeys} onSelect={setSelectedProduct} onSave={saveOpportunity} onCampaign={(product) => setCampaignSeed(productSeed(product))} /> : <EmptyCard title="No products found" description="Belum ada produk yang cocok dengan filter. Reset filter, sync demo data, atau import manual product." />}
      </DashboardPanel>

      <DashboardPanel title="Product Intelligence Engine" description="Filter, sorting, dan scoring awal untuk menilai produk affiliate lintas Shopee, TikTok Shop, Tokopedia, dan Lazada.">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={syncProductData} disabled={syncing} className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/[0.07] px-3 py-2 text-xs font-semibold text-cyan-100 disabled:opacity-60">{syncing ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}Sync Product Data</button>
            <button type="button" onClick={() => setManualOpen((value) => !value)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white"><Plus className="h-3.5 w-3.5" />Add Manual Product</button>
            <button type="button" onClick={() => setCsvOpen((value) => !value)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-semibold text-slate-200"><Plus className="h-3.5 w-3.5" />Import CSV</button>
          </div>
          <div className="flex flex-wrap gap-2">{platforms.map((item) => <DataStatusBadge key={item} label={sourceConfig[item]?.configured ? "API Ready" : "Demo Data"} />)}</div>
        </div>

        <Filters platform={platform} category={category} opportunityLevel={opportunityLevel} competition={competition} marginPotential={marginPotential} trendStatus={trendStatus} sortBy={sortBy} query={query} onPlatform={setPlatform} onCategory={setCategory} onOpportunityLevel={setOpportunityLevel} onCompetition={setCompetition} onMarginPotential={setMarginPotential} onTrendStatus={setTrendStatus} onSortBy={setSortBy} onQuery={setQuery} onReset={() => { setPlatform("All Platforms"); setCategory(allCategoriesLabel); setOpportunityLevel("All Levels"); setCompetition("All Competition"); setMarginPotential("All Margins"); setTrendStatus("All Trends"); setSortBy("Highest Score"); setQuery(""); }} />
        {manualOpen ? <ManualProductForm manual={manual} saving={saving === "manual"} onChange={setManual} onSave={addManualProduct} /> : null}
        {csvOpen ? <CsvImport csv={csv} saving={saving === "csv"} onChange={setCsv} onImport={importCsv} /> : null}

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Products" value={String(filteredProducts.length).padStart(2, "0")} detail="Matched active filters" />
          <MetricCard label="Average Score" value={average(filteredProducts.map((item) => item.affiliateOpportunityScore)).toString()} detail="Affiliate opportunity" />
          <MetricCard label="High Opportunity" value={String(filteredProducts.filter((item) => item.opportunityLevel === "High Opportunity").length)} detail="Ready for content test" />
          <MetricCard label="API Status" value="Ready" detail="Demo, manual, API structure" />
        </div>
      </DashboardPanel>

      <DashboardPanel title="Product Category List" description="List kategori produk ringkas untuk memilih niche affiliate yang paling mudah dieksekusi.">
        <CategoryList rows={categoryRows} />
      </DashboardPanel>

      <DashboardPanel title="Product List Per Platform" description="Produk dikelompokkan per e-commerce agar mudah dipakai untuk riset dan eksekusi campaign.">
        <div className="grid gap-3 lg:grid-cols-2">
          {platformGroups.map((group) => <PlatformProductList key={group.platform} platform={group.platform} products={group.products} onSelect={setSelectedProduct} />)}
        </div>
      </DashboardPanel>

      <DashboardPanel title="Affiliate Program Activation" description="Input data manual, CSV, atau URL scan untuk mengaktifkan workflow sebelum real API marketplace tersedia.">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <input value={affiliateUrl} onChange={(event) => setAffiliateUrl(event.target.value)} placeholder="https://example.com/affiliate-program" className="premium-input px-3 py-2.5 text-sm" />
          <button type="button" onClick={scanProgram} disabled={saving === "scan"} className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/[0.07] px-4 py-2.5 text-xs font-semibold text-cyan-100 disabled:opacity-60">{saving === "scan" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}Scan URL</button>
        </div>
      </DashboardPanel>

      <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(undefined)} onCampaign={(product) => setCampaignSeed(productSeed(product))} />
      <CampaignCreationModal open={Boolean(campaignSeed)} seed={campaignSeed} onClose={() => setCampaignSeed(undefined)} onSaved={(_, savedMessage) => setNotice(`${savedMessage} Lanjutkan ke Generate Affiliate Plan.`)} />
    </>
  );
}

function Shortlist({ products, savedKeys, saving, onSelect, onSave, onCampaign }: { products: ProductView[]; savedKeys: Set<string>; saving: string; onSelect: (product: ProductView) => void; onSave: (product: ProductView) => void; onCampaign: (product: ProductView) => void }) {
  return (
    <div className="grid gap-3 xl:grid-cols-5">
      {products.map((product, index) => {
        const saved = savedKeys.has(savedKey(product.productName, product.source));
        return (
          <article key={product.id} className="flex min-h-[270px] flex-col rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
            <div className="flex items-start justify-between gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-300/[0.1] text-xs font-bold text-cyan-100">#{index + 1}</span>
              <OpportunityBadge level={product.opportunityLevel} />
            </div>
            <h3 className="mt-4 text-sm font-semibold leading-5 text-white">{product.productName}</h3>
            <p className="mt-1 text-xs text-slate-500">{product.platform} / {product.category}</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <MiniMetric label="Demand" value={product.estimatedDemand} />
              <MiniMetric label="Competition" value={product.competitionLevel} />
              <MiniMetric label="Margin" value={product.marginPotential} />
              <MiniMetric label="Viral" value={product.viralPotential} />
              <MiniMetric label="Content" value={product.contentDifficulty} />
              <MiniMetric label="Score" value={`${product.affiliateOpportunityScore}/100`} strong />
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-400">{product.recommendedAction}</p>
            <div className="mt-auto flex flex-wrap gap-2 pt-4">
              <button type="button" onClick={() => onSelect(product)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-2 text-[11px] font-semibold text-slate-200">Detail<ChevronRight className="h-3.5 w-3.5" /></button>
              <button type="button" onClick={() => onSave(product)} disabled={saved || saving === `save-${product.id}`} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-cyan-300/20 bg-cyan-300/[0.06] px-2.5 py-2 text-[11px] font-semibold text-cyan-100 disabled:opacity-60">{saved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}{saved ? "Saved" : "Save"}</button>
              <button type="button" onClick={() => onCampaign(product)} className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-2.5 py-2 text-[11px] font-semibold text-white"><PackageSearch className="h-3.5 w-3.5" />Create Campaign</button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function Filters(props: { platform: string; category: string; opportunityLevel: OpportunityLevel; competition: string; marginPotential: MarginFilter; trendStatus: TrendFilter; sortBy: SortOption; query: string; onPlatform: (value: string) => void; onCategory: (value: string) => void; onOpportunityLevel: (value: OpportunityLevel) => void; onCompetition: (value: string) => void; onMarginPotential: (value: MarginFilter) => void; onTrendStatus: (value: TrendFilter) => void; onSortBy: (value: SortOption) => void; onQuery: (value: string) => void; onReset: () => void }) {
  return (
    <div className="mt-5 rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white"><Filter className="h-4 w-4 text-cyan-200" />Filter & Sorting</div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Select label="Platform" value={props.platform} options={["All Platforms", ...platforms]} onChange={props.onPlatform} />
        <Select label="Category" value={props.category} options={[allCategoriesLabel, ...affiliateCategories]} onChange={props.onCategory} />
        <Select label="Opportunity" value={props.opportunityLevel} options={["All Levels", "High Opportunity", "Medium Opportunity", "Low Opportunity", "Risky Product"]} onChange={(value) => props.onOpportunityLevel(value as OpportunityLevel)} />
        <Select label="Competition" value={props.competition} options={["All Competition", "Low", "Medium", "High"]} onChange={props.onCompetition} />
        <Select label="Margin" value={props.marginPotential} options={["All Margins", "High Margin", "Medium Margin", "Low Margin"]} onChange={(value) => props.onMarginPotential(value as MarginFilter)} />
        <Select label="Trend" value={props.trendStatus} options={["All Trends", "Rising", "Stable", "Monitor"]} onChange={(value) => props.onTrendStatus(value as TrendFilter)} />
        <Select label="Sorting" value={props.sortBy} options={sortOptions} onChange={(value) => props.onSortBy(value as SortOption)} icon={<ArrowDownWideNarrow className="h-4 w-4" />} />
        <label className="relative"><Search className="pointer-events-none absolute left-3 top-[calc(50%+10px)] h-4 w-4 -translate-y-1/2 text-slate-600" /><Label>Search</Label><input value={props.query} onChange={(event) => props.onQuery(event.target.value)} placeholder="Product or niche..." className="premium-input mt-1.5 px-10 py-2.5 text-sm" /></label>
      </div>
      <button type="button" onClick={props.onReset} className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-300">Reset Filter</button>
    </div>
  );
}

function CategoryList({ rows }: { rows: ReturnType<typeof buildCategoryRows> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] border-separate border-spacing-y-2 text-left">
        <thead><tr className="text-[10px] uppercase tracking-[0.14em] text-slate-600"><th className="px-3 py-2">Category Name</th><th className="px-3 py-2">Product Count</th><th className="px-3 py-2">Best Platform</th><th className="px-3 py-2">Average Opportunity Score</th><th className="px-3 py-2">Trend Status</th><th className="px-3 py-2">Recommended Content Type</th></tr></thead>
        <tbody>{rows.map((row) => <tr key={row.category} className="rounded-xl border border-white/[0.07] bg-white/[0.025] text-xs text-slate-300"><td className="rounded-l-xl px-3 py-3 font-semibold text-white">{row.category}</td><td className="px-3 py-3">{row.count}</td><td className="px-3 py-3"><Badge>{row.bestPlatform}</Badge></td><td className="px-3 py-3 font-bold text-cyan-100">{row.averageScore}</td><td className="px-3 py-3"><TrendBadge status={row.trendStatus} /></td><td className="rounded-r-xl px-3 py-3">{row.contentType}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

function PlatformProductList({ platform, products, onSelect }: { platform: MarketplacePlatform; products: ProductView[]; onSelect: (product: ProductView) => void }) {
  return (
    <section className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
      <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold text-white">{platform}</h3><DataStatusBadge label={products.some((item) => item.dataStatus === "API Ready") ? "API Ready" : "Demo Data"} /></div>
      <div className="mt-3 space-y-2">
        {products.length ? products.map((product) => <button type="button" key={product.id} onClick={() => onSelect(product)} className="w-full rounded-lg border border-white/[0.06] bg-white/[0.025] p-3 text-left transition hover:border-cyan-300/20 hover:bg-cyan-300/[0.035]"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-white">{product.productName}</p><p className="mt-1 text-[11px] text-slate-500">{product.category} / {product.marginPotential} margin</p></div><ScorePill value={product.affiliateOpportunityScore} /></div></button>) : <p className="rounded-lg border border-white/[0.06] p-3 text-xs text-slate-500">No product matched current filter.</p>}
      </div>
    </section>
  );
}

function ProductDetailModal({ product, onClose, onCampaign }: { product?: ProductView; onClose: () => void; onCampaign: (product: ProductView) => void }) {
  if (!product) return null;
  const content = affiliateContent(product);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/75 p-0 backdrop-blur-sm md:items-center md:p-6">
      <section className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-white/[0.08] bg-slate-950 p-5 shadow-2xl md:max-w-4xl md:rounded-2xl">
        <div className="flex items-start justify-between gap-4">
          <div><OpportunityBadge level={product.opportunityLevel} /><h2 className="mt-3 text-xl font-semibold text-white">{product.productName}</h2><p className="mt-1 text-sm text-slate-500">{product.platform} / {product.category} / {product.dataStatus}</p></div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300"><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <MetricCard label="Affiliate Score" value={`${product.affiliateOpportunityScore}/100`} detail="Weighted product score" />
          <MetricCard label="Demand" value={product.estimatedDemand} detail={`${product.salesVolume?.toLocaleString("id-ID") ?? "Demo"} signal`} />
          <MetricCard label="Content Difficulty" value={product.contentDifficulty} detail={product.trendStatus} />
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          <DetailBlock title="Product Overview" value={product.notes || `${product.productName} untuk niche ${product.category}.`} />
          <DetailBlock title="Why Recommended" value={content.whyRecommended} />
          <DetailBlock title="Target Audience" value={content.targetAudience} />
          <DetailBlock title="Suggested Hook" value={content.hook} />
          <DetailBlock title="Suggested Content Angle" value={content.angle} />
          <DetailBlock title="CTA Recommendation" value={content.cta} />
          <DetailBlock title="Risk Notes" value={content.riskNotes} warning />
          <DetailBlock title="Suggested Posting Platform" value={content.postingPlatform} />
          <DetailBlock title="Suggested Content Format" value={content.format} />
          <DetailBlock title="Caption Idea" value={content.caption} />
          <DetailBlock title="Hashtag" value={content.hashtag} />
          <DetailBlock title="Suggested Video Style" value={content.style} />
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" onClick={() => onCampaign(product)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white"><PackageSearch className="h-4 w-4" />Create Campaign</button>
          {product.sourceUrl ? <a href={product.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-xs font-semibold text-slate-300"><ExternalLink className="h-4 w-4" />Open Source</a> : null}
        </div>
      </section>
    </div>
  );
}

function ManualProductForm({ manual, saving, onChange, onSave }: { manual: typeof initialManual; saving: boolean; onChange: (value: typeof initialManual) => void; onSave: () => void }) {
  return <div className="mt-5 grid gap-3 rounded-xl border border-cyan-300/10 bg-cyan-300/[0.035] p-4 md:grid-cols-2 xl:grid-cols-4"><Field label="Program Name" value={manual.programName} onChange={(programName) => onChange({ ...manual, programName })} /><Field label="Website URL" value={manual.websiteUrl} onChange={(websiteUrl) => onChange({ ...manual, websiteUrl })} /><Field label="Dashboard URL" value={manual.dashboardUrl} onChange={(dashboardUrl) => onChange({ ...manual, dashboardUrl })} /><Field label="Affiliate Link" value={manual.affiliateLink} onChange={(affiliateLink) => onChange({ ...manual, affiliateLink })} /><Field label="Commission" value={manual.commission} onChange={(commission) => onChange({ ...manual, commission })} /><Field label="Price" value={manual.price} onChange={(price) => onChange({ ...manual, price })} /><Field label="Sales Volume" value={manual.salesVolume} onChange={(salesVolume) => onChange({ ...manual, salesVolume })} /><Field label="Trend Score" value={manual.trendScore} onChange={(trendScore) => onChange({ ...manual, trendScore })} /><Field label="Opportunity Score" value={manual.opportunityScore} onChange={(opportunityScore) => onChange({ ...manual, opportunityScore })} /><Field label="Product Name" value={manual.productName} onChange={(productName) => onChange({ ...manual, productName })} /><Select label="Category" value={manual.category} options={sourceCategoryMap["Custom Affiliate"]} onChange={(category) => onChange({ ...manual, category })} /><Field label="Notes" value={manual.notes} onChange={(notes) => onChange({ ...manual, notes })} /><button type="button" onClick={onSave} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-60">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Save Product</button></div>;
}

function CsvImport({ csv, saving, onChange, onImport }: { csv: string; saving: boolean; onChange: (value: string) => void; onImport: () => void }) {
  return <div className="mt-5 rounded-xl border border-cyan-300/10 bg-cyan-300/[0.035] p-4"><Label>CSV Import</Label><textarea value={csv} onChange={(event) => onChange(event.target.value)} rows={5} placeholder="product_name,platform,category,price,commission,sales_volume,trend_score,opportunity_score,source,affiliate_link,website_url" className="premium-input mt-2 px-3 py-2.5 text-sm" /><button type="button" onClick={onImport} disabled={saving} className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-60">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Import Manual Data</button></div>;
}

async function loadMarketplaceProducts(forceSync: boolean) {
  const rows: AffiliateProductInsightDto[] = [];
  let sourceConfig: Record<string, { mode: string; configured: boolean }> = {};
  for (const source of [...platforms, "Custom Affiliate"]) {
    const params = new URLSearchParams({ source, category: allCategoriesLabel, sort: "Opportunity Score", take: "30" });
    let payload = await fetchJson(`/api/affiliate/product-intelligence?${params}`);
    if ((forceSync || !payload.products?.length) && source !== "Custom Affiliate") {
      payload = await fetchJson("/api/affiliate/product-intelligence", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "sync", source, category: allCategoriesLabel }) });
    }
    rows.push(...safeProducts(payload.products));
    sourceConfig = { ...sourceConfig, ...(payload.sourceConfig ?? {}) };
  }
  return { products: dedupeProducts(rows), sourceConfig };
}

async function fetchJson(url: string, init?: RequestInit) {
  const response = await fetch(url, { cache: "no-store", ...init });
  const payload = await response.json();
  if (!response.ok || !payload.success) throw new Error(payload.error?.message ?? "Product data failed to load.");
  return payload;
}

function toProductView(product: AffiliateProductInsightDto): ProductView {
  const score = calculateAffiliateProductScore(product);
  const affiliateOpportunityScore = product.opportunityScore ?? score.opportunity;
  const marginPotential = level(score.marginPotential);
  const viralPotential = level(score.viralPotential);
  const estimatedDemand = level(score.demand);
  const contentDifficulty = score.contentEase >= 76 ? "Easy" : score.contentEase >= 55 ? "Medium" : "Hard";
  const opportunityLevel = product.competitionLevel === "High" && affiliateOpportunityScore < 65 ? "Risky Product" : affiliateOpportunityScore >= 78 ? "High Opportunity" : affiliateOpportunityScore >= 62 ? "Medium Opportunity" : "Low Opportunity";
  const trendStatus = score.viralPotential >= 74 ? "Rising" : score.viralPotential >= 56 ? "Stable" : "Monitor";
  return { ...product, affiliateOpportunityScore, estimatedDemand, marginPotential, viralPotential, contentDifficulty, opportunityLevel, trendStatus, dataStatus: dataStatus(product), recommendedAction: recommendedAction(opportunityLevel, product.competitionLevel) };
}

function filterAndSortProducts(products: ProductView[], filter: { platform: string; category: string; opportunityLevel: OpportunityLevel; competition: string; marginPotential: MarginFilter; trendStatus: TrendFilter; sortBy: SortOption; query: string }) {
  const term = filter.query.trim().toLowerCase();
  return products
    .filter((product) => filter.platform === "All Platforms" || product.platform === filter.platform)
    .filter((product) => filter.category === allCategoriesLabel || product.category === filter.category)
    .filter((product) => filter.opportunityLevel === "All Levels" || product.opportunityLevel === filter.opportunityLevel)
    .filter((product) => filter.competition === "All Competition" || product.competitionLevel === filter.competition)
    .filter((product) => filter.marginPotential === "All Margins" || `${product.marginPotential} Margin` === filter.marginPotential)
    .filter((product) => filter.trendStatus === "All Trends" || product.trendStatus === filter.trendStatus)
    .filter((product) => !term || `${product.productName} ${product.category} ${product.platform}`.toLowerCase().includes(term))
    .sort((a, b) => sortValue(b, filter.sortBy) - sortValue(a, filter.sortBy));
}

function buildCategoryRows(products: ProductView[]) {
  return affiliateCategories.map((category) => {
    const rows = products.filter((product) => product.category === category);
    const best = [...rows].sort((a, b) => b.affiliateOpportunityScore - a.affiliateOpportunityScore)[0];
    return { category, count: rows.length, bestPlatform: best?.platform ?? "-", averageScore: average(rows.map((item) => item.affiliateOpportunityScore)), trendStatus: best?.trendStatus ?? "Monitor", contentType: contentTypeForCategory(category) };
  });
}

function affiliateContent(product: ProductView) {
  const category = product.category.toLowerCase();
  const style = /mom|baby/.test(category) ? "Mom daily life style" : /fashion muslim/.test(category) ? "Islamic soft selling" : product.contentDifficulty === "Easy" ? "UGC style" : product.viralPotential === "High" ? "Before after" : "Problem solution";
  return {
    whyRecommended: `${product.estimatedDemand} demand, ${product.marginPotential} margin, ${product.viralPotential} viral potential, dan score ${product.affiliateOpportunityScore}/100.`,
    targetAudience: targetAudience(product.category),
    hook: `Aku test ${product.productName}, ternyata ini yang bikin ${product.category} lebih praktis.`,
    angle: contentTypeForCategory(product.category),
    caption: `${product.productName} cocok buat yang butuh solusi praktis di kategori ${product.category}. Simpan dulu sebelum checkout.`,
    cta: product.opportunityLevel === "High Opportunity" ? "Cek link produk dan bandingkan promo hari ini." : "Simpan dulu, cek review, lalu putuskan saat promo aktif.",
    hashtag: `#affiliateindonesia #${slug(product.category)} #${slug(product.platform)} #reviewproduk`,
    riskNotes: product.opportunityLevel === "Risky Product" ? "Competition tinggi atau sinyal score belum kuat. Validasi review, policy, dan klaim produk sebelum dipublish." : "Tetap validasi stok, komisi, klaim produk, dan kebijakan platform sebelum upload.",
    postingPlatform: product.platform === "TikTok Shop" ? "TikTok Shop + TikTok short video" : "TikTok, Instagram Reels, dan marketplace video review",
    format: product.contentDifficulty === "Easy" ? "30-45 detik review natural dengan demo penggunaan" : "45-60 detik problem-solution dengan bukti visual",
    style
  };
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) { return <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4"><p className="text-[10px] uppercase tracking-[0.14em] text-slate-600">{label}</p><p className="mt-2 text-xl font-bold text-white">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div>; }
function MiniMetric({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) { return <div className="rounded-lg border border-white/[0.06] bg-white/[0.025] p-2"><p className="text-[9px] uppercase tracking-wide text-slate-600">{label}</p><p className={`mt-1 font-semibold ${strong ? "text-cyan-100" : "text-slate-200"}`}>{value}</p></div>; }
function DetailBlock({ title, value, warning = false }: { title: string; value: string; warning?: boolean }) { return <div className={`rounded-xl border p-4 ${warning ? "border-amber-300/20 bg-amber-300/[0.06]" : "border-white/[0.07] bg-white/[0.025]"}`}><h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-200">{value}</p></div>; }
function Select({ label, value, options, icon, onChange }: { label: string; value: string; options: readonly string[]; icon?: React.ReactNode; onChange: (value: string) => void }) { return <label className="relative"><Label>{label}</Label>{icon ? <span className="pointer-events-none absolute left-3 top-[calc(50%+10px)] -translate-y-1/2 text-slate-600">{icon}</span> : null}<select value={value} onChange={(event) => onChange(event.target.value)} className={`premium-input mt-1.5 py-2.5 text-sm ${icon ? "px-10" : "px-3"}`}>{options.map((option) => <option key={option}>{option}</option>)}</select></label>; }
function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label><Label>{label}</Label><input value={value} onChange={(event) => onChange(event.target.value)} className="premium-input mt-1.5 px-3 py-2.5 text-sm" /></label>; }
function Label({ children }: { children: React.ReactNode }) { return <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">{children}</span>; }
function Badge({ children }: { children: React.ReactNode }) { return <span className="w-fit rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-cyan-100">{children}</span>; }
function DataStatusBadge({ label }: { label: DataStatus }) { const tone = label === "Demo Data" ? "border-amber-300/20 bg-amber-300/[0.08] text-amber-100" : label === "Manual Data" ? "border-cyan-300/20 bg-cyan-300/[0.08] text-cyan-100" : "border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-100"; return <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${tone}`}>{label}</span>; }
function OpportunityBadge({ level }: { level: ProductView["opportunityLevel"] }) { const tone = level === "High Opportunity" ? "border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-100" : level === "Medium Opportunity" ? "border-cyan-300/20 bg-cyan-300/[0.08] text-cyan-100" : level === "Risky Product" ? "border-rose-300/20 bg-rose-300/[0.08] text-rose-100" : "border-amber-300/20 bg-amber-300/[0.08] text-amber-100"; return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${tone}`}>{level}</span>; }
function TrendBadge({ status }: { status: ProductView["trendStatus"] }) { const icon = status === "Rising" ? <TrendingUp className="h-3.5 w-3.5" /> : status === "Stable" ? <Target className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />; return <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-200">{icon}{status}</span>; }
function ScorePill({ value }: { value: number }) { return <span className="rounded-full bg-cyan-300/[0.12] px-2.5 py-1 text-xs font-bold text-cyan-100">{value}</span>; }
function ShortlistSkeleton() { return <div className="grid gap-3 xl:grid-cols-5">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="min-h-[270px] animate-pulse rounded-xl border border-white/[0.07] bg-white/[0.035]" />)}</div>; }

function safeProducts(value: unknown): AffiliateProductInsightDto[] { return Array.isArray(value) ? value.filter((item): item is AffiliateProductInsightDto => Boolean(item && typeof item === "object" && "id" in item && "productName" in item)) : []; }
function dedupeProducts(products: AffiliateProductInsightDto[]) { return Array.from(new Map(products.map((product) => [`${product.platform}|${product.productName}`.toLowerCase(), product])).values()); }
function dataStatus(product: AffiliateProductInsightDto): DataStatus { if (product.dataMode === "MANUAL REAL DATA" || product.sourceType === "REAL_USER_INPUT") return "Manual Data"; if (product.dataMode === "REAL DATA" || product.sourceType === "REAL") return "API Ready"; return "Demo Data"; }
function level(value: number): "High" | "Medium" | "Low" { return value >= 72 ? "High" : value >= 52 ? "Medium" : "Low"; }
function recommendedAction(levelValue: ProductView["opportunityLevel"], competitionLevel: ProductView["competitionLevel"]) { if (levelValue === "High Opportunity") return "Prioritaskan untuk review natural dan campaign cepat."; if (levelValue === "Medium Opportunity") return competitionLevel === "Low" ? "Test konten ringan, lanjutkan jika CTR bagus." : "Validasi angle dan promo sebelum scale."; if (levelValue === "Risky Product") return "Monitor dulu, cek klaim produk dan kompetitor."; return "Simpan sebagai backup niche, jangan jadikan prioritas."; }
function sortValue(product: ProductView, sortBy: SortOption) { const score = calculateAffiliateProductScore(product); if (sortBy === "Highest Demand") return score.demand; if (sortBy === "Lowest Competition") return 100 - score.competition; if (sortBy === "Highest Margin") return score.marginPotential; if (sortBy === "Viral Potential") return score.viralPotential; return product.affiliateOpportunityScore; }
function average(values: number[]) { const valid = values.filter((value) => Number.isFinite(value)); return valid.length ? Math.round(valid.reduce((total, value) => total + value, 0) / valid.length) : 0; }
function contentTypeForCategory(category: string) { const value = category.toLowerCase(); if (/beauty/.test(value)) return "Before after, review natural"; if (/mom|baby/.test(value)) return "Mom daily life style"; if (/home|kitchen/.test(value)) return "Problem solution demo"; if (/fashion muslim/.test(value)) return "Islamic soft selling"; if (/food|snack/.test(value)) return "Taste test, UGC style"; return "Review natural, story selling"; }
function targetAudience(category: string) { const value = category.toLowerCase(); if (/mom|baby/.test(value)) return "Ibu muda, keluarga muda, dan pembeli kebutuhan anak."; if (/fashion muslim/.test(value)) return "Muslimah aktif yang mencari produk rapi, nyaman, dan sopan."; if (/health/.test(value)) return "Audience yang ingin rutinitas hidup lebih sehat dan praktis."; if (/digital/.test(value)) return "Creator, pekerja mobile, dan pengguna gadget harian."; return "Pembeli pemula yang mencari produk praktis dengan value jelas."; }
function opportunityReason(product: ProductView) { return `Affiliate Opportunity Score ${product.affiliateOpportunityScore}/100: demand ${product.estimatedDemand}, margin ${product.marginPotential}, viral ${product.viralPotential}, competition ${product.competitionLevel}, content difficulty ${product.contentDifficulty}.`; }
function productSeed(product: ProductView): CampaignProductSeed { return { ...product, productId: product.id, dataMode: product.dataMode, missingProductFields: product.missingFields }; }
function savedKey(title: string, source: string) { return `${title}|${source}`.toLowerCase(); }
function slug(value: string) { return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "").slice(0, 32); }
