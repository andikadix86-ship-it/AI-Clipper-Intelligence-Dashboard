"use client";

import { CalendarDays, Check, ExternalLink, LoaderCircle, PackageSearch, Plus, RefreshCw, Save, Search, Sparkles, Store } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CampaignCreationModal, type CampaignProductSeed } from "@/components/affiliate/campaign-creation-modal";
import { DashboardPanel } from "@/components/dashboard/ui";
import { EmptyCard, ErrorCard } from "@/components/state-cards";
import { affiliateSources, allCategoriesLabel, getCategoryOptionsForSource, sourceCategoryMap } from "@/lib/affiliate/product-intelligence-catalog";
import { persistOpportunity } from "@/lib/intelligence/affiliate-persistence";
import type { AffiliateProductInsightDto, ProductOpportunityScore } from "@/lib/intelligence/types";

const dateFilters = [
  { label: "All Time", days: 0 },
  { label: "Last 7D", days: 7 },
  { label: "Last 30D", days: 30 },
  { label: "Last 90D", days: 90 }
];
const sortOptions = ["Opportunity Score", "Revenue / GMV", "Sales", "Commission", "Trend Growth"] as const;
type SourceConfig = Record<string, { mode: string; configured: boolean }>;

export function ProductIntelligenceCenter() {
  const [products, setProducts] = useState<AffiliateProductInsightDto[]>([]);
  const [source, setSource] = useState("TikTok Shop");
  const [category, setCategory] = useState<string>(allCategoriesLabel);
  const [query, setQuery] = useState("");
  const [dateRange, setDateRange] = useState(dateFilters[0].label);
  const [sortBy, setSortBy] = useState<(typeof sortOptions)[number]>("Opportunity Score");
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());
  const [sourceConfig, setSourceConfig] = useState<SourceConfig>({});
  const [affiliateUrl, setAffiliateUrl] = useState("");
  const [manualOpen, setManualOpen] = useState(false);
  const [manual, setManual] = useState({ programName: "", websiteUrl: "", dashboardUrl: "", affiliateLink: "", commission: "", price: "", productName: "", category: sourceCategoryMap["Custom Affiliate"][0], notes: "" });
  const [campaignSeed, setCampaignSeed] = useState<CampaignProductSeed>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ category, source, dateRange, sort: sortBy, take: "10" });
      const response = await fetch(`/api/affiliate/product-intelligence?${params}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error?.message ?? "Product Intelligence gagal dimuat.");
      setProducts(Array.isArray(payload.products) ? payload.products : []);
      setSourceConfig(payload.sourceConfig ?? {});
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
  }, [category, dateRange, sortBy, source]);

  useEffect(() => { load(); }, [load]);

  const categoryOptions = useMemo(() => getCategoryOptionsForSource(source), [source]);

  const rankedProducts = useMemo(() => {
    const term = query.trim().toLowerCase();
    const selectedDate = dateFilters.find((item) => item.label === dateRange);
    const minDate = selectedDate?.days ? Date.now() - selectedDate.days * 24 * 60 * 60 * 1000 : 0;
    return products
      .filter((product) => !term || `${product.productName} ${product.category} ${product.platform}`.toLowerCase().includes(term))
      .filter((product) => !minDate || new Date(product.collectedAt).getTime() >= minDate)
      .sort((a, b) => sortValue(b, sortBy) - sortValue(a, sortBy))
      .slice(0, 10);
  }, [dateRange, products, query, sortBy]);

  async function syncProductData() {
    setSyncing(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/affiliate/product-intelligence", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "sync", source, category }) });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error?.message ?? "Sync Product Data gagal.");
      setNotice(payload.sync?.message ?? "Product data synced.");
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Sync Product Data gagal.");
    } finally {
      setSyncing(false);
    }
  }

  async function scanProgram() {
    if (!affiliateUrl.trim()) {
      setError("Masukkan affiliate program URL terlebih dahulu.");
      return;
    }
    setScanning(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/affiliate/product-intelligence", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ affiliateProgramUrl: affiliateUrl.trim() }) });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error?.message ?? "Affiliate program gagal dipindai.");
      setNotice(`${payload.product.productName} tersimpan ke Supabase dengan opportunity score ${payload.product.opportunityScore}/100.`);
      setAffiliateUrl("");
      setCategory(payload.product.category);
      setSource(payload.product.platform);
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Affiliate program gagal dipindai.");
    } finally {
      setScanning(false);
    }
  }

  async function addManualProduct() {
    if (!manual.programName.trim() || !manual.websiteUrl.trim() || !manual.dashboardUrl.trim() || !manual.affiliateLink.trim() || !manual.productName.trim()) {
      setError("Program name, website URL, dashboard URL, affiliate link, dan product/service wajib diisi.");
      return;
    }
    setSaving("manual");
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/affiliate/product-intelligence", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "manual", ...manual }) });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error?.message ?? "Custom affiliate product gagal disimpan.");
      setNotice(`${payload.product.productName} ditambahkan ke Product Intelligence Center.`);
      setManual({ programName: "", websiteUrl: "", dashboardUrl: "", affiliateLink: "", commission: "", price: "", productName: "", category: sourceCategoryMap["Custom Affiliate"][0], notes: "" });
      setManualOpen(false);
      setSource("Custom Affiliate");
      setCategory(payload.product.category);
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Custom affiliate product gagal disimpan.");
    } finally {
      setSaving("");
    }
  }

  async function saveOpportunity(product: AffiliateProductInsightDto) {
    setSaving(`save-${product.id}`);
    const result = await persistOpportunity({ topic: product.productName, type: "affiliate_product", source: product.source, sourceUrl: product.sourceUrl, score: product.opportunityScore ?? product.trendScore, confidence: product.confidence, platform: product.platform, reason: opportunityReason(product), notes: product.notes, isDemo: product.isDemo });
    setNotice(result.message);
    setSavedKeys((current) => new Set([...current, savedKey(product.productName, product.source)]));
    setSaving("");
  }

  return (
    <>
      <DashboardPanel title="Product Intelligence Center" description="Ranking produk affiliate lintas marketplace dan custom program. Pilih produk dulu, lalu buat campaign, plan, content, dan publishing.">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">Source-aware product categories</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Kategori mengikuti source yang dipilih dan bisa diganti API categories nanti.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={syncProductData} disabled={syncing} className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/[0.07] px-3 py-2 text-xs font-semibold text-cyan-100 disabled:opacity-60">{syncing ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}Sync Product Data</button>
            <button type="button" onClick={() => setManualOpen((value) => !value)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white"><Plus className="h-3.5 w-3.5" />Add Custom Affiliate Product</button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Select label="Source Selector" value={source} options={[...affiliateSources]} onChange={(nextSource) => { setSource(nextSource); setCategory(allCategoriesLabel); }} />
          <Select label="Category Selector" value={category} options={categoryOptions} onChange={setCategory} />
          <Select label="Sort Selector" value={sortBy} options={[...sortOptions]} onChange={(value) => setSortBy(value as (typeof sortOptions)[number])} />
          <Select label="Date Range Selector" value={dateRange} options={dateFilters.map((item) => item.label)} icon={<CalendarDays className="h-4 w-4" />} onChange={setDateRange} />
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_190px]">
          <label className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search product, category, source..." className="premium-input px-10 py-2.5 text-sm" /></label>
          <button type="button" onClick={() => { setQuery(""); setDateRange("All Time"); }} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs font-semibold text-slate-300">Reset Filter</button>
        </div>

        {manualOpen ? <div className="mt-5 grid gap-3 rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.035] p-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Program Name" value={manual.programName} onChange={(programName) => setManual({ ...manual, programName })} />
          <Field label="Website URL" value={manual.websiteUrl} onChange={(websiteUrl) => setManual({ ...manual, websiteUrl })} />
          <Field label="Dashboard URL" value={manual.dashboardUrl} onChange={(dashboardUrl) => setManual({ ...manual, dashboardUrl })} />
          <Field label="Affiliate Link" value={manual.affiliateLink} onChange={(affiliateLink) => setManual({ ...manual, affiliateLink })} />
          <Field label="Commission" value={manual.commission} onChange={(commission) => setManual({ ...manual, commission })} />
          <Field label="Price" value={manual.price} onChange={(price) => setManual({ ...manual, price })} />
          <Field label="Product / Service Name" value={manual.productName} onChange={(productName) => setManual({ ...manual, productName })} />
          <label><Label>Category</Label><select value={manual.category} onChange={(event) => setManual({ ...manual, category: event.target.value })} className="premium-input mt-1.5 px-3 py-2.5 text-sm">{sourceCategoryMap["Custom Affiliate"].map((item) => <option key={item}>{item}</option>)}</select></label>
          <Field label="Notes" value={manual.notes} onChange={(notes) => setManual({ ...manual, notes })} />
          <button type="button" onClick={addManualProduct} disabled={saving === "manual"} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-60">{saving === "manual" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Save Custom Product</button>
        </div> : null}

        <div className="mt-5 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h3 className="text-sm font-semibold text-white">{source} - {category} - Top 10 Products</h3><p className="mt-1 text-xs text-slate-500">Ranked by opportunity score, content potential, commission, trend, and demand signals.</p></div>
            <div className="flex flex-wrap gap-2"><Metric label="Products" value={rankedProducts.length.toString().padStart(2, "0")} /><Metric label="Source" value={source} /><Metric label="Mode" value={sourceConfig[source]?.mode ?? "DEMO"} /><Metric label="Configured" value={sourceConfig[source]?.configured ? "true" : "false"} /></div>
          </div>
          {notice ? <p className="mt-4 rounded-xl border border-emerald-300/20 bg-emerald-300/[0.06] p-3 text-xs leading-5 text-emerald-100">{notice}</p> : null}
          {error ? <div className="mt-4"><ErrorCard compact title="Product Intelligence unavailable" description={error} /></div> : null}
          {loading ? <div className="mt-5 flex min-h-44 items-center justify-center gap-2 rounded-xl border border-white/[0.07] text-sm text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin" />Loading Supabase product ranking...</div> : rankedProducts.length ? <ProductRankingTable products={rankedProducts} savedKeys={savedKeys} saving={saving} onSave={saveOpportunity} onCampaign={setCampaignSeed} onGenerateContent={(product) => { setNotice("Generate Content membutuhkan campaign. Buat campaign dari produk ini terlebih dahulu."); setCampaignSeed(product); }} /> : <div className="mt-5"><EmptyCard title="No products found" description="Tidak ada produk yang cocok dengan source, category, search, atau date filter ini." /></div>}
        </div>

        <div className="mt-5 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white"><Store className="h-4 w-4 text-violet-200" />Affiliate Program URL Scan</div>
          <p className="mt-2 text-xs leading-5 text-slate-500">Mode scan masih MVP. Jika hasil scan belum presisi, gunakan Add Custom Affiliate Product untuk input manual.</p>
          <div className="mt-3 flex flex-col gap-2 md:flex-row"><input value={affiliateUrl} onChange={(event) => setAffiliateUrl(event.target.value)} placeholder="https://slendro-ai.com/dasbor-mitra" className="premium-input px-3 py-2.5 text-sm" /><button type="button" onClick={scanProgram} disabled={scanning} className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/[0.07] px-4 py-2.5 text-xs font-semibold text-cyan-100 disabled:opacity-60">{scanning ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}Scan URL</button></div>
        </div>
      </DashboardPanel>
      <CampaignCreationModal open={Boolean(campaignSeed)} seed={campaignSeed} onClose={() => setCampaignSeed(undefined)} onSaved={(_, savedMessage) => setNotice(`${savedMessage} Lanjutkan ke Generate Affiliate Plan.`)} />
    </>
  );
}

function ProductRankingTable({ products, savedKeys, saving, onSave, onCampaign, onGenerateContent }: { products: AffiliateProductInsightDto[]; savedKeys: Set<string>; saving: string; onSave: (product: AffiliateProductInsightDto) => void; onCampaign: (product: AffiliateProductInsightDto) => void; onGenerateContent: (product: AffiliateProductInsightDto) => void }) {
  return (
    <div className="mt-5 overflow-x-auto">
      <table className="min-w-[1260px] w-full border-separate border-spacing-y-2 text-left">
        <thead>
          <tr className="text-[10px] uppercase tracking-[0.14em] text-slate-600">
            <th className="px-3 py-2">Rank</th>
            <th className="px-3 py-2">Product</th>
            <th className="px-3 py-2">Source</th>
            <th className="px-3 py-2">Data</th>
            <th className="px-3 py-2">Category</th>
            <th className="px-3 py-2">Revenue / GMV</th>
            <th className="px-3 py-2">Sales</th>
            <th className="px-3 py-2">Average Price</th>
            <th className="px-3 py-2">Commission</th>
            <th className="px-3 py-2">Trend Growth</th>
            <th className="px-3 py-2">Content Score</th>
            <th className="px-3 py-2">Opportunity</th>
            <th className="px-3 py-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product, index) => {
            const metrics = productMetrics(product, index);
            const score = product.scoreBreakdown ?? fallbackScore(product);
            const saved = savedKeys.has(savedKey(product.productName, product.source));
            return (
              <tr key={product.id} className="rounded-xl border border-white/[0.07] bg-white/[0.025] text-xs text-slate-300">
                <td className="rounded-l-xl px-3 py-3 text-sm font-bold text-cyan-100">#{index + 1}</td>
                <td className="px-3 py-3"><p className="font-semibold text-white">{product.productName}</p><p className="mt-1 line-clamp-1 max-w-64 text-[11px] text-slate-600">{product.notes}</p></td>
                <td className="px-3 py-3"><Badge>{product.platform}</Badge></td>
                <td className="px-3 py-3"><div className="flex flex-col gap-1"><SourceTypeBadge product={product} />{product.isEstimated ? <Badge tone="amber">ESTIMATED</Badge> : null}</div></td>
                <td className="px-3 py-3"><Badge muted>{product.category}</Badge></td>
                <td className="px-3 py-3 font-semibold text-emerald-100">{metrics.gmv}</td>
                <td className="px-3 py-3">{metrics.sales}</td>
                <td className="px-3 py-3">{metrics.avgPrice}</td>
                <td className="px-3 py-3"><Badge>{product.commissionEstimate || `${score.commission}%`}</Badge></td>
                <td className="px-3 py-3 text-cyan-100">+{metrics.growth}%</td>
                <td className="px-3 py-3"><ScorePill value={product.contentPotentialScore} /></td>
                <td className="px-3 py-3"><ScorePill value={product.opportunityScore ?? score.opportunity} strong /></td>
                <td className="rounded-r-xl px-3 py-3">
                  <div className="flex min-w-72 flex-wrap gap-2">
                    <button type="button" onClick={() => onSave(product)} disabled={saved || saving === `save-${product.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-2 text-[11px] font-semibold text-slate-200 disabled:opacity-60">{saving === `save-${product.id}` ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : saved ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Save className="h-3.5 w-3.5" />}{saved ? "Saved" : "Save Opportunity"}</button>
                    <button type="button" onClick={() => onCampaign(product)} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-2.5 py-2 text-[11px] font-semibold text-white"><PackageSearch className="h-3.5 w-3.5" />Create Campaign</button>
                    <button type="button" onClick={() => onGenerateContent(product)} className="inline-flex items-center gap-1.5 rounded-lg border border-violet-300/20 bg-violet-300/[0.06] px-2.5 py-2 text-[11px] font-semibold text-violet-100"><Sparkles className="h-3.5 w-3.5" />Generate Content</button>
                    {product.sourceUrl ? <a href={product.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-2 text-[11px] font-semibold text-slate-400"><ExternalLink className="h-3.5 w-3.5" />Source</a> : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Select({ label, value, options, icon, onChange }: { label: string; value: string; options: string[]; icon?: React.ReactNode; onChange: (value: string) => void }) { return <label className="relative"><Label>{label}</Label>{icon ? <span className="pointer-events-none absolute left-3 top-[calc(50%+10px)] -translate-y-1/2 text-slate-600">{icon}</span> : null}<select value={value} onChange={(event) => onChange(event.target.value)} className={`premium-input mt-1.5 py-2.5 text-sm ${icon ? "px-10" : "px-3"}`}>{options.map((option) => <option key={option}>{option}</option>)}</select></label>; }
function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label><Label>{label}</Label><input value={value} onChange={(event) => onChange(event.target.value)} className="premium-input mt-1.5 px-3 py-2.5 text-sm" /></label>; }
function Label({ children }: { children: React.ReactNode }) { return <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">{children}</span>; }
function Badge({ children, muted = false, tone = "cyan" }: { children: React.ReactNode; muted?: boolean; tone?: "cyan" | "amber" | "emerald" | "slate" }) {
  const tones = { cyan: "border-cyan-300/15 bg-cyan-300/[0.06] text-cyan-100", amber: "border-amber-300/20 bg-amber-300/[0.08] text-amber-100", emerald: "border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-100", slate: "border-white/[0.08] bg-white/[0.035] text-slate-400" };
  return <span className={`w-fit rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${muted ? tones.slate : tones[tone]}`}>{children}</span>;
}
function SourceTypeBadge({ product }: { product: AffiliateProductInsightDto }) {
  const value = product.sourceType ?? (product.isDemo ? "DEMO" : "CACHE");
  const label = value === "REAL_USER_INPUT" ? "REAL USER INPUT" : value;
  const tone = value === "REAL" || value === "REAL_USER_INPUT" ? "emerald" : value === "CACHE" ? "cyan" : "amber";
  return <Badge tone={tone}>{label}</Badge>;
}
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2"><p className="text-[9px] uppercase tracking-wide text-slate-600">{label}</p><p className="mt-1 text-xs font-bold text-slate-200">{value}</p></div>; }
function ScorePill({ value, strong = false }: { value: number; strong?: boolean }) { return <span className={`inline-flex min-w-14 justify-center rounded-full px-2.5 py-1 text-xs font-bold ${strong ? "bg-cyan-300/[0.12] text-cyan-100" : "bg-white/[0.06] text-slate-200"}`}>{value}</span>; }
function fallbackScore(product: AffiliateProductInsightDto): ProductOpportunityScore { return { demand: product.trendScore, competition: product.competitionLevel === "High" ? 82 : product.competitionLevel === "Medium" ? 58 : 34, commission: Number(product.commissionEstimate.match(/\d+/)?.[0] ?? 0), contentPotential: product.contentPotentialScore, trend: product.trendScore, opportunity: Math.round((product.trendScore + product.contentPotentialScore) / 2) }; }
function productMetrics(product: AffiliateProductInsightDto, index: number) { const score = product.scoreBreakdown ?? fallbackScore(product); const avg = product.price ?? averagePrice(product.priceRange, index); const sales = product.salesVolume ?? 180 + score.demand * 9 + index * 27; const gmv = product.revenue ?? avg * sales; const growth = Math.max(4, Math.round(score.trend * 0.62 - score.competition * 0.14)); return { avgPrice: avg > 0 ? rupiah(avg) : "Estimated", sales: sales.toLocaleString("id-ID"), gmv: gmv > 0 ? rupiah(gmv) : "Estimated", growth }; }
function sortValue(product: AffiliateProductInsightDto, sort: (typeof sortOptions)[number]) { const score = product.scoreBreakdown ?? fallbackScore(product); const metrics = productMetricsRaw(product, 0); if (sort === "Revenue / GMV") return metrics.gmv; if (sort === "Sales") return metrics.sales; if (sort === "Commission") return score.commission; if (sort === "Trend Growth") return metrics.growth; return product.opportunityScore ?? score.opportunity; }
function productMetricsRaw(product: AffiliateProductInsightDto, index: number) { const score = product.scoreBreakdown ?? fallbackScore(product); const avg = product.price ?? averagePrice(product.priceRange, index); const sales = product.salesVolume ?? 180 + score.demand * 9 + index * 27; const gmv = product.revenue ?? avg * sales; const growth = Math.max(4, Math.round(score.trend * 0.62 - score.competition * 0.14)); return { avg, sales, gmv, growth }; }
function averagePrice(priceRange: string, index: number) { const values = [...priceRange.matchAll(/\d[\d.]*/g)].map((match) => Number(match[0].replace(/\./g, ""))).filter(Boolean); if (values.length >= 2) return Math.round((values[0] + values[1]) / 2); if (values.length === 1) return values[0]; return 99000 + index * 24000; }
function rupiah(value: number) { return `Rp${Math.round(value).toLocaleString("id-ID")}`; }
function savedKey(title: string, source: string) { return `${title}|${source}`.toLowerCase(); }
function opportunityReason(product: AffiliateProductInsightDto) { const score = product.scoreBreakdown ?? fallbackScore(product); return `Opportunity ${score.opportunity}/100: demand ${score.demand}, competition ${score.competition}, commission ${score.commission}, content potential ${score.contentPotential}, trend ${score.trend}.`; }
