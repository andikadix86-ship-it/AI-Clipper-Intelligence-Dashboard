"use client";

/* eslint-disable @next/next/no-img-element */

import clsx from "clsx";
import { ArrowDownRight, ArrowUpRight, ExternalLink, Flame, Loader2, Minus, Search, Save, Send } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useWorkspaceMode } from "@/components/workspace-mode";
import { socialPlatformLabels } from "@/lib/content-library";
import {
  productStudioContext,
  recommendationStudioContext,
  studioHref,
  trendStudioContext,
  type SavedOpportunity
} from "@/lib/intelligence/action-flow";
import { listOpportunities, migrateLocalOpportunities, persistCampaign, persistOpportunity } from "@/lib/intelligence/affiliate-persistence";
import { trendScoreExplanation } from "@/lib/intelligence/scoring";
import { youtubeScoreExplanation } from "@/lib/intelligence/scoring";
import type { AffiliateProductInsightDto, IntelligenceRecommendationDto, IntelligenceResultDto } from "@/lib/intelligence/types";
import { googleTrendsScoreExplanation, recommendationScoreExplanation } from "@/lib/intelligence/scoring";
import type { ProjectDto } from "@/lib/types";
import { IntelligenceSearchPanel } from "@/components/intelligence-search-panel";
import { ErrorCard } from "@/components/state-cards";

type Trend = IntelligenceResultDto;
type SourceStatus = { name: string; status: "READY" | "SETUP_REQUIRED" | "DEMO"; message: string };

export default function TrendingCenterPage() {
  const { mode } = useWorkspaceMode();
  const [trends, setTrends] = useState<Trend[]>([]);
  const [sources, setSources] = useState<SourceStatus[]>([]);
  const [products, setProducts] = useState<AffiliateProductInsightDto[]>([]);
  const [youtubeResults, setYoutubeResults] = useState<Trend[]>([]);
  const [youtubeStatus, setYoutubeStatus] = useState<{ status: string; message: string }>({ status: "SETUP_REQUIRED", message: "Search YouTube untuk memuat data publik real." });
  const [youtubeLoading, setYoutubeLoading] = useState(false);
  const [youtubeForm, setYoutubeForm] = useState({ keyword: "AI tools", regionCode: "ID", maxResults: "10", order: "relevance" });
  const [sourceFilter, setSourceFilter] = useState<"ALL" | "YOUTUBE" | "DEMO">("ALL");
  const [recommendations, setRecommendations] = useState<IntelligenceRecommendationDto[]>([]);
  const [monitored, setMonitored] = useState<string[]>([]);
  const [savedProducts, setSavedProducts] = useState<string[]>([]);
  const [savedOpportunities, setSavedOpportunities] = useState<SavedOpportunity[]>([]);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [projectId, setProjectId] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    listOpportunities().then((result) => setSavedOpportunities(result.items));
    Promise.all([
      fetch("/api/trending").then((response) => response.json()),
      fetch("/api/projects").then((response) => response.json()),
      fetch("/api/intelligence/products").then((response) => response.json()),
      fetch("/api/intelligence/recommendations").then((response) => response.json())
    ])
      .then(([trendData, projectData, productData, recommendationData]) => {
        setTrends(Array.isArray(trendData.trends) ? trendData.trends : []);
        setSources(Array.isArray(trendData.sources) ? trendData.sources : []);
        setProducts(Array.isArray(productData.products) ? productData.products : []);
        setRecommendations(Array.isArray(recommendationData.recommendations) ? recommendationData.recommendations : []);
        const loadedProjects = Array.isArray(projectData.projects) ? projectData.projects : [];
        setProjects(loadedProjects);
        setProjectId(loadedProjects[0]?.id ?? "");
      })
      .catch(() => setLoadError("Trending data gagal dimuat. Gunakan retry setelah koneksi provider tersedia."))
      .finally(() => setLoading(false));
  }, []);

  const analysisHref = (trend: Trend) => `/ai-analysis?trend=${encodeURIComponent(JSON.stringify({
    niche: trend.topic,
    keyword: trend.keyword,
    hashtag: trend.hashtag,
    platform: trend.socialPlatform,
    viralityScore: trend.score,
    competitionLevel: trend.competitionLevel,
    monetizationPotential: trend.monetizationPotential,
    viralReason: trend.viralReason,
    opportunity: trend.opportunity,
    source: trend.source,
    sourceUrl: trend.sourceUrl,
    collectedAt: trend.collectedAt,
    confidence: trend.confidence,
    isDemo: trend.isDemo
  }))}`;

  async function saveToProject(trend: Trend) {
    if (!projectId) {
      setToast({ type: "error", message: "Pilih Project sebelum menyimpan trend." });
      return;
    }
    setSavingId(trend.id);
    try {
      const response = await fetch("/api/content/save-from-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          contentType: "IDEA",
          platform: trend.socialPlatform,
          niche: trend.topic,
          keyword: trend.keyword,
          hashtag: trend.hashtag,
          title: `${trend.keyword} content idea`,
          hook: `Stop scrolling. This ${trend.topic.toLowerCase()} trend is moving fast.`,
          caption: `${trend.viralReason} ${trend.hashtag}`,
          cta: "Save this idea and turn it into a clip plan.",
          targetAudience: "Creators and small teams looking for high-intent short-form ideas.",
          contentAngle: trend.opportunity,
          editingStyle: "Fast proof-first edit with bold captions.",
          suggestedDuration: 30,
          fypScore: trend.score,
          notes: `Source: ${trend.source}. Collected: ${trend.collectedAt}. Confidence: ${trend.confidence}%. Demo: ${trend.isDemo}. Competition: ${trend.competitionLevel}. Monetization: ${trend.monetizationPotential}.`
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Trend gagal disimpan.");
      setToast({ type: "success", message: "Trend tersimpan ke Content Library sebagai Draft." });
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Trend gagal disimpan." });
    } finally {
      setSavingId(null);
    }
  }

  async function saveTrendOpportunity(trend: Trend) {
    const result = await persistOpportunity({ topic: trend.topic, type: "content_topic", source: trend.source, sourceUrl: trend.sourceUrl, score: trend.score, confidence: trend.confidence, platform: trend.socialPlatform, reason: trend.viralReason, notes: trend.notes, isDemo: trend.isDemo });
    setSavedOpportunities((await listOpportunities()).items);
    setToast({ type: "success", message: `${result.item.topic}: ${result.message}` });
  }

  async function saveRecommendationOpportunity(item: IntelligenceRecommendationDto) {
    const result = await persistOpportunity({ topic: item.recommendedTopic, type: "content_topic", source: item.sourceBreakdown.map((source) => source.source).join(", "), sourceUrl: item.sourceUrl, score: item.score, confidence: item.confidence, platform: item.socialPlatform, reason: item.reason, notes: item.notes, isDemo: item.isDemo });
    setSavedOpportunities((await listOpportunities()).items);
    setToast({ type: "success", message: `${result.item.topic}: ${result.message}` });
  }

  async function createRecommendationCampaign(item: IntelligenceRecommendationDto) {
    const result = await persistCampaign({ campaignName: `${item.recommendedTopic} Campaign`, productName: item.recommendedTopic, platform: item.platformFit, category: "Recommendation", trendScore: item.score, competitionLevel: "Medium", commissionEstimate: "Validate manually", priceRange: "Validate manually", contentPotentialScore: item.scoreBreakdown.contentPotential, source: item.sourceBreakdown.map((source) => source.source).join(", "), notes: item.notes, isDemo: item.isDemo });
    setToast({ type: "success", message: result.message });
  }

  async function createProjectDraft(trend: Trend) {
    try {
      const response = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: `${trend.topic} Draft`, niche: trend.keyword, category: trend.category, targetAccounts: [], contentMode: "IMAGE_GENERATOR" }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Project draft gagal dibuat.");
      setToast({ type: "success", message: "Project draft created." });
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Project draft gagal dibuat." });
    }
  }

  async function migrateOpportunities() {
    const result = await migrateLocalOpportunities();
    setSavedOpportunities((await listOpportunities()).items);
    setToast({ type: result.migrated === result.total ? "success" : "error", message: result.migrated === result.total ? "Opportunity lokal berhasil dipindahkan ke database." : "Sebagian opportunity belum dapat dipindahkan. Draft lokal tetap aman." });
  }

  async function createRecommendationProject(item: IntelligenceRecommendationDto) {
    try {
      const response = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: `${item.recommendedTopic} Draft`, niche: item.keyword, category: "Recommendation", targetAccounts: [], contentMode: "IMAGE_GENERATOR" }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Project draft gagal dibuat.");
      setToast({ type: "success", message: "Project draft created." });
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Project draft gagal dibuat." });
    }
  }

  const sortedTrends = useMemo(() => [...trends].sort((a, b) => b.score - a.score), [trends]);
  const visibleSignals = useMemo(
    () => sourceFilter === "YOUTUBE" ? youtubeResults : sourceFilter === "DEMO" ? sortedTrends : [...youtubeResults, ...sortedTrends],
    [sourceFilter, sortedTrends, youtubeResults]
  );

  async function searchYouTube(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!youtubeForm.keyword.trim()) return;
    setYoutubeLoading(true);
    try {
      const params = new URLSearchParams(youtubeForm);
      const response = await fetch(`/api/intelligence/youtube?${params.toString()}`);
      const data = await response.json();
      setYoutubeStatus({ status: data.status, message: data.message });
      setYoutubeResults(data.results ?? []);
      if (!response.ok) throw new Error(data.message ?? "YouTube search gagal.");
      if ((data.results ?? []).length > 0) {
        const recommendationResponse = await fetch("/api/intelligence/recommendations");
        const recommendationData = await recommendationResponse.json();
        setRecommendations(recommendationData.recommendations ?? []);
      }
    } catch (error) {
      setYoutubeResults([]);
      setToast({ type: "error", message: error instanceof Error ? error.message : "YouTube search gagal." });
    } finally {
      setYoutubeLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {toast ? <Toast {...toast} onClose={() => setToast(null)} /> : null}
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1 text-sm text-teal-100">
            <Flame className="h-4 w-4" />
            Trending Center
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">Trending Center</h1>
          <p className="mt-3 max-w-3xl text-slate-300">Find viral ideas, send them to AI Analysis, or save them directly to a Project as Draft ideas.</p>
          <div className="mt-3 inline-flex rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-semibold uppercase text-amber-100">Demo insight, belum terhubung ke data real</div>
        </div>
        <label className="block min-w-72">
          <span className="mb-2 block text-sm font-medium text-slate-300">Save target Project</span>
          <select value={projectId} onChange={(event) => setProjectId(event.target.value)} className="premium-input px-4 py-3">
            <option value="">Select Project</option>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
        </label>
      </header>
      {loadError ? <ErrorCard title="Trending data belum tersedia" description={loadError} /> : null}
      {loading ? <div className="glass rounded-2xl p-5 text-sm text-slate-300">Memuat trend dan recommendation...</div> : null}

      <IntelligenceSearchPanel mode={mode} />

      <section className="glass rounded-2xl p-5">
        <h2 className="text-xl font-semibold text-white">Market Signals</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">{trendScoreExplanation}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {sources.map((source) => <SourceCard key={source.name} source={source} />)}
        </div>
      </section>

      <RecommendationEngine mode={mode} recommendations={recommendations} monitored={monitored} onMonitor={(id) => setMonitored((current) => current.includes(id) ? current : [...current, id])} onSave={saveRecommendationOpportunity} onCampaign={createRecommendationCampaign} onProject={createRecommendationProject} />

      <SavedOpportunities items={savedOpportunities} onMigrate={migrateOpportunities} />

      <section className="glass rounded-2xl p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">YouTube Real Data Search</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">{youtubeScoreExplanation}</p>
          </div>
          <span className={clsx("w-fit rounded-full border px-3 py-1 text-xs font-semibold uppercase", youtubeStatus.status === "READY" ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-100" : "border-amber-300/25 bg-amber-300/10 text-amber-100")}>{youtubeStatus.status.replace("_", " ")}</span>
        </div>
        <form onSubmit={searchYouTube} className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_140px_140px_180px_auto]">
          <input value={youtubeForm.keyword} onChange={(event) => setYoutubeForm({ ...youtubeForm, keyword: event.target.value })} placeholder="Search YouTube keyword..." className="premium-input px-4 py-3" />
          <select value={youtubeForm.regionCode} onChange={(event) => setYoutubeForm({ ...youtubeForm, regionCode: event.target.value })} className="premium-input px-4 py-3"><option value="ID">Indonesia</option><option value="US">United States</option><option value="SG">Singapore</option></select>
          <select value={youtubeForm.maxResults} onChange={(event) => setYoutubeForm({ ...youtubeForm, maxResults: event.target.value })} className="premium-input px-4 py-3"><option value="5">5 results</option><option value="10">10 results</option><option value="20">20 results</option></select>
          <select value={youtubeForm.order} onChange={(event) => setYoutubeForm({ ...youtubeForm, order: event.target.value })} className="premium-input px-4 py-3"><option value="relevance">Relevance</option><option value="date">Newest</option><option value="viewCount">View Count</option></select>
          <button type="submit" disabled={youtubeLoading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{youtubeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}Search Real Data</button>
        </form>
        <p className="mt-3 text-sm text-slate-400">{youtubeStatus.message}</p>
        {youtubeResults.length ? <YouTubeMarketSummary results={youtubeResults} /> : <div className="mt-4 rounded-xl border border-dashed border-white/10 p-4 text-sm text-slate-400">Belum ada hasil YouTube real. Cari keyword untuk melihat kandidat video, growth signal, dan content opportunity.</div>}
      </section>

      <div className="flex flex-wrap gap-2">
        {(["ALL", "YOUTUBE", "DEMO"] as const).map((source) => <button key={source} type="button" onClick={() => setSourceFilter(source)} className={clsx("rounded-xl border px-4 py-2 text-sm font-semibold", sourceFilter === source ? "border-primary bg-primary text-white" : "border-white/10 bg-white/[0.04] text-slate-300")}>{source === "ALL" ? "All Signals" : source === "YOUTUBE" ? "YouTube Real" : "Demo Signals"}</button>)}
      </div>

      <section className="grid gap-4 xl:grid-cols-2">
        {visibleSignals.length ? visibleSignals.map((trend) => (
          <article key={trend.id} className="glass rounded-2xl p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="mb-3 flex flex-wrap gap-2">
                  <DataBadge isDemo={trend.isDemo} label={trend.platform === "GOOGLE_TRENDS" ? "Demo Google Trends" : undefined} />
                  <Badge>{trend.source}</Badge>
                  <Badge>{socialPlatformLabels[trend.socialPlatform]}</Badge>
                  <Badge>{trend.competitionLevel} competition</Badge>
                  <Badge>{trend.monetizationPotential} monetization</Badge>
                </div>
                <h2 className="text-2xl font-semibold text-white">{trend.topic}</h2>
                <p className="mt-2 text-sm text-slate-400">{trend.keyword} - {trend.hashtag}</p>
                {thumbnailFor(trend) ? <img src={thumbnailFor(trend)} alt="" className="mt-4 aspect-video w-full rounded-xl object-cover" /> : null}
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-300 px-3 py-1 text-sm font-semibold text-slate-950">
                <DirectionIcon direction={trend.trendDirection} />
                {trend.score}
              </span>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Info label="Viral reason" value={trend.viralReason} />
              <Info label="Opportunity" value={trend.opportunity} />
              <Info label="Confidence" value={`${trend.confidence}%`} />
              <Info label="Collected" value={new Date(trend.collectedAt).toLocaleString("id-ID")} />
              {trend.platform === "GOOGLE_TRENDS" ? <Info label="Score Formula" value={googleTrendsScoreExplanation} /> : null}
              <Info label="Region / Volume" value={`${trend.region} / ${trend.volumeLabel}`} />
              <Info label="Direction" value={trend.trendDirection} />
              {publishedAtFor(trend) ? <Info label="Published" value={new Date(publishedAtFor(trend)!).toLocaleString("id-ID")} /> : null}
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href={studioHref(trendStudioContext(trend))} className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white">
                <Send className="h-4 w-4" />
                Send to Creative Studio
              </Link>
              <button type="button" onClick={() => saveTrendOpportunity(trend)} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white">
                <Save className="h-4 w-4" />
                Save Opportunity
              </button>
              <Link href={analysisHref(trend)} className="inline-flex items-center gap-2 rounded-2xl bg-teal-300 px-4 py-3 text-sm font-semibold text-slate-950 shadow-glow">
                <Send className="h-4 w-4" />
                Send to AI Analysis
              </Link>
              {mode === "creator" ? <button type="button" onClick={() => createProjectDraft(trend)} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white">Create Project</button> : null}
              <button type="button" onClick={() => saveToProject(trend)} disabled={savingId === trend.id} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
                {savingId === trend.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save to Project
              </button>
              {trend.sourceUrl ? <a href={trend.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white"><ExternalLink className="h-4 w-4" />Open Source</a> : null}
            </div>
          </article>
        )) : <Empty />}
      </section>

      {mode === "affiliate" ? <ProductHunter products={products} savedProducts={savedProducts} onSave={async (product) => { const result = await persistCampaign({ campaignName: `${product.productName} Campaign`, productName: product.productName, platform: product.platform, category: product.category, trendScore: product.trendScore, competitionLevel: product.competitionLevel, commissionEstimate: product.commissionEstimate, priceRange: product.priceRange, contentPotentialScore: product.contentPotentialScore, source: product.source, sourceUrl: product.sourceUrl, notes: product.notes, isDemo: product.isDemo }); setSavedProducts((current) => current.includes(product.id) ? current : [...current, product.id]); setToast({ type: "success", message: result.message }); }} onSaveOpportunity={async (product) => { const result = await persistOpportunity({ topic: product.productName, type: "affiliate_product", source: product.source, sourceUrl: product.sourceUrl, score: product.trendScore, confidence: product.confidence, platform: product.platform, reason: product.notes, notes: product.notes, isDemo: product.isDemo }); setSavedOpportunities((await listOpportunities()).items); setToast({ type: "success", message: result.message }); }} /> : null}
    </div>
  );
}

function RecommendationEngine({ mode, recommendations, monitored, onMonitor, onSave, onCampaign, onProject }: { mode: "creator" | "affiliate"; recommendations: IntelligenceRecommendationDto[]; monitored: string[]; onMonitor: (id: string) => void; onSave: (item: IntelligenceRecommendationDto) => void; onCampaign: (item: IntelligenceRecommendationDto) => void; onProject: (item: IntelligenceRecommendationDto) => void }) {
  return <section className="glass rounded-2xl p-5"><div><h2 className="text-xl font-semibold text-white">Recommendation Engine v2</h2><p className="mt-2 text-sm leading-6 text-slate-400">{recommendationScoreExplanation}</p></div><div className="mt-5 grid gap-4 xl:grid-cols-2">{recommendations.length ? recommendations.slice(0, 6).map((item) => <article key={item.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-4"><div className="flex flex-wrap items-center justify-between gap-3"><DataBadge isDemo={item.isDemo} /><span className="rounded-full bg-primary px-3 py-1 text-sm font-semibold text-white">{item.score}</span></div><h3 className="mt-3 text-lg font-semibold text-white">{item.recommendedTopic}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{item.reason}</p><p className="mt-3 text-sm leading-6 text-teal-100">{item.contentAngle}</p><div className="mt-4 grid gap-2 sm:grid-cols-3">{Object.entries(item.scoreBreakdown).map(([label, value]) => <div key={label} className="rounded-lg border border-white/10 bg-white/[0.04] p-2"><div className="text-[10px] uppercase text-slate-500">{label.replaceAll(/([A-Z])/g, " $1")}</div><div className="mt-1 font-semibold text-white">{value}</div></div>)}</div><div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-400"><Badge>{item.confidence}% confidence</Badge><Badge>{item.platformFit}</Badge><Badge>{item.recommendedAction}</Badge></div><div className="mt-3 text-xs leading-5 text-slate-500">{item.sourceBreakdown.map((source) => `${source.source}: ${source.value}`).join(" | ")}</div><div className="mt-1 text-xs leading-5 text-slate-500">Collected: {new Date(item.collectedAt).toLocaleString("id-ID")} | {item.notes}</div><div className="mt-3 rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 text-xs leading-5 text-amber-100">Risk note: {item.riskNote}</div><div className="mt-4 flex flex-wrap gap-2"><Link href={studioHref(recommendationStudioContext(item))} className="rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white">Send to Creative Studio</Link><button type="button" onClick={() => onSave(item)} className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-white">Save Recommendation</button>{mode === "affiliate" ? <button type="button" onClick={() => onCampaign(item)} className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-white">Create Campaign</button> : <button type="button" onClick={() => onProject(item)} className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-white">Create Project</button>}<button type="button" disabled title="Buat asset terlebih dahulu di Creative Studio." className="cursor-not-allowed rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-slate-600">Send to Approval</button><button type="button" disabled title="Asset Approved diperlukan sebelum scheduling." className="cursor-not-allowed rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-slate-600">Schedule</button><button type="button" onClick={() => onMonitor(item.id)} className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-white">{monitored.includes(item.id) ? "Monitoring" : "Monitor"}</button></div></article>) : <div className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-slate-400">Belum ada recommendation. Gunakan Google Trends demo atau cari YouTube real data terlebih dahulu.</div>}</div></section>;
}

function SavedOpportunities({ items, onMigrate }: { items: SavedOpportunity[]; onMigrate: () => void }) {
  const hasLocal = items.some((item) => item.dataSource !== "database");
  return <section className="glass rounded-2xl p-5"><div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-semibold text-white">Saved Opportunities</h2><p className="mt-2 text-sm text-slate-400">Database-first dengan fallback lokal saat Supabase tidak tersedia.</p></div><Badge>{items.length} saved</Badge></div>{hasLocal ? <div className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100">Data lokal ditemukan. Pindahkan ke database?<button type="button" onClick={onMigrate} className="ml-3 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white">Migrate Now</button></div> : null}{items.length ? <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{items.slice(0, 6).map((item) => <div key={item.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-4"><div className="flex flex-wrap gap-2"><DataBadge isDemo={item.isDemo} /><Badge>{item.dataSource === "database" ? "DB Saved" : "Local Draft"}</Badge><Badge>{item.type.replace("_", " ")}</Badge></div><h3 className="mt-3 font-semibold text-white">{item.topic}</h3><p className="mt-2 text-xs leading-5 text-slate-400">{item.source} | Score {item.score} | Confidence {item.confidence}%</p></div>)}</div> : <p className="mt-4 rounded-xl border border-dashed border-white/10 p-4 text-sm text-slate-400">Belum ada opportunity tersimpan. Pilih Save Opportunity pada signal atau recommendation.</p>}</section>;
}

function YouTubeMarketSummary({ results }: { results: Trend[] }) {
  const top = [...results].sort((a, b) => b.score - a.score)[0];
  const rising = results.filter((item) => item.trendDirection === "RISING").length;
  return <div className="mt-5 grid gap-3 md:grid-cols-3"><Info label="Top Keyword" value={top?.keyword ?? "No data"} /><Info label="High Growth Videos" value={`${rising} recent viral candidates`} /><Info label="Content Opportunity" value={top?.opportunity ?? "Search YouTube to generate opportunity notes."} /></div>;
}

function rawString(trend: Trend, key: string) {
  const value = trend.rawData?.[key];
  return typeof value === "string" ? value : undefined;
}

function thumbnailFor(trend: Trend) {
  return rawString(trend, "thumbnail");
}

function publishedAtFor(trend: Trend) {
  return rawString(trend, "publishedAt");
}

function SourceCard({ source }: { source: SourceStatus }) {
  const ready = source.status === "READY";
  return <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4"><div className="flex items-center justify-between gap-3"><div className="font-semibold text-white">{source.name}</div><span className={clsx("rounded-full border px-2 py-1 text-[10px] font-semibold uppercase", ready ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-100" : "border-amber-300/25 bg-amber-300/10 text-amber-100")}>{source.status.replace("_", " ")}</span></div><p className="mt-2 text-sm leading-6 text-slate-400">{source.message}</p></div>;
}

function ProductHunter({ products, savedProducts, onSave, onSaveOpportunity }: { products: AffiliateProductInsightDto[]; savedProducts: string[]; onSave: (product: AffiliateProductInsightDto) => void | Promise<void>; onSaveOpportunity: (product: AffiliateProductInsightDto) => void | Promise<void> }) {
  return <section className="glass rounded-2xl p-5"><div><h2 className="text-xl font-semibold text-white">Affiliate Product Hunter</h2><p className="mt-2 text-sm text-slate-400">Demo product insight. Marketplace API belum terhubung.</p></div><div className="mt-5 overflow-x-auto"><table className="min-w-[1120px] w-full text-left text-sm"><thead className="text-xs uppercase text-slate-500"><tr>{["Product", "Platform", "Score", "Confidence", "Competition", "Commission Estimate", "Collected", "Source", "Actions"].map((label) => <th key={label} className="px-3 py-3">{label}</th>)}</tr></thead><tbody>{products.map((product) => <tr key={product.id} className="border-t border-white/10"><td className="px-3 py-4"><div className="font-semibold text-white">{product.productName}</div><div className="mt-1 text-xs text-amber-100">Demo product insight</div><div className="mt-1 max-w-xs text-slate-500">Demo product insight based on content potential and commission estimate.</div></td><td className="px-3 py-4 text-slate-300">{product.platform}</td><td className="px-3 py-4 font-semibold text-teal-200">{product.trendScore}</td><td className="px-3 py-4 text-slate-300">{product.confidence}%</td><td className="px-3 py-4 text-slate-300">{product.competitionLevel}</td><td className="px-3 py-4 text-slate-300">{product.commissionEstimate}</td><td className="px-3 py-4 text-slate-400">{new Date(product.collectedAt).toLocaleString("id-ID")}</td><td className="px-3 py-4 text-slate-400">{product.source}</td><td className="px-3 py-4"><div className="flex flex-wrap gap-2"><Link href={studioHref(productStudioContext(product))} className="rounded-lg bg-primary px-2 py-1 text-xs font-semibold text-white">Generate Content</Link><button type="button" onClick={() => onSaveOpportunity(product)} className="rounded-lg border border-white/10 bg-white/[0.06] px-2 py-1 text-xs font-semibold text-white">Save Opportunity</button><button type="button" onClick={() => onSave(product)} className="rounded-lg border border-white/10 px-2 py-1 text-xs font-semibold text-white">{savedProducts.includes(product.id) ? "Campaign Created" : "Create Campaign"}</button></div></td></tr>)}</tbody></table></div></section>;
}

function DataBadge({ isDemo, label }: { isDemo: boolean; label?: string }) {
  return <span className={clsx("rounded-full border px-3 py-1 text-xs font-semibold", isDemo ? "border-amber-300/25 bg-amber-300/10 text-amber-100" : "border-emerald-300/25 bg-emerald-300/10 text-emerald-100")}>{label ?? (isDemo ? "Demo" : "Real")}</span>;
}

function DirectionIcon({ direction }: { direction: Trend["trendDirection"] }) {
  return direction === "RISING" ? <ArrowUpRight className="h-4 w-4" /> : direction === "FALLING" ? <ArrowDownRight className="h-4 w-4" /> : <Minus className="h-4 w-4" />;
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-xs font-semibold text-slate-200">{children}</span>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><div className="text-xs font-semibold uppercase text-slate-500">{label}</div><p className="mt-2 text-sm leading-6 text-slate-300">{value}</p></div>;
}

function Empty() {
  return <div className="glass grid min-h-72 place-items-center rounded-2xl p-8 text-center xl:col-span-2"><div><Flame className="mx-auto mb-4 h-10 w-10 text-teal-300" /><h2 className="text-xl font-semibold text-white">Belum ada trend yang tersedia</h2><p className="mt-2 max-w-md text-sm leading-6 text-slate-400">Buat Project terlebih dahulu agar ide yang ditemukan dapat langsung disimpan sebagai Draft dan dilanjutkan ke AI Analysis.</p><Link href="/projects" className="mt-5 inline-flex rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500">Create Project</Link></div></div>;
}

function Toast({ type, message, onClose }: { type: "success" | "error"; message: string; onClose: () => void }) {
  return <div className={clsx("fixed right-4 top-4 z-50 max-w-sm rounded-2xl border p-4 text-sm shadow-glow", type === "success" ? "border-teal-300/30 bg-teal-950 text-teal-50" : "border-rose-300/30 bg-rose-950 text-rose-50")}><div className="flex items-start justify-between gap-4"><span>{message}</span><button type="button" onClick={onClose} className="opacity-70 hover:opacity-100">Close</button></div></div>;
}
