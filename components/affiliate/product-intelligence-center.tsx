"use client";

import { AlertTriangle, ArrowDownWideNarrow, BarChart3, Check, ChevronRight, ExternalLink, Filter, LoaderCircle, PackageSearch, Plus, RefreshCw, Save, Search, Sparkles, Store, Target, TrendingUp, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CampaignCreationModal, type CampaignProductSeed } from "@/components/affiliate/campaign-creation-modal";
import { DashboardPanel } from "@/components/dashboard/ui";
import { EmptyCard, ErrorCard } from "@/components/state-cards";
import { generateProductCampaignPlan } from "@/lib/affiliate/product-campaign-planner";
import { generateProductContentStrategy } from "@/lib/affiliate/product-content-strategy";
import { calculateAffiliateProductScore, productOpportunityInsight, type OpportunityLabel } from "@/lib/affiliate/product-scoring";
import { allCategoriesLabel, sourceCategoryMap } from "@/lib/affiliate/product-intelligence-catalog";
import { persistOpportunity } from "@/lib/intelligence/affiliate-persistence";
import type { AffiliateProductInsightDto, ProductCampaignPlan, ProductContentFormat, ProductContentStrategy } from "@/lib/intelligence/types";

type MarketplacePlatform = "Shopee" | "TikTok Shop" | "Tokopedia" | "Lazada";
type ProductSourceType = "DEMO" | "MANUAL" | "CSV_IMPORT" | "REAL_API";
type ProductSourceView = "ACTIVE" | "ALL" | ProductSourceType;
type DataStatus = "DEMO" | "MANUAL" | "CSV_IMPORT" | "REAL_API" | "NO DATA";
type CategorySourceStatus = DataStatus | "MIXED" | "EMPTY";
type OpportunityLevel = "All Levels" | OpportunityLabel;
type MarginFilter = "All Margins" | "High Margin" | "Medium Margin" | "Low Margin";
type TrendFilter = "All Trends" | "Rising" | "Stable" | "Monitor";
type SortOption = "Highest Score" | "Highest Demand" | "Lowest Competition" | "Highest Margin" | "Viral Potential";
type CsvImportIssue = { rowNumber: number; productName?: string; errors: string[] };

type ProductView = AffiliateProductInsightDto & {
  affiliateOpportunityScore: number;
  estimatedDemand: "High" | "Medium" | "Low";
  marginPotential: "High" | "Medium" | "Low";
  viralPotential: "High" | "Medium" | "Low";
  trustPotential: "High" | "Medium" | "Low";
  contentDifficulty: "Easy" | "Medium" | "Hard";
  opportunityLevel: Exclude<OpportunityLevel, "All Levels">;
  recommendedAction: string;
  contentRecommendation: ProductContentFormat;
  contentStrategy: ProductContentStrategy;
  campaignPlan: ProductCampaignPlan;
  dataStatus: DataStatus;
  trendStatus: Exclude<TrendFilter, "All Trends">;
};

const platforms: MarketplacePlatform[] = ["Shopee", "TikTok Shop", "Tokopedia", "Lazada"];
const affiliateCategories = ["Beauty & Personal Care", "Mom & Baby", "Home Living", "Kitchen Tools", "Fashion Muslim", "Health Lifestyle", "Digital Accessories", "Food & Snack"];
const sortOptions: SortOption[] = ["Highest Score", "Highest Demand", "Lowest Competition", "Highest Margin", "Viral Potential"];
const sourceViewOptions: ProductSourceView[] = ["ACTIVE", "ALL", "MANUAL", "CSV_IMPORT", "REAL_API", "DEMO"];

const initialManual = { programName: "", websiteUrl: "", dashboardUrl: "", affiliateLink: "", commission: "", price: "", salesVolume: "", trendScore: "", opportunityScore: "", productName: "", category: sourceCategoryMap["Custom Affiliate"][0], notes: "" };

export function ProductIntelligenceCenter() {
  const [products, setProducts] = useState<AffiliateProductInsightDto[]>([]);
  const [sourceConfig, setSourceConfig] = useState<Record<string, { mode: string; configured: boolean }>>({});
  const [activeSourceType, setActiveSourceType] = useState<ProductSourceType>("DEMO");
  const [sourceView, setSourceView] = useState<ProductSourceView>("ACTIVE");
  const [marketplaceStatus, setMarketplaceStatus] = useState("Marketplace API not connected. Showing NOT CONNECTED sample data only.");
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
  const [hideDemoData, setHideDemoData] = useState(false);
  const [confirmClearDemo, setConfirmClearDemo] = useState(false);
  const [csvImportResult, setCsvImportResult] = useState<{ imported: number; invalidRows: CsvImportIssue[] }>();
  const [affiliateUrl, setAffiliateUrl] = useState("");
  const [csv, setCsv] = useState("");
  const [manual, setManual] = useState(initialManual);
  const [campaignSeed, setCampaignSeed] = useState<CampaignProductSeed>();

  const loadProducts = useCallback(async (forceSync = false, view = sourceView) => {
    setLoading(true);
    setError("");
    try {
      const rows = await loadMarketplaceProducts(forceSync, view);
      setProducts(rows.products);
      setSourceConfig(rows.sourceConfig);
      setActiveSourceType(rows.activeSourceType);
      setMarketplaceStatus(rows.marketplaceStatus);
      const savedResponse = await fetch("/api/affiliate/opportunities", { cache: "no-store" });
      const savedPayload = await savedResponse.json();
      if (savedResponse.ok) {
        setSavedKeys(new Set((savedPayload.opportunities ?? []).map((item: { title: string; source: string }) => savedKey(item.title, item.source))));
      }
      return rows;
    } catch (requestError) {
      setProducts([]);
      setError(requestError instanceof Error ? requestError.message : "Product Intelligence gagal dimuat.");
      return undefined;
    } finally {
      setLoading(false);
    }
  }, [sourceView]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const visibleProducts = useMemo(() => hideDemoData ? products.filter((product) => sourceType(product.sourceType) !== "DEMO") : products, [hideDemoData, products]);
  const productViews = useMemo(() => visibleProducts.map(toProductView), [visibleProducts]);
  const filteredProducts = useMemo(() => filterAndSortProducts(productViews, { platform, category, opportunityLevel, competition, marginPotential, trendStatus, sortBy, query }), [category, competition, marginPotential, opportunityLevel, platform, productViews, query, sortBy, trendStatus]);
  const shortlist = useMemo(() => filteredProducts.slice(0, 5), [filteredProducts]);
  const activeDisplaySource = sourceView === "ACTIVE" || sourceView === "ALL" ? activeSourceType : sourceView;
  const categoryRows = useMemo(() => buildCategoryRows(productViews, sourceView === "ACTIVE" ? activeSourceType : sourceView), [activeSourceType, productViews, sourceView]);
  const platformGroups = useMemo(() => platforms.map((item) => ({ platform: item, products: filteredProducts.filter((product) => product.platform === item).slice(0, 4) })), [filteredProducts]);
  const hasDemo = activeDisplaySource === "DEMO" || visibleProducts.some((product) => sourceType(product.sourceType) === "DEMO");
  const canHideDemo = activeSourceType !== "DEMO" || products.some((product) => sourceType(product.sourceType) !== "DEMO");
  const sourceSummary = useMemo(() => buildSourceSummary(visibleProducts, sourceView === "ACTIVE" ? activeSourceType : sourceView), [activeSourceType, sourceView, visibleProducts]);
  const emptyProductMessage = "Belum ada data produk. Tambahkan manual product atau import CSV.";

  async function syncProductData() {
    setSyncing(true);
    setNotice("");
    console.info("[Product Intelligence] Sync Product Data started", { requestedPlatform: platform, activeSourceType, sourceView });
    const rows = await loadProducts(true);
    console.info("[Product Intelligence] Sync Product Data finished", { activeSourceType: rows?.activeSourceType, sourceView, marketplaceStatus: rows?.marketplaceStatus });
    setNotice(rows?.marketplaceStatus ?? "Product Intelligence sync failed.");
    setSyncing(false);
  }

  async function saveOpportunity(product: ProductView) {
    setSaving(`save-${product.id}`);
    const result = await persistOpportunity({ topic: product.productName, type: "affiliate_product", source: product.source, sourceUrl: getProductSourceUrl(product), score: product.affiliateOpportunityScore, confidence: product.confidence, platform: product.platform, reason: opportunityReason(product), notes: product.notes, isDemo: product.isDemo });
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
      setSourceView("MANUAL");
      await loadProducts(false, "MANUAL");
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
      const invalidRows = Array.isArray(payload.invalidRows) ? payload.invalidRows as CsvImportIssue[] : [];
      setCsvImportResult({ imported: payload.products?.length ?? 0, invalidRows });
      setNotice(`${payload.products?.length ?? 0} CSV product rows imported.${invalidRows.length ? ` ${invalidRows.length} row invalid.` : ""}`);
      if (!invalidRows.length) {
        setCsv("");
        setCsvOpen(false);
      }
      setSourceView("CSV_IMPORT");
      await loadProducts(false, "CSV_IMPORT");
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
      setSourceView("MANUAL");
      await loadProducts(false, "MANUAL");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Affiliate program gagal dipindai.");
    } finally {
      setSaving("");
    }
  }

  return (
    <>
      <DashboardPanel title="Active Data Source" description="Status sumber data yang sedang dipakai oleh Product Intelligence Engine.">
        <div className="grid gap-3 lg:grid-cols-[1.2fr_2fr_auto]">
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">Current Active Source</p>
            <div className="mt-3"><DataStatusBadge label={activeSourceType} /></div>
            <p className={`mt-3 text-xs leading-5 ${activeSourceType === "DEMO" ? "text-amber-100" : activeSourceType === "REAL_API" ? "text-emerald-100" : "text-cyan-100"}`}>{sourceStatusMessage(activeSourceType)}</p>
            <div className="mt-4">
              <Label>Dataset View</Label>
              <SourceViewControl value={sourceView} onChange={(value) => { setSourceView(value); setHideDemoData(false); }} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Total Products" value={String(sourceSummary.totalProducts)} detail="Active source rows" />
            <MetricCard label="Source Type" value={sourceViewLabel(sourceSummary.sourceType)} detail={sourceView === "ACTIVE" ? "Selected by priority" : "Selected dataset view"} />
            <MetricCard label="Last Updated" value={sourceSummary.lastUpdatedLabel} detail="Latest collected/synced row" />
            <MetricCard label="Platforms" value={String(sourceSummary.availablePlatforms.length)} detail={sourceSummary.availablePlatforms.join(", ") || "No platform"} />
          </div>
          <div className="flex flex-col gap-2">
            <button type="button" onClick={clearDemoData} disabled={!canHideDemo || hideDemoData} className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-300/20 bg-amber-300/[0.07] px-3 py-2 text-xs font-semibold text-amber-100 disabled:cursor-not-allowed disabled:opacity-40">Clear Demo Data</button>
            <button type="button" onClick={downloadCsvTemplate} className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/[0.07] px-3 py-2 text-xs font-semibold text-cyan-100">Download CSV Template</button>
          </div>
        </div>
      </DashboardPanel>

      <DashboardPanel title="Recommended Product Shortlist" description="Produk terbaik berdasarkan Affiliate Opportunity Score, siap dipakai sebagai starting point campaign affiliate.">
        {notice ? <p className="mb-4 rounded-xl border border-emerald-300/20 bg-emerald-300/[0.06] p-3 text-xs leading-5 text-emerald-100">{notice}</p> : null}
        {hasDemo ? <p className="mb-4 rounded-xl border border-amber-300/20 bg-amber-300/[0.08] p-3 text-xs leading-5 text-amber-100">Marketplace API not connected. Showing NOT CONNECTED sample data only.</p> : null}
        {error ? <div className="mb-4"><ErrorCard compact title="Product Intelligence unavailable" description={error} /></div> : null}
        {loading ? <ShortlistSkeleton /> : shortlist.length ? <Shortlist products={shortlist} saving={saving} savedKeys={savedKeys} onSelect={setSelectedProduct} onSave={saveOpportunity} onCampaign={(product) => setCampaignSeed(productSeed(product))} /> : <EmptyCard title="No products found" description={productViews.length ? "Belum ada produk yang cocok dengan filter. Reset filter atau ganti source view." : emptyProductMessage} />}
      </DashboardPanel>

      <DashboardPanel title="Product Intelligence Engine" description="Filter, sorting, dan scoring awal untuk menilai produk affiliate lintas Shopee, TikTok Shop, Tokopedia, dan Lazada.">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={syncProductData} disabled={syncing} className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/[0.07] px-3 py-2 text-xs font-semibold text-cyan-100 disabled:opacity-60">{syncing ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}Sync Product Data</button>
            <button type="button" onClick={() => setManualOpen((value) => !value)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white"><Plus className="h-3.5 w-3.5" />Add Manual Product</button>
            <button type="button" onClick={() => setCsvOpen((value) => !value)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-semibold text-slate-200"><Plus className="h-3.5 w-3.5" />Import CSV</button>
          </div>
          <div className="flex flex-wrap gap-2"><DataStatusBadge label={activeSourceType} />{platforms.map((item) => <DataStatusBadge key={item} label={sourceConfig[item]?.configured ? "REAL_API" : "DEMO"} />)}</div>
        </div>
        {hasDemo ? <p className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/[0.08] p-3 text-xs leading-5 text-amber-100">Marketplace API not connected. Showing NOT CONNECTED sample data only.</p> : null}

        <Filters sourceView={sourceView} platform={platform} category={category} opportunityLevel={opportunityLevel} competition={competition} marginPotential={marginPotential} trendStatus={trendStatus} sortBy={sortBy} query={query} onSourceView={(value) => { setSourceView(value); setHideDemoData(false); }} onPlatform={setPlatform} onCategory={setCategory} onOpportunityLevel={setOpportunityLevel} onCompetition={setCompetition} onMarginPotential={setMarginPotential} onTrendStatus={setTrendStatus} onSortBy={setSortBy} onQuery={setQuery} onReset={() => { setSourceView("ACTIVE"); setHideDemoData(false); setPlatform("All Platforms"); setCategory(allCategoriesLabel); setOpportunityLevel("All Levels"); setCompetition("All Competition"); setMarginPotential("All Margins"); setTrendStatus("All Trends"); setSortBy("Highest Score"); setQuery(""); }} />
        {manualOpen ? <ManualProductForm manual={manual} saving={saving === "manual"} onChange={setManual} onSave={addManualProduct} /> : null}
        {csvOpen ? <CsvImport csv={csv} saving={saving === "csv"} result={csvImportResult} onChange={setCsv} onImport={importCsv} onDownload={downloadCsvTemplate} /> : null}

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Products" value={String(filteredProducts.length).padStart(2, "0")} detail="Matched active filters" />
          <MetricCard label="Average Score" value={average(filteredProducts.map((item) => item.affiliateOpportunityScore)).toString()} detail="Affiliate opportunity" />
          <MetricCard label="High Opportunity" value={String(filteredProducts.filter((item) => item.opportunityLevel === "HIGH OPPORTUNITY").length)} detail="Ready for content test" />
          <MetricCard label="Source" value={sourceViewLabel(sourceSummary.sourceType)} detail={marketplaceStatus} />
        </div>
      </DashboardPanel>

      <DashboardPanel title="Product Category List" description={activeSourceType === "DEMO" ? "Demo-only category summary. Do not treat as real marketplace validation." : "Category summary from the selected active product source."}>
        <CategoryList rows={categoryRows} />
      </DashboardPanel>

      <DashboardPanel title="Product List Per Platform" description="Produk dikelompokkan per e-commerce agar mudah dipakai untuk riset dan eksekusi campaign.">
        <div className="grid gap-3 lg:grid-cols-2">
          {platformGroups.map((group) => <PlatformProductList key={group.platform} platform={group.platform} products={group.products} onSelect={setSelectedProduct} />)}
        </div>
      </DashboardPanel>

      <DashboardPanel title="Affiliate Program Activation" description="Input data manual, CSV, atau URL scan untuk mengaktifkan workflow sebelum real API marketplace tersedia.">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <input value={affiliateUrl} onChange={(event) => setAffiliateUrl(event.target.value)} placeholder="https://shopee.co.id/nama-produk-affiliate" className="premium-input px-3 py-2.5 text-sm" />
          <button type="button" onClick={scanProgram} disabled={saving === "scan"} className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/[0.07] px-4 py-2.5 text-xs font-semibold text-cyan-100 disabled:opacity-60">{saving === "scan" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}Scan URL</button>
        </div>
      </DashboardPanel>

      <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(undefined)} onCampaign={(product) => setCampaignSeed(productSeed(product))} />
      <ConfirmClearDemoModal open={confirmClearDemo} onCancel={() => setConfirmClearDemo(false)} onConfirm={confirmHideDemoData} />
      <CampaignCreationModal open={Boolean(campaignSeed)} seed={campaignSeed} onClose={() => setCampaignSeed(undefined)} onSaved={(_, savedMessage) => setNotice(`${savedMessage} Lanjutkan ke Generate Affiliate Plan.`)} />
    </>
  );

  function clearDemoData() {
    if (!canHideDemo) {
      setNotice("Demo data cannot be hidden until MANUAL, CSV_IMPORT, or REAL_API data exists.");
      return;
    }
    setConfirmClearDemo(true);
  }

  function confirmHideDemoData() {
    setHideDemoData(true);
    setConfirmClearDemo(false);
    setNotice("Demo data hidden from this view. MANUAL, CSV_IMPORT, and REAL_API products were not changed.");
  }
}

function Shortlist({ products, savedKeys, saving, onSelect, onSave, onCampaign }: { products: ProductView[]; savedKeys: Set<string>; saving: string; onSelect: (product: ProductView) => void; onSave: (product: ProductView) => void; onCampaign: (product: ProductView) => void }) {
  const single = products.length === 1;
  return (
    <div className={single ? "grid gap-3 lg:grid-cols-[minmax(280px,420px)_1fr]" : "grid gap-3 xl:grid-cols-5"}>
      {products.map((product, index) => {
        const saved = savedKeys.has(savedKey(product.productName, product.source));
        return (
          <article key={product.id} className="flex min-h-[270px] flex-col rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
            <div className="flex items-start justify-between gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-300/[0.1] text-xs font-bold text-cyan-100">#{index + 1}</span>
              <div className="flex flex-col items-end gap-1.5"><OpportunityBadge level={product.opportunityLevel} /><DataStatusBadge label={product.dataStatus} /></div>
            </div>
            <h3 className="mt-4 text-sm font-semibold leading-5 text-white">{product.productName}</h3>
            <p className="mt-1 text-xs text-slate-500">{product.platform} / {product.category}</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <MiniMetric label="Demand" value={product.estimatedDemand} />
              <MiniMetric label="Competition" value={product.competitionLevel} />
              <MiniMetric label="Margin" value={product.marginPotential} />
              <MiniMetric label="Trend" value={product.viralPotential} />
              <MiniMetric label="Trust" value={product.trustPotential} />
              <MiniMetric label="Score" value={`${product.affiliateOpportunityScore}/100`} strong />
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-400">{product.recommendedAction}</p>
            <div className="mt-3 rounded-lg border border-cyan-300/10 bg-cyan-300/[0.035] p-3">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">Recommended Content Format</p>
              <p className="mt-1 text-[11px] font-semibold text-cyan-100">{product.contentStrategy.bestContentFormat}</p>
              <p className="mt-2 text-[9px] font-semibold uppercase tracking-wide text-slate-500">Best Angle</p>
              <p className="mt-1 text-[11px] leading-4 text-slate-300">{product.contentStrategy.contentAngle}</p>
            </div>
            <div className="mt-3 rounded-lg border border-white/[0.06] bg-white/[0.025] p-3">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">Campaign Plan</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-200">{product.campaignPlan.campaignDurationDays} days / {product.campaignPlan.recommendedPostingFrequency}</p>
            </div>
            <div className="mt-auto flex flex-wrap gap-2 pt-4">
              <button type="button" onClick={() => onSelect(product)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-2 text-[11px] font-semibold text-slate-200">View Strategy<ChevronRight className="h-3.5 w-3.5" /></button>
              <button type="button" onClick={() => onSave(product)} disabled={saved || saving === `save-${product.id}`} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-cyan-300/20 bg-cyan-300/[0.06] px-2.5 py-2 text-[11px] font-semibold text-cyan-100 disabled:opacity-60">{saved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}{saved ? "Saved" : "Save"}</button>
              <button type="button" onClick={() => onSelect(product)} className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-emerald-300/20 bg-emerald-300/[0.06] px-2.5 py-2 text-[11px] font-semibold text-emerald-100">View Campaign Plan<ChevronRight className="h-3.5 w-3.5" /></button>
              <button type="button" onClick={() => onCampaign(product)} className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-2.5 py-2 text-[11px] font-semibold text-white"><PackageSearch className="h-3.5 w-3.5" />Create Campaign from Product</button>
            </div>
          </article>
        );
      })}
      {single ? <div className="grid min-h-[270px] place-items-center rounded-xl border border-dashed border-white/[0.1] bg-white/[0.02] p-5 text-center"><div><p className="text-sm font-semibold text-white">Butuh pembanding opportunity</p><p className="mt-2 max-w-md text-xs leading-5 text-slate-400">Tambahkan lebih banyak produk manual atau import CSV untuk membandingkan opportunity.</p></div></div> : null}
    </div>
  );
}

function SourceViewControl({ value, onChange }: { value: ProductSourceView; onChange: (value: ProductSourceView) => void }) {
  return <div className="mt-2 flex flex-wrap gap-1.5">{sourceViewOptions.map((option) => <button key={option} type="button" onClick={() => onChange(option)} className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide ${value === option ? "border-cyan-300/30 bg-cyan-300/[0.12] text-cyan-100" : "border-white/10 bg-white/[0.035] text-slate-400"}`}>{sourceViewLabel(option)}</button>)}</div>;
}

function Filters(props: { sourceView: ProductSourceView; platform: string; category: string; opportunityLevel: OpportunityLevel; competition: string; marginPotential: MarginFilter; trendStatus: TrendFilter; sortBy: SortOption; query: string; onSourceView: (value: ProductSourceView) => void; onPlatform: (value: string) => void; onCategory: (value: string) => void; onOpportunityLevel: (value: OpportunityLevel) => void; onCompetition: (value: string) => void; onMarginPotential: (value: MarginFilter) => void; onTrendStatus: (value: TrendFilter) => void; onSortBy: (value: SortOption) => void; onQuery: (value: string) => void; onReset: () => void }) {
  return (
    <div className="mt-5 rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white"><Filter className="h-4 w-4 text-cyan-200" />Filter & Sorting</div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label><Label>Source</Label><select value={props.sourceView} onChange={(event) => props.onSourceView(event.target.value as ProductSourceView)} className="premium-input mt-1.5 px-3 py-2.5 text-sm">{sourceViewOptions.map((option) => <option key={option} value={option}>{sourceViewLabel(option)}</option>)}</select></label>
        <Select label="Platform" value={props.platform} options={["All Platforms", ...platforms]} onChange={props.onPlatform} />
        <Select label="Category" value={props.category} options={[allCategoriesLabel, ...affiliateCategories]} onChange={props.onCategory} />
        <Select label="Opportunity" value={props.opportunityLevel} options={["All Levels", "HIGH OPPORTUNITY", "MEDIUM OPPORTUNITY", "LOW OPPORTUNITY", "MONITOR ONLY"]} onChange={(value) => props.onOpportunityLevel(value as OpportunityLevel)} />
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
        <thead><tr className="text-[10px] uppercase tracking-[0.14em] text-slate-600"><th className="px-3 py-2">Category Name</th><th className="px-3 py-2">Source</th><th className="px-3 py-2">Product Count</th><th className="px-3 py-2">Best Platform</th><th className="px-3 py-2">Average Opportunity Score</th><th className="px-3 py-2">Trend Status</th><th className="px-3 py-2">Recommended Content Type</th></tr></thead>
        <tbody>{rows.map((row) => <tr key={row.category} className="rounded-xl border border-white/[0.07] bg-white/[0.025] text-xs text-slate-300"><td className="rounded-l-xl px-3 py-3 font-semibold text-white">{row.category}</td><td className="px-3 py-3"><CategoryValidityBadge sourceType={row.sourceType} /></td><td className="px-3 py-3">{row.count}</td><td className="px-3 py-3"><Badge>{row.bestPlatform}</Badge></td><td className="px-3 py-3 font-bold text-cyan-100">{row.averageScore}</td><td className="px-3 py-3"><TrendBadge status={row.trendStatus} /></td><td className="rounded-r-xl px-3 py-3">{row.contentType}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

function PlatformProductList({ platform, products, onSelect }: { platform: MarketplacePlatform; products: ProductView[]; onSelect: (product: ProductView) => void }) {
  return (
    <section className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
      <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold text-white">{platform}</h3><DataStatusBadge label={products[0]?.dataStatus ?? "NO DATA"} /></div>
      <div className="mt-3 space-y-2">
        {products.length ? products.map((product) => <button type="button" key={product.id} onClick={() => onSelect(product)} className="w-full rounded-lg border border-white/[0.06] bg-white/[0.025] p-3 text-left transition hover:border-cyan-300/20 hover:bg-cyan-300/[0.035]"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-white">{product.productName}</p><p className="mt-1 text-[11px] text-slate-500">{product.category} / {product.marginPotential} margin</p></div><ScorePill value={product.affiliateOpportunityScore} /></div></button>) : <p className="rounded-lg border border-white/[0.06] p-3 text-xs text-slate-500">No product matched current filter.</p>}
      </div>
    </section>
  );
}

function ProductDetailModal({ product, onClose, onCampaign }: { product?: ProductView; onClose: () => void; onCampaign: (product: ProductView) => void }) {
  if (!product) return null;
  const strategy = product.contentStrategy;
  const plan = product.campaignPlan;
  const sourceUrl = getProductSourceUrl(product);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/75 p-0 backdrop-blur-sm md:items-center md:p-6">
      <section className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-white/[0.08] bg-slate-950 p-5 shadow-2xl md:max-w-4xl md:rounded-2xl">
        <div className="flex items-start justify-between gap-4">
          <div><OpportunityBadge level={product.opportunityLevel} /><h2 className="mt-3 text-xl font-semibold text-white">{product.productName}</h2><p className="mt-1 text-sm text-slate-500">{product.platform} / {product.category} / {product.dataStatus}</p></div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300"><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <MetricCard label="Affiliate Score" value={`${product.affiliateOpportunityScore}/100`} detail="Weighted product score" />
          <MetricCard label="Demand" value={product.estimatedDemand} detail={`${product.salesVolume?.toLocaleString("id-ID") ?? "Demo"} signal`} />
          <MetricCard label="Content" value={strategy.bestContentFormat} detail={strategy.postingDifficulty} />
          <MetricCard label="Campaign" value={`${plan.campaignDurationDays} days`} detail={plan.recommendedPostingFrequency} />
        </div>
        <ScoreBreakdownGrid product={product} />
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          <DetailBlock title="Product Overview" value={product.notes || `${product.productName} untuk niche ${product.category}.`} />
          <DetailBlock title="Why Recommended" value={product.recommendedAction} />
          <DetailBlock title="Recommended Content Format" value={strategy.bestContentFormat} />
          <DetailBlock title="Best Angle" value={strategy.contentAngle} />
          <DetailListBlock title="3 Hook Ideas" items={strategy.hookIdeas} />
          <DetailBlock title="CTA" value={strategy.CTA} />
          <DetailBlock title="Platform Recommendation" value={strategy.platformRecommendation} />
          <DetailBlock title="Posting Difficulty" value={strategy.postingDifficulty} />
          <DetailBlock title="Testing Plan" value={strategy.testingPlan} warning={product.opportunityLevel === "MONITOR ONLY"} />
          <ShortScriptBlock script={strategy.shortScript} />
          <DetailBlock title="Caption" value={strategy.caption} />
          <DetailBlock title="Hashtag Set" value={strategy.hashtagSet.join(" ")} />
        </div>
        <CampaignPlanSection plan={plan} />
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" onClick={() => onCampaign(product)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white"><PackageSearch className="h-4 w-4" />Create Campaign from Product</button>
          {sourceUrl ? <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-xs font-semibold text-slate-300"><ExternalLink className="h-4 w-4" />Open Source</a> : <button type="button" disabled className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-xs font-semibold text-slate-500 opacity-60"><ExternalLink className="h-4 w-4" />Source belum tersedia</button>}
        </div>
      </section>
    </div>
  );
}

function ConfirmClearDemoModal({ open, onCancel, onConfirm }: { open: boolean; onCancel: () => void; onConfirm: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/75 p-0 backdrop-blur-sm md:items-center md:p-6">
      <section className="w-full rounded-t-2xl border border-white/[0.08] bg-slate-950 p-5 shadow-2xl md:max-w-md md:rounded-2xl">
        <h2 className="text-base font-semibold text-white">Clear Demo Data</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">Demo data akan disembunyikan dari view ini. Data MANUAL, CSV_IMPORT, dan REAL_API tidak akan dihapus atau diubah.</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-slate-300">Cancel</button>
          <button type="button" onClick={onConfirm} className="rounded-xl border border-amber-300/20 bg-amber-300/[0.08] px-4 py-2 text-xs font-semibold text-amber-100">Hide Demo Data</button>
        </div>
      </section>
    </div>
  );
}

function ScoreBreakdownGrid({ product }: { product: ProductView }) {
  const score = product.scoreBreakdown ?? calculateAffiliateProductScore(product);
  const rows = [
    ["Demand", score.demandScore],
    ["Margin", score.marginScore],
    ["Competition", score.competitionScore],
    ["Trend", score.trendScore],
    ["Content Ease", score.contentEaseScore],
    ["Trust", score.trustScore],
    ["Final", score.finalOpportunityScore]
  ] as const;
  return <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-7">{rows.map(([label, value]) => <MiniMetric key={label} label={label} value={`${value}/100`} strong={label === "Final"} />)}</div>;
}

function ManualProductForm({ manual, saving, onChange, onSave }: { manual: typeof initialManual; saving: boolean; onChange: (value: typeof initialManual) => void; onSave: () => void }) {
  return <div className="mt-5 grid gap-3 rounded-xl border border-cyan-300/10 bg-cyan-300/[0.035] p-4 md:grid-cols-2 xl:grid-cols-4"><Field label="Program Name" value={manual.programName} onChange={(programName) => onChange({ ...manual, programName })} /><Field label="Website URL" value={manual.websiteUrl} onChange={(websiteUrl) => onChange({ ...manual, websiteUrl })} /><Field label="Dashboard URL" value={manual.dashboardUrl} onChange={(dashboardUrl) => onChange({ ...manual, dashboardUrl })} /><Field label="Affiliate Link" value={manual.affiliateLink} onChange={(affiliateLink) => onChange({ ...manual, affiliateLink })} /><Field label="Commission" value={manual.commission} onChange={(commission) => onChange({ ...manual, commission })} /><Field label="Price" value={manual.price} onChange={(price) => onChange({ ...manual, price })} /><Field label="Sales Volume" value={manual.salesVolume} onChange={(salesVolume) => onChange({ ...manual, salesVolume })} /><Field label="Trend Score" value={manual.trendScore} onChange={(trendScore) => onChange({ ...manual, trendScore })} /><Field label="Opportunity Score" value={manual.opportunityScore} onChange={(opportunityScore) => onChange({ ...manual, opportunityScore })} /><Field label="Product Name" value={manual.productName} onChange={(productName) => onChange({ ...manual, productName })} /><Select label="Category" value={manual.category} options={sourceCategoryMap["Custom Affiliate"]} onChange={(category) => onChange({ ...manual, category })} /><Field label="Notes" value={manual.notes} onChange={(notes) => onChange({ ...manual, notes })} /><button type="button" onClick={onSave} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-60">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Save Product</button></div>;
}

function CsvImport({ csv, saving, result, onChange, onImport, onDownload }: { csv: string; saving: boolean; result?: { imported: number; invalidRows: CsvImportIssue[] }; onChange: (value: string) => void; onImport: () => void; onDownload: () => void }) {
  return <div className="mt-5 rounded-xl border border-cyan-300/10 bg-cyan-300/[0.035] p-4"><div className="flex flex-wrap items-center justify-between gap-2"><Label>CSV Import</Label><button type="button" onClick={onDownload} className="rounded-lg border border-cyan-300/20 px-3 py-1.5 text-[11px] font-semibold text-cyan-100">Download CSV Template</button></div><textarea value={csv} onChange={(event) => onChange(event.target.value)} rows={5} placeholder="productName,platform,category,price,soldCount,rating,reviewCount,commissionRate,marginLevel,productUrl,contentDifficulty,trendLevel,competitionLevel" className="premium-input mt-2 px-3 py-2.5 text-sm" /><button type="button" onClick={onImport} disabled={saving} className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-60">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Import CSV Data</button>{result ? <div className="mt-3 rounded-lg border border-white/[0.07] bg-white/[0.025] p-3 text-xs text-slate-300"><p className="font-semibold text-white">Import result: {result.imported} imported, {result.invalidRows.length} invalid.</p>{result.invalidRows.length ? <div className="mt-2 space-y-1 text-amber-100">{result.invalidRows.map((row) => <p key={row.rowNumber}>Row {row.rowNumber}{row.productName ? ` (${row.productName})` : ""}: {row.errors.join(", ")}</p>)}</div> : null}</div> : null}</div>;
}

async function loadMarketplaceProducts(forceSync: boolean, sourceView: ProductSourceView) {
  if (forceSync) {
    const syncResults = await Promise.all(platforms.map(async (source) => {
      const payload = await fetchJson("/api/affiliate/product-intelligence", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "sync", source, category: allCategoriesLabel }) });
      console.info("[Product Intelligence] Sync Product Data source result", { source, sync: payload.sync, meta: payload.meta });
      return payload;
    }));
    console.info("[Product Intelligence] Sync Product Data summary", { sources: syncResults.map((payload) => payload.meta) });
  }
  const params = new URLSearchParams({ category: allCategoriesLabel, sort: "Opportunity Score", take: "120" });
  if (sourceView !== "ACTIVE") params.set("sourceType", sourceView);
  const payload = await fetchJson(`/api/affiliate/product-intelligence?${params}`);
  return {
    products: dedupeProducts(safeProducts(payload.products)),
    sourceConfig: payload.sourceConfig ?? {},
    activeSourceType: sourceType(payload.activeSourceType),
    marketplaceStatus: typeof payload.marketplaceStatus === "string" ? payload.marketplaceStatus : "Marketplace API not connected. Showing NOT CONNECTED sample data only."
  };
}

async function fetchJson(url: string, init?: RequestInit) {
  const response = await fetch(url, { cache: "no-store", ...init });
  const payload = await response.json();
  if (!response.ok || !payload.success) throw new Error(payload.error?.message ?? "Product data failed to load.");
  return payload;
}

function toProductView(product: AffiliateProductInsightDto): ProductView {
  const score = calculateAffiliateProductScore(product);
  const affiliateOpportunityScore = score.finalOpportunityScore;
  const marginPotential = level(score.marginScore);
  const viralPotential = level(score.trendScore);
  const trustPotential = level(score.trustScore);
  const estimatedDemand = level(score.demandScore);
  const contentDifficulty = score.contentEaseScore >= 76 ? "Easy" : score.contentEaseScore >= 55 ? "Medium" : "Hard";
  const opportunityLevel = score.opportunityLabel;
  const trendStatus = score.trendScore >= 74 ? "Rising" : score.trendScore >= 56 ? "Stable" : "Monitor";
  const contentStrategy = product.contentStrategy ?? generateProductContentStrategy(product, score);
  const campaignPlan = product.campaignPlan ?? generateProductCampaignPlan(product, score, contentStrategy);
  return { ...product, opportunityScore: affiliateOpportunityScore, scoreBreakdown: score, affiliateOpportunityScore, estimatedDemand, marginPotential, viralPotential, trustPotential, contentDifficulty, opportunityLevel, trendStatus, dataStatus: dataStatus(product), recommendedAction: productOpportunityInsight(product, score), contentRecommendation: contentStrategy.bestContentFormat, contentStrategy, campaignPlan };
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

function buildCategoryRows(products: ProductView[], sourceView: ProductSourceView) {
  return affiliateCategories.map((category) => {
    const rows = products.filter((product) => product.category === category);
    const best = [...rows].sort((a, b) => b.affiliateOpportunityScore - a.affiliateOpportunityScore)[0];
    const rowSources = [...new Set(rows.map((product) => product.dataStatus))];
    const sourceType: CategorySourceStatus = sourceView === "ALL" ? rowSources.length > 1 ? "MIXED" : rowSources[0] ?? "EMPTY" : rows.length ? sourceView === "ACTIVE" ? best?.dataStatus ?? "EMPTY" : sourceView : "EMPTY";
    return { category, sourceType, count: rows.length, bestPlatform: best?.platform ?? "-", averageScore: average(rows.map((item) => item.affiliateOpportunityScore)), trendStatus: best?.trendStatus ?? "Monitor", contentType: best?.contentStrategy.bestContentFormat ?? contentTypeForCategory(category) };
  });
}

function buildSourceSummary(products: AffiliateProductInsightDto[], sourceTypeValue: ProductSourceView) {
  const dates = products.map((product) => new Date(product.lastSyncedAt ?? product.collectedAt).getTime()).filter((value) => Number.isFinite(value));
  const latest = dates.length ? new Date(Math.max(...dates)) : undefined;
  return {
    totalProducts: products.length,
    sourceType: sourceTypeValue,
    lastUpdatedLabel: latest ? latest.toLocaleDateString("id-ID", { day: "2-digit", month: "short" }) : "-",
    availablePlatforms: [...new Set(products.map((product) => product.platform))].sort()
  };
}

function sourceStatusMessage(sourceTypeValue: ProductSourceType) {
  if (sourceTypeValue === "DEMO") return "Marketplace API not connected. Showing NOT CONNECTED sample data only. Data ini hanya contoh demo, belum valid untuk keputusan affiliate.";
  if (sourceTypeValue === "REAL_API") return "Data berasal dari integrasi API marketplace.";
  return "Data berasal dari input pengguna dan dapat digunakan untuk analisis internal.";
}

function CampaignPlanSection({ plan }: { plan: ProductCampaignPlan }) {
  return (
    <section className="mt-5 rounded-xl border border-emerald-300/10 bg-emerald-300/[0.025] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">View Campaign Plan</h3>
          <p className="mt-1 text-xs leading-5 text-slate-400">{plan.campaignTheme}</p>
        </div>
        <Badge>{plan.campaignDurationDays} days</Badge>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <DetailBlock title="Campaign Goal" value={plan.campaignGoal} />
        <DetailBlock title="Recommended Posting Frequency" value={plan.recommendedPostingFrequency} />
        <DetailListBlock title="Success Metrics" items={plan.successMetrics} />
        <DetailListBlock title="Risk Notes" items={plan.riskNotes} />
      </div>
      <div className="mt-4 space-y-3">
        {plan.dailyPlan.map((day) => (
          <article key={day.day} className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">Day {day.day}</p>
                <h4 className="mt-1 text-sm font-semibold text-white">{day.stage}</h4>
              </div>
              <Badge>{day.contentFormat}</Badge>
            </div>
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <DetailBlock title="Hook" value={day.hook} />
              <DetailBlock title="Angle" value={day.angle} />
              <DetailBlock title="CTA" value={day.CTA} />
              <DetailBlock title="Caption" value={day.caption} />
              <DetailBlock title="Platform Focus" value={day.platformFocus} />
              <DetailBlock title="Hashtags" value={day.hashtags.join(" ")} />
              <ShortScriptBlock script={day.shortScript} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) { return <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4"><p className="text-[10px] uppercase tracking-[0.14em] text-slate-600">{label}</p><p className="mt-2 text-xl font-bold text-white">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div>; }
function MiniMetric({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) { return <div className="rounded-lg border border-white/[0.06] bg-white/[0.025] p-2"><p className="text-[9px] uppercase tracking-wide text-slate-600">{label}</p><p className={`mt-1 font-semibold ${strong ? "text-cyan-100" : "text-slate-200"}`}>{value}</p></div>; }
function DetailBlock({ title, value, warning = false }: { title: string; value: string; warning?: boolean }) { return <div className={`rounded-xl border p-4 ${warning ? "border-amber-300/20 bg-amber-300/[0.06]" : "border-white/[0.07] bg-white/[0.025]"}`}><h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-200">{value}</p></div>; }
function DetailListBlock({ title, items }: { title: string; items: readonly string[] }) { return <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4"><h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{title}</h3><div className="mt-3 space-y-2">{items.map((item, index) => <p key={item} className="text-sm leading-6 text-slate-200"><span className="mr-2 text-cyan-100">{index + 1}.</span>{item}</p>)}</div></div>; }
function ShortScriptBlock({ script }: { script: ProductContentStrategy["shortScript"] }) {
  const rows = [["Opening Hook", script.openingHook], ["Problem", script.problem], ["Product Solution", script.productSolution], ["Proof / Benefit", script.proofOrBenefit], ["CTA", script.CTA]] as const;
  return <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4"><h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Short Script</h3><div className="mt-3 space-y-2">{rows.map(([label, value]) => <div key={label}><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-600">{label}</p><p className="mt-1 text-sm leading-6 text-slate-200">{value}</p></div>)}</div></div>;
}
function Select({ label, value, options, icon, onChange }: { label: string; value: string; options: readonly string[]; icon?: React.ReactNode; onChange: (value: string) => void }) { return <label className="relative"><Label>{label}</Label>{icon ? <span className="pointer-events-none absolute left-3 top-[calc(50%+10px)] -translate-y-1/2 text-slate-600">{icon}</span> : null}<select value={value} onChange={(event) => onChange(event.target.value)} className={`premium-input mt-1.5 py-2.5 text-sm ${icon ? "px-10" : "px-3"}`}>{options.map((option) => <option key={option}>{option}</option>)}</select></label>; }
function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label><Label>{label}</Label><input value={value} onChange={(event) => onChange(event.target.value)} className="premium-input mt-1.5 px-3 py-2.5 text-sm" /></label>; }
function Label({ children }: { children: React.ReactNode }) { return <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">{children}</span>; }
function Badge({ children }: { children: React.ReactNode }) { return <span className="w-fit rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-cyan-100">{children}</span>; }
function DataStatusBadge({ label }: { label: DataStatus }) { const tone = label === "NO DATA" ? "border-slate-300/10 bg-white/[0.035] text-slate-400" : label === "DEMO" ? "border-amber-300/20 bg-amber-300/[0.08] text-amber-100" : label === "MANUAL" ? "border-cyan-300/20 bg-cyan-300/[0.08] text-cyan-100" : label === "CSV_IMPORT" ? "border-blue-300/20 bg-blue-300/[0.08] text-blue-100" : "border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-100"; return <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${tone}`}>{sourceLabel(label)}</span>; }
function CategoryValidityBadge({ sourceType }: { sourceType: CategorySourceStatus }) {
  const demoOnly = sourceType === "DEMO" || sourceType === "EMPTY";
  const label = sourceType === "EMPTY" ? "NO DATA" : sourceType === "DEMO" ? "NOT CONNECTED - sample data" : sourceType === "MIXED" ? "MIXED SOURCES" : `VALID FROM ${sourceType}`;
  return <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${demoOnly ? "border-amber-300/20 bg-amber-300/[0.08] text-amber-100" : "border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-100"}`}>{label}</span>;
}
function OpportunityBadge({ level }: { level: ProductView["opportunityLevel"] }) { const tone = level === "HIGH OPPORTUNITY" ? "border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-100" : level === "MEDIUM OPPORTUNITY" ? "border-cyan-300/20 bg-cyan-300/[0.08] text-cyan-100" : level === "MONITOR ONLY" ? "border-rose-300/20 bg-rose-300/[0.08] text-rose-100" : "border-amber-300/20 bg-amber-300/[0.08] text-amber-100"; return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${tone}`}>{level}</span>; }
function TrendBadge({ status }: { status: ProductView["trendStatus"] }) { const icon = status === "Rising" ? <TrendingUp className="h-3.5 w-3.5" /> : status === "Stable" ? <Target className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />; return <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-200">{icon}{status}</span>; }
function ScorePill({ value }: { value: number }) { return <span className="rounded-full bg-cyan-300/[0.12] px-2.5 py-1 text-xs font-bold text-cyan-100">{value}</span>; }
function ShortlistSkeleton() { return <div className="grid gap-3 xl:grid-cols-5">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="min-h-[270px] animate-pulse rounded-xl border border-white/[0.07] bg-white/[0.035]" />)}</div>; }

function safeProducts(value: unknown): AffiliateProductInsightDto[] { return Array.isArray(value) ? value.filter((item): item is AffiliateProductInsightDto => Boolean(item && typeof item === "object" && "id" in item && "productName" in item)) : []; }
function dedupeProducts(products: AffiliateProductInsightDto[]) { return Array.from(new Map(products.map((product) => [`${product.platform}|${product.productName}`.toLowerCase(), product])).values()); }
function dataStatus(product: AffiliateProductInsightDto): DataStatus { return sourceType(product.sourceType); }
function sourceType(value: unknown): ProductSourceType { return value === "MANUAL" || value === "CSV_IMPORT" || value === "REAL_API" ? value : "DEMO"; }
function sourceLabel(value: DataStatus) { return value === "DEMO" ? "NOT CONNECTED - sample data" : value === "REAL_API" ? "REAL API" : value === "CSV_IMPORT" ? "CSV IMPORT" : value; }
function getProductSourceUrl(product: Pick<AffiliateProductInsightDto, "affiliateUrl" | "sourceUrl" | "productUrl"> & { url?: string | null }) {
  return [product.affiliateUrl, product.sourceUrl, product.productUrl, product.url].find(isSafeExternalProductUrl);
}
function isSafeExternalProductUrl(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) return false;
  try {
    const url = new URL(value.trim());
    const host = url.hostname.toLowerCase();
    const blockedDemoHost = ["example", "com"].join(".");
    return ["https:", "http:"].includes(url.protocol) && host !== blockedDemoHost && !host.endsWith(`.${blockedDemoHost}`);
  } catch {
    return false;
  }
}
function sourceViewLabel(value: ProductSourceView) {
  if (value === "ACTIVE") return "Active Source";
  if (value === "ALL") return "All Sources";
  if (value === "DEMO") return "Demo";
  return sourceLabel(value);
}
function downloadCsvTemplate() {
  const rows = [
    ["productName", "platform", "category", "price", "soldCount", "rating", "reviewCount", "commissionRate", "marginLevel", "productUrl", "contentDifficulty", "trendLevel", "competitionLevel"],
    ["Portable Blender Pro", "Shopee", "Kitchen Tools", "149000", "920", "4.8", "181", "12", "Medium", "https://shopee.co.id/search?keyword=portable%20blender%20pro", "Easy", "High", "Medium"]
  ];
  const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll("\"", "\"\"")}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "product-intelligence-template.csv";
  link.click();
  URL.revokeObjectURL(url);
}
function level(value: number): "High" | "Medium" | "Low" { return value >= 72 ? "High" : value >= 52 ? "Medium" : "Low"; }
function sortValue(product: ProductView, sortBy: SortOption) { const score = product.scoreBreakdown ?? calculateAffiliateProductScore(product); if (sortBy === "Highest Demand") return score.demandScore; if (sortBy === "Lowest Competition") return score.competitionScore; if (sortBy === "Highest Margin") return score.marginScore; if (sortBy === "Viral Potential") return score.trendScore; return score.finalOpportunityScore; }
function average(values: number[]) { const valid = values.filter((value) => Number.isFinite(value)); return valid.length ? Math.round(valid.reduce((total, value) => total + value, 0) / valid.length) : 0; }
function contentTypeForCategory(category: string): ProductContentFormat { const value = category.toLowerCase(); if (/fashion muslim|muslim/.test(value)) return "Islamic soft selling"; if (/beauty/.test(value)) return "Beauty transformation"; if (/mom|baby/.test(value)) return "Mom solution"; if (/home|kitchen/.test(value)) return "Home improvement"; if (/digital|education|course|ai/.test(value)) return "Educational soft selling"; if (/food|snack/.test(value)) return "UGC style"; return "Review natural"; }
function opportunityReason(product: ProductView) { return `Final Opportunity Score ${product.affiliateOpportunityScore}/100: demand ${product.estimatedDemand}, margin ${product.marginPotential}, trend ${product.viralPotential}, trust ${product.trustPotential}, competition ${product.competitionLevel}. ${product.recommendedAction}`; }
function productSeed(product: ProductView): CampaignProductSeed { return { ...product, productId: product.id, finalOpportunityScore: product.affiliateOpportunityScore, dataMode: product.dataMode, missingProductFields: product.missingFields, contentStrategy: product.contentStrategy, campaignPlan: product.campaignPlan }; }
function savedKey(title: string, source: string) { return `${title}|${source}`.toLowerCase(); }
