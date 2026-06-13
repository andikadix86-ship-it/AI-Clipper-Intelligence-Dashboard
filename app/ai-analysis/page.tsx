"use client";

import clsx from "clsx";
import { Brain, CheckCircle2, Loader2, Save, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { socialPlatformLabels } from "@/lib/content-library";
import { studioHref } from "@/lib/intelligence/action-flow";
import { RecentAnalysisList } from "@/components/recent-analysis-list";
import { getConnectionBadge, getConnectionStatus, getProviderErrorMessage } from "@/lib/intelligence/source-utils";
import type { AIProviderName, ContentType, ProjectDto, ProviderMode, SocialPlatform } from "@/lib/types";

type TrendInput = {
  niche: string;
  keyword: string;
  hashtag: string;
  platform: SocialPlatform;
  viralityScore?: number;
  competitionLevel?: string;
  monetizationPotential?: string;
  viralReason?: string;
  opportunity?: string;
  source?: string;
  sourceUrl?: string;
  collectedAt?: string;
  confidence?: number;
  isDemo?: boolean;
  recommendationReason?: string;
  recommendedAction?: string;
  platformFit?: string;
  recommendationScore?: number;
};

type AnalysisForm = {
  title: string;
  hook: string;
  caption: string;
  description: string;
  hashtag: string;
  cta: string;
  targetAudience: string;
  contentAngle: string;
  editingStyle: string;
  duration: number;
  fypScore: number;
  postingTimeRecommendation: string;
  notes: string;
  providerMode: ProviderMode;
  providerWarning?: string;
};

type SocialAccountOption = { id: string; name: string; projectId?: string; status?: string; isActive?: boolean };

const emptyAnalysis: AnalysisForm = {
  title: "",
  hook: "",
  caption: "",
  description: "",
  hashtag: "",
  cta: "",
  targetAudience: "",
  contentAngle: "",
  editingStyle: "",
  duration: 30,
  fypScore: 80,
  postingTimeRecommendation: "",
  notes: "",
  providerMode: "DUMMY"
};

export default function AIAnalysisPage() {
  return (
    <Suspense fallback={<AIAnalysisLoading />}>
      <AIAnalysisContent />
    </Suspense>
  );
}

function AIAnalysisContent() {
  const searchParams = useSearchParams();
  const [trend, setTrend] = useState<TrendInput | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisForm>(emptyAnalysis);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccountOption[]>([]);
  const [projectId, setProjectId] = useState("");
  const [socialAccountId, setSocialAccountId] = useState("");
  const [contentType, setContentType] = useState<ContentType>("CLIP_PLAN");
  const [provider, setProvider] = useState<AIProviderName>("GEMINI_VEO");
  const [providerMode, setProviderMode] = useState<ProviderMode>("DUMMY");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    const encoded = searchParams.get("trend");
    const similar = searchParams.get("similar");
    const recommendation = searchParams.get("recommendation");
    if (encoded) {
      try {
        applyTrend(JSON.parse(encoded));
      } catch {
        setToast({ type: "error", message: "Trend payload tidak valid. Tidak memakai dummy default." });
      }
    }
    if (similar) {
      try {
        const payload = JSON.parse(similar);
        applyTrend({
          niche: "Similar Content",
          keyword: payload.title ?? "similar content",
          hashtag: "#SimilarContent",
          platform: "YOUTUBE_SHORTS",
          competitionLevel: "Medium",
          monetizationPotential: "High",
          viralReason: payload.recommendation ?? "Recommendation engine found a repeatable content pattern.",
          opportunity: "Turn this recommendation into a new editable content plan.",
          source: "Similar Content",
          confidence: 50,
          isDemo: true
        });
      } catch {
        setToast({ type: "error", message: "Similar content payload tidak valid." });
      }
    }
    if (recommendation) {
      try {
        const payload = JSON.parse(recommendation);
        applyTrend({
          niche: payload.recommendedTopic ?? "Recommended Topic",
          keyword: payload.keyword ?? payload.recommendedTopic ?? "recommended topic",
          hashtag: "#RecommendedContent",
          platform: payload.socialPlatform ?? "YOUTUBE_SHORTS",
          viralityScore: payload.score,
          competitionLevel: "Medium",
          monetizationPotential: "Medium",
          viralReason: payload.reason,
          opportunity: payload.contentAngle,
          source: payload.sourceBreakdown?.map((source: { source: string }) => source.source).join(", ") || "Recommendation Engine v1",
          collectedAt: payload.collectedAt,
          confidence: payload.confidence,
          isDemo: payload.isDemo,
          recommendationReason: payload.reason,
          recommendedAction: payload.recommendedAction,
          platformFit: payload.platformFit,
          recommendationScore: payload.score
        });
      } catch {
        setToast({ type: "error", message: "Recommendation payload tidak valid." });
      }
    }
  }, [searchParams]);

  useEffect(() => {
    Promise.all([
      fetch("/api/projects").then((response) => response.json()),
      fetch("/api/social-accounts").then((response) => response.json())
    ])
      .then(([projectData, accountData]) => {
        const loadedProjects = projectData.projects ?? [];
        setProjects(loadedProjects);
        setProjectId(loadedProjects[0]?.id ?? "");
        setSocialAccounts((Array.isArray(accountData.accounts) ? accountData.accounts : []).filter((account: SocialAccountOption) => account.isActive !== false && account.status !== "DISABLED"));
      })
      .catch(() => setToast({ type: "error", message: "Project atau Social Account gagal dimuat." }));
  }, []);

  useEffect(() => {
    if (trend) generateAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trend?.keyword, trend?.platform]);

  const projectAccounts = useMemo(
    () => socialAccounts.filter((account) => !projectId || !account.projectId || account.projectId === projectId),
    [projectId, socialAccounts]
  );

  async function generateAnalysis() {
    if (!trend) {
      setToast({ type: "error", message: "Belum ada trend input. Kirim data dari Trending Center atau Recommendation Engine terlebih dahulu." });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/ai-analysis/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...trend, provider, mode: providerMode })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? data.error ?? "Analysis gagal dibuat.");
      if (!data.analysis) throw new Error("Response analysis tidak lengkap.");
      setAnalysis({
        title: data.analysis.viralTitle ?? "",
        hook: data.analysis.hook ?? "",
        caption: data.analysis.caption ?? "",
        description: data.analysis.description ?? "",
        hashtag: data.analysis.hashtag ?? "",
        cta: data.analysis.cta ?? "",
        targetAudience: data.analysis.targetAudience ?? "",
        contentAngle: data.analysis.contentAngle ?? "",
        editingStyle: data.analysis.editingStyle ?? "",
        duration: data.analysis.suggestedDuration ?? 30,
        fypScore: data.analysis.fypScore ?? 0,
        postingTimeRecommendation: data.analysis.postingTimeRecommendation ?? "",
        notes: data.analysis.notes ?? "",
        providerMode: data.analysis.providerMode === "REAL" ? "REAL" : "DUMMY",
        providerWarning: data.analysis.providerWarning ? getProviderErrorMessage(provider, data.analysis.providerWarning) : undefined
      });
      if (data.analysis.providerWarning) setToast({ type: "error", message: getProviderErrorMessage(provider, data.analysis.providerWarning) });
    } catch (error) {
      setToast({ type: "error", message: providerMode === "REAL" ? getProviderErrorMessage(provider, error) : error instanceof Error ? error.message : "Analysis gagal dibuat." });
    } finally {
      setLoading(false);
    }
  }

  async function saveToProject() {
    if (!trend) {
      setToast({ type: "error", message: "Belum ada trend input untuk disimpan." });
      return;
    }
    if (!projectId) {
      setToast({ type: "error", message: "Pilih Project sebelum save." });
      return;
    }
    const sourceStatus = getConnectionStatus(trend);
    const draftTitle = analysis.title.trim() || `${trend.keyword} content idea`;
    const draftHook = analysis.hook.trim() || trend.viralReason || `Mulai dari insight utama ${trend.keyword}.`;
    const draftCaption = analysis.caption.trim() || `${trend.opportunity ?? trend.keyword} ${trend.hashtag}`;
    const draftCta = analysis.cta.trim() || "Save this idea and turn it into a clip plan.";
    const draftAudience = analysis.targetAudience.trim() || "Creators and teams validating real trend signals.";
    const draftAngle = analysis.contentAngle.trim() || trend.opportunity || "Build an original short-form angle from the source signal.";
    setSaving(true);
    try {
      const response = await fetch("/api/content/save-from-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          socialAccountId: socialAccountId || undefined,
          contentType,
          platform: trend.platform,
          niche: trend.niche,
          keyword: trend.keyword,
          hashtag: analysis.hashtag || trend.hashtag,
          title: draftTitle,
          hook: draftHook,
          caption: draftCaption,
          cta: draftCta,
          targetAudience: draftAudience,
          contentAngle: draftAngle,
          editingStyle: analysis.editingStyle,
          suggestedDuration: analysis.duration,
          fypScore: trend.recommendationScore ?? trend.viralityScore ?? analysis.fypScore,
          notes: `${analysis.notes || "Saved from AI Analysis trend input."}\nSource: ${trend.source ?? "unknown"}\nSource status: ${sourceStatus}\nSource URL: ${trend.sourceUrl ?? "not available"}\nPosting time: ${analysis.postingTimeRecommendation || "not generated"}`,
          source: trend.source,
          sourceUrl: trend.sourceUrl,
          sourceStatus,
          isDemo: sourceStatus !== "REAL"
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Content gagal disimpan.");
      setToast({ type: "success", message: `${data.item.title} tersimpan sebagai Draft di Content Library.` });
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Content gagal disimpan." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {toast ? <Toast {...toast} onClose={() => setToast(null)} /> : null}
      <header>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1 text-sm text-teal-100">
          <Brain className="h-4 w-4" />
          AI Analysis
        </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">AI Analysis</h1>
          <p className="mt-3 max-w-3xl text-slate-300">Turn a trending signal into an editable content recommendation, then save it to a Project as Draft.</p>
      </header>

      <RecentAnalysisList />

      {trend ? <section className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
        <div className="space-y-6">
          {trend.recommendationReason ? <div className="glass rounded-2xl p-5"><h2 className="text-xl font-semibold text-white">Why This Topic Is Recommended</h2><div className="mt-4 space-y-3"><Info label="Reason" value={trend.recommendationReason} /><Info label="Potential Content Angle" value={trend.opportunity ?? "Create a proof-first content angle."} /><Info label="Risk / Competition Note" value={`${trend.competitionLevel ?? "Medium"} competition. Validate the hook before scaling.`} /><Info label="Best Platform Suggestion" value={trend.platformFit ?? socialPlatformLabels[trend.platform]} /><Info label="Next Action" value={trend.recommendedAction ?? "Monitor first"} /><Info label="Recommendation Score" value={String(trend.recommendationScore ?? trend.viralityScore ?? "Not recorded")} /></div></div> : null}
          <div className="glass rounded-2xl p-5">
            <div className="mb-4 flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-teal-300" />
              <h2 className="text-xl font-semibold text-white">Trend Input</h2>
            </div>
            <div className="space-y-3">
              <Info label="Niche" value={trend.niche} />
              <Info label="Keyword" value={trend.keyword} />
              <Info label="Hashtag" value={trend.hashtag} />
              <Info label="Platform" value={socialPlatformLabels[trend.platform]} />
              <Info label="Viral reason" value={trend.viralReason ?? "Not provided."} />
              <Info label="Competition" value={trend.competitionLevel ?? "Medium"} />
              <Info label="Opportunity" value={trend.opportunity ?? "Create a proof-first content angle."} />
              <Info label="Data Source" value={trend.source ?? "Not connected"} />
              <Info label="Data Mode" value={getConnectionBadge(trend)} />
              <Info label="Confidence" value={`${trend.confidence ?? 25}%`} />
              <Info label="Collected" value={trend.collectedAt ? new Date(trend.collectedAt).toLocaleString("id-ID") : "Timestamp not available"} />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="AI Provider">
                <select value={provider} onChange={(event) => setProvider(event.target.value as AIProviderName)} className="premium-input px-4 py-3">
                  <option value="GEMINI_VEO">Gemini</option>
                  <option value="OPENAI_SORA">OpenAI</option>
                  <option value="MANUAL_UPLOAD">NOT CONNECTED / Manual</option>
                </select>
              </Field>
              <Field label="Provider Mode">
                <select value={providerMode} onChange={(event) => setProviderMode(event.target.value as ProviderMode)} className="premium-input px-4 py-3">
                  <option value="DUMMY">NOT CONNECTED / Manual preview</option>
                  <option value="REAL">Real strict</option>
                </select>
              </Field>
            </div>
            <button type="button" onClick={generateAnalysis} disabled={loading} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Regenerate Analysis
            </button>
          </div>

          <div className="glass rounded-2xl p-5">
            <h2 className="mb-4 text-xl font-semibold text-white">Save to Project</h2>
            <div className="space-y-4">
              <Field label="Project">
                <select value={projectId} onChange={(event) => setProjectId(event.target.value)} className="premium-input px-4 py-3">
                  <option value="">Select Project</option>
                  {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                </select>
              </Field>
              <Field label="Social Account optional">
                <select value={socialAccountId} onChange={(event) => setSocialAccountId(event.target.value)} className="premium-input px-4 py-3">
                  <option value="">No account selected</option>
                  {projectAccounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
                </select>
              </Field>
              <Field label="Content Type">
                <select value={contentType} onChange={(event) => setContentType(event.target.value as ContentType)} className="premium-input px-4 py-3">
                  <option value="IDEA">IDEA</option>
                  <option value="SCRIPT">SCRIPT</option>
                  <option value="CLIP_PLAN">CLIP_PLAN</option>
                </select>
              </Field>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-300">Status default: Draft</div>
              <button type="button" onClick={saveToProject} disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-300 px-5 py-4 font-semibold text-slate-950 shadow-glow disabled:opacity-60">
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                Save to Project
              </button>
              <Link href={studioHref({ topic: trend.niche, keyword: trend.keyword, source: trend.source ?? "AI Analysis", sourceUrl: trend.sourceUrl, score: trend.recommendationScore ?? trend.viralityScore ?? analysis.fypScore, confidence: trend.confidence ?? 25, platform: trend.platform, reason: trend.viralReason ?? analysis.notes, recommendedContentAngle: analysis.contentAngle || trend.opportunity || "Create a proof-first short content angle.", isDemo: trend.isDemo !== false, notes: analysis.notes, suggestedHook: analysis.hook || `Mulai dengan hasil utama dari ${trend.keyword}.`, suggestedCaption: analysis.caption || `${trend.keyword} untuk pemula.`, generationType: "AI_VIDEO" })} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 font-semibold text-white">
                Send to Creative Studio
              </Link>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-white">Editable Recommendation</h2>
            <span className={clsx("rounded-full px-3 py-1 text-xs font-semibold", analysis.providerMode === "REAL" ? "bg-teal-300 text-slate-950" : "bg-amber-300/15 text-amber-100")}>
              {analysis.providerMode === "REAL" ? "REAL" : "NOT CONNECTED"}
            </span>
          </div>
          {analysis.providerWarning ? <div className="mb-4 rounded-xl border border-amber-300/25 bg-amber-300/10 p-3 text-sm text-amber-100">{analysis.providerWarning}</div> : null}
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Title"><input value={analysis.title} onChange={(e) => setAnalysis({ ...analysis, title: e.target.value })} className="premium-input px-4 py-3" /></Field>
            <Field label="Suggested duration"><input type="number" value={analysis.duration} onChange={(e) => setAnalysis({ ...analysis, duration: Number(e.target.value) })} className="premium-input px-4 py-3" /></Field>
            <Field label="Hook 3 detik pertama"><textarea value={analysis.hook} onChange={(e) => setAnalysis({ ...analysis, hook: e.target.value })} rows={3} className="premium-input px-4 py-3" /></Field>
            <Field label="Caption"><textarea value={analysis.caption} onChange={(e) => setAnalysis({ ...analysis, caption: e.target.value })} rows={3} className="premium-input px-4 py-3" /></Field>
            <Field label="Description"><textarea value={analysis.description} onChange={(e) => setAnalysis({ ...analysis, description: e.target.value })} rows={3} className="premium-input px-4 py-3" /></Field>
            <Field label="Hashtag"><input value={analysis.hashtag} onChange={(e) => setAnalysis({ ...analysis, hashtag: e.target.value })} className="premium-input px-4 py-3" /></Field>
            <Field label="CTA"><input value={analysis.cta} onChange={(e) => setAnalysis({ ...analysis, cta: e.target.value })} className="premium-input px-4 py-3" /></Field>
            <Field label="Target audience"><textarea value={analysis.targetAudience} onChange={(e) => setAnalysis({ ...analysis, targetAudience: e.target.value })} rows={3} className="premium-input px-4 py-3" /></Field>
            <Field label="Content angle"><textarea value={analysis.contentAngle} onChange={(e) => setAnalysis({ ...analysis, contentAngle: e.target.value })} rows={3} className="premium-input px-4 py-3" /></Field>
            <Field label="Editing style"><textarea value={analysis.editingStyle} onChange={(e) => setAnalysis({ ...analysis, editingStyle: e.target.value })} rows={3} className="premium-input px-4 py-3" /></Field>
            <Field label="Notes"><textarea value={analysis.notes} onChange={(e) => setAnalysis({ ...analysis, notes: e.target.value })} rows={3} className="premium-input px-4 py-3" /></Field>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Info label="FYP Score" value={String(analysis.fypScore)} strong />
            <Info label="Posting time recommendation" value={analysis.postingTimeRecommendation || "Generate analysis first."} strong />
          </div>
        </div>
      </section> : <EmptyAnalysisState />}
    </div>
  );

  function applyTrend(nextTrend: TrendInput) {
    const status = getConnectionStatus(nextTrend);
    setTrend(nextTrend);
    setProviderMode(status === "REAL" ? "REAL" : "DUMMY");
    setAnalysis({ ...emptyAnalysis, providerMode: status === "REAL" ? "REAL" : "DUMMY" });
  }
}

function AIAnalysisLoading() {
  return (
    <div className="glass grid min-h-96 place-items-center rounded-2xl p-8 text-center">
      <div>
        <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-teal-300" />
        <h1 className="text-2xl font-semibold text-white">Loading AI Analysis</h1>
        <p className="mt-2 text-sm text-slate-400">Preparing trend context and project data.</p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm font-medium text-slate-300">{label}</span>{children}</label>;
}

function Info({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"><div className="text-xs font-semibold uppercase text-slate-500">{label}</div><div className={clsx("mt-1 text-sm leading-6", strong ? "font-semibold text-teal-100" : "text-slate-300")}>{value}</div></div>;
}

function EmptyAnalysisState() {
  return <section className="glass grid min-h-80 place-items-center rounded-2xl p-8 text-center"><div><Brain className="mx-auto mb-4 h-10 w-10 text-teal-300" /><h2 className="text-xl font-semibold text-white">Belum ada data untuk AI Analysis</h2><p className="mt-2 max-w-md text-sm leading-6 text-slate-400">Kirim hasil dari Trending Center atau Recommendation Engine. Jika tidak ada data real, halaman ini tidak membuat dummy analysis otomatis.</p><Link href="/trending-center" className="mt-5 inline-flex rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white">Buka Trending Center</Link></div></section>;
}

function Toast({ type, message, onClose }: { type: "success" | "error"; message: string; onClose: () => void }) {
  return <div className={clsx("fixed right-4 top-4 z-50 max-w-sm rounded-2xl border p-4 text-sm shadow-glow", type === "success" ? "border-teal-300/30 bg-teal-950 text-teal-50" : "border-rose-300/30 bg-rose-950 text-rose-50")}><div className="flex items-start justify-between gap-4"><span>{message}</span><button type="button" onClick={onClose} className="opacity-70 hover:opacity-100">Close</button></div></div>;
}
