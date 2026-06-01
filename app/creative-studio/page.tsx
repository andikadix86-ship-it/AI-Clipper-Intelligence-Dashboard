"use client";

/* eslint-disable @next/next/no-img-element */

import clsx from "clsx";
import { AlertTriangle, CheckCircle2, Clapperboard, ImageIcon, Loader2, Palette, Play, RefreshCcw, Sparkles, Wand2 } from "lucide-react";
import { useEffect, useState } from "react";
import { providerLabels } from "@/lib/dummy-creative";
import type { StudioInsightContext } from "@/lib/intelligence/action-flow";
import type { AIProviderName, CreativeAssetDto, CreativeType, ProjectDto, ProviderMode } from "@/lib/types";

const tabs: Array<{ id: CreativeType; label: string; icon: typeof ImageIcon }> = [
  { id: "IMAGE", label: "Generate Image", icon: ImageIcon },
  { id: "MOTION_IMAGE", label: "Generate Motion Image", icon: Play },
  { id: "AI_VIDEO", label: "Generate AI Video", icon: Clapperboard }
];

const providers: AIProviderName[] = ["GEMINI_VEO", "OPENAI_SORA", "RUNWAY", "PIKA", "LUMA", "MANUAL_UPLOAD"];

export default function CreativeStudioPage() {
  const [activeTab, setActiveTab] = useState<CreativeType>("IMAGE");
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [projectId, setProjectId] = useState("");
  const [prompt, setPrompt] = useState("A premium creator dashboard scene with cinematic lighting");
  const [style, setStyle] = useState("Cinematic");
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [motionPrompt, setMotionPrompt] = useState("camera zoom with cinematic pan");
  const [provider, setProvider] = useState<AIProviderName>("GEMINI_VEO");
  const [mode, setMode] = useState<ProviderMode>("DUMMY");
  const [asset, setAsset] = useState<CreativeAssetDto | null>(null);
  const [job, setJob] = useState<{ id?: string; status?: string; progress?: number; errorMessage?: string | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [insightContext, setInsightContext] = useState<StudioInsightContext | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const suggestedPrompt = params.get("prompt");
    if (suggestedPrompt) setPrompt(suggestedPrompt);
    const suggestedType = params.get("type");
    if (suggestedType === "IMAGE" || suggestedType === "MOTION_IMAGE" || suggestedType === "AI_VIDEO") {
      setActiveTab(suggestedType);
      setMessage("Prompt template loaded. Review and edit it before generating.");
    }
    const context = params.get("context");
    if (context) {
      try {
        const parsed = JSON.parse(context) as StudioInsightContext;
        setInsightContext(parsed);
        setPrompt(buildPrompt(parsed));
        setActiveTab(parsed.generationType);
        setMessage("Sent to Creative Studio. Review and edit the prompt before generating.");
      } catch {
        setMessage("Insight context tidak valid. Prompt default tetap dapat diedit.");
      }
    }
    fetch("/api/projects")
      .then((response) => response.json())
      .then((data) => {
        const loadedProjects = data.projects ?? [];
        setProjects(loadedProjects);
        setProjectId(loadedProjects[0]?.id ?? "");
      })
      .catch(() => undefined);
  }, []);

  async function generate() {
    setLoading(true);
    setMessage(null);
    setJob({ status: "PROCESSING", progress: 35 });
    try {
      const response = await fetch("/api/creative/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: activeTab,
          projectId,
          prompt,
          style,
          aspectRatio,
          motionPrompt: activeTab === "MOTION_IMAGE" ? motionPrompt : undefined,
          provider,
          mode,
          campaignId: insightContext?.campaignId,
          generatedContentId: insightContext?.generatedContentId
        })
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error ?? "Generation failed.");
        setJob({ status: "FAILED", progress: 100, errorMessage: data.error ?? "Generation failed." });
        return;
      }
      setAsset(data.asset);
      setJob(data.job ?? { id: data.jobId, status: "COMPLETED", progress: 100, errorMessage: data.warning });
      setMessage(data.warning ?? data.relevanceWarning ?? `Asset generated in ${data.mode ?? mode} mode and saved to Content Library.`);
    } catch {
      const errorMessage = "Provider request failed. Dummy preview remains available; retry when the connection is stable.";
      setMessage(errorMessage);
      setJob({ status: "FAILED", progress: 100, errorMessage });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1 text-sm text-teal-100">
          <Palette className="h-4 w-4" />
          Creative Studio
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">Creative Studio</h1>
        <p className="mt-3 max-w-3xl text-slate-300">
          Create visual assets from a prompt. Choose Dummy Preview for quick mockups or Real Provider to send the prompt to a connected provider.
        </p>
      </header>

      <section className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
        <div className="glass rounded-2xl p-5 md:p-6">
          {insightContext ? (
            <div className="mb-5 rounded-xl border border-blue-300/20 bg-blue-300/10 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-slate-100">{insightContext.isDemo ? "Demo Source" : "Real Source"}</span>
                <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-slate-100">{insightContext.platform}</span>
                <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-slate-100">Score {insightContext.score}</span>
              </div>
              <h2 className="mt-3 font-semibold text-white">{insightContext.topic}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">{insightContext.recommendedContentAngle}</p>
              <p className="mt-2 text-xs leading-5 text-slate-400">Source: {insightContext.source} | Confidence: {insightContext.confidence}%</p>
              <p className="mt-2 text-xs leading-5 text-slate-400">Suggested hook: {insightContext.suggestedHook}</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">Suggested caption: {insightContext.suggestedCaption}</p>
              {insightContext.script ? <p className="mt-1 text-xs leading-5 text-slate-400">Script: {insightContext.script}</p> : null}
              {insightContext.cta ? <p className="mt-1 text-xs leading-5 text-slate-400">CTA: {insightContext.cta}</p> : null}
            </div>
          ) : null}
          <div className="mb-5 grid gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition",
                  activeTab === tab.id ? "bg-white text-slate-950" : "bg-white/[0.05] text-slate-300 hover:bg-white/[0.09]"
                )}
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <Field label="Project">
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="premium-input px-4 py-3">
                <option value="">Unassigned</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Prompt">
              <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={5} className="premium-input px-4 py-3" />
            </Field>
            <Field label="Style">
              <select value={style} onChange={(e) => setStyle(e.target.value)} className="premium-input px-4 py-3">
                <option>Cinematic</option>
                <option>Editorial</option>
                <option>Product Render</option>
                <option>Anime</option>
                <option>Photorealistic</option>
              </select>
            </Field>
            <Field label="Aspect ratio">
              <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className="premium-input px-4 py-3">
                <option>1:1</option>
                <option>9:16</option>
                <option>16:9</option>
              </select>
            </Field>

            {activeTab === "MOTION_IMAGE" ? (
              <Field label="Prompt gerakan">
                <select value={motionPrompt} onChange={(e) => setMotionPrompt(e.target.value)} className="premium-input px-4 py-3">
                  <option>camera zoom with cinematic pan</option>
                  <option>product reveal with soft light sweep</option>
                  <option>talking scene with subtle head movement</option>
                  <option>cinematic pan with depth parallax</option>
                </select>
              </Field>
            ) : null}

            {activeTab === "AI_VIDEO" ? (
              null
            ) : null}
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Provider">
                <select value={provider} onChange={(e) => setProvider(e.target.value as AIProviderName)} className="premium-input px-4 py-3">
                  {providers.map((item) => (
                    <option key={item} value={item}>{providerLabels[item]}</option>
                  ))}
                </select>
              </Field>
              <Field label="Mode">
                <select value={mode} onChange={(e) => setMode(e.target.value as ProviderMode)} className="premium-input px-4 py-3">
                  <option value="DUMMY">Dummy Preview</option>
                  <option value="REAL">Real Provider</option>
                </select>
              </Field>
            </div>
            <Field label="Generate Type">
              <select value={activeTab} onChange={(e) => setActiveTab(e.target.value as CreativeType)} className="premium-input px-4 py-3">
                {tabs.map((tab) => <option key={tab.id} value={tab.id}>{tab.label}</option>)}
              </select>
            </Field>

            <button
              type="button"
              onClick={generate}
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-4 font-semibold text-white shadow-glow transition hover:bg-blue-500 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wand2 className="h-5 w-5" />}
              {mode === "REAL" ? "Generate Real Asset" : "Generate Preview"}
            </button>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">Provider status</p>
                  <p className="mt-1 text-slate-400">{providerLabels[provider]} - {mode === "REAL" ? "real provider request" : "preview only, no provider call"}</p>
                </div>
                <span className={clsx("rounded-full px-3 py-1 text-xs font-semibold", mode === "REAL" ? "bg-amber-300/15 text-amber-100" : "bg-teal-300/15 text-teal-100")}>
                  {job?.status ?? "Idle"}
                </span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${job?.progress ?? 0}%` }} />
              </div>
              {job?.errorMessage ? <ProviderErrorCard message={job.errorMessage} /> : null}
              {asset ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Saved to Content Library
                  </span>
                  <button type="button" onClick={generate} disabled={loading} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-white/10 disabled:opacity-60">
                    <RefreshCcw className="h-3.5 w-3.5" />
                    Retry generation
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="glass overflow-hidden rounded-2xl">
          <div className="relative min-h-[520px] bg-[#0E1728]">
            {asset ? (
              <>
                <img src={asset.thumbnail} alt="" className="absolute inset-0 h-full w-full object-cover opacity-45 mix-blend-luminosity" />
                {asset.type === "MOTION_IMAGE" ? <div className="absolute inset-0 animate-pulse bg-teal-300/10" /> : null}
                {asset.type === "AI_VIDEO" ? <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent)]" /> : null}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-6">
                  <div className="mb-3 inline-flex rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1 text-xs font-semibold text-teal-100">
                    {asset.type.replace("_", " ")} - {asset.status}
                  </div>
                  <div className="mb-3 flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-slate-100">{providerLabels[asset.provider ?? provider]}</span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-slate-100">{asset.model ?? "provider-default"}</span>
                    <span className={clsx("rounded-full px-3 py-1", asset.isDummy ? "bg-amber-300/20 text-amber-100" : "bg-teal-300/20 text-teal-100")}>{asset.isDummy ? "Dummy" : "Real"}</span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-slate-100">{(asset.generationType ?? asset.type).replace("_", " ")}</span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-slate-100">{asset.outputSource ?? "unknown source"}</span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-slate-100">{asset.generationStatus ?? asset.status}</span>
                  </div>
                  <h2 className="text-2xl font-semibold text-white">{asset.title}</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Original prompt: {asset.prompt}</p>
                  {asset.finalPrompt ? <p className="mt-1 line-clamp-3 max-w-2xl text-xs leading-5 text-slate-400">Final prompt sent: {asset.finalPrompt}</p> : null}
                  {asset.isDummy ? <p className="mt-3 text-sm font-semibold text-amber-200">Ini hasil dummy fallback, bukan output provider asli.{asset.warning ? ` ${asset.warning}` : ""}</p> : null}
                  {asset.relevanceWarning ? <p className="mt-2 text-xs text-slate-400">{asset.relevanceWarning}</p> : null}
                </div>
              </>
            ) : (
              <div className="grid min-h-[520px] place-items-center p-8 text-center">
                <div>
                  <Sparkles className="mx-auto mb-5 h-14 w-14 text-teal-300" />
                  <h2 className="text-2xl font-semibold text-white">No asset generated yet</h2>
                  <p className="mt-2 max-w-md text-slate-400">Choose a format, describe the result you need, then generate a preview or a real provider asset.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
      {message ? <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">{message}</div> : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">{label}</span>
      {children}
    </label>
  );
}

function ProviderErrorCard({ message }: { message: string }) {
  return (
    <div className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/[0.07] p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-amber-100"><AlertTriangle className="h-4 w-4" /> Provider fallback active</div>
      <p className="mt-2 text-xs leading-5 text-amber-100/80">{message}</p>
      <p className="mt-2 text-[11px] leading-5 text-slate-400">UI tetap aktif. Gunakan preview dummy atau coba ulang setelah provider dan database tersedia.</p>
    </div>
  );
}

function buildPrompt(context: StudioInsightContext) {
  return `Buat konten video pendek 15 detik tentang ${context.topic} untuk platform ${context.platform}.
Gunakan angle: ${context.recommendedContentAngle}
Hook: ${context.suggestedHook}
Caption: ${context.suggestedCaption}
${context.script ? `Script: ${context.script}` : ""}
Target audience: pemula.
CTA: ${context.cta ?? "ajak penonton follow atau klik link produk."}
Source insight: ${context.source}.`;
}
