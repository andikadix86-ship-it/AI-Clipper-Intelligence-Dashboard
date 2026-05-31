"use client";

import { Loader2, Save, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { SocialPlatform } from "@/lib/types";

export function GenerateRecommendationButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/recommendations/generate", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Recommendation generation failed.");
      setMessage(`${data.recommendations.length} recommendations ready. Refresh to update the dashboard view.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Recommendation generation failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={generate}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-2xl bg-teal-300 px-4 py-3 text-sm font-semibold text-slate-950 shadow-glow disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        Generate Recommendation
      </button>
      <Link href="/ai-analysis" className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white">
        Send to AI Analysis
      </Link>
      {message ? <span className="text-sm text-slate-300">{message}</span> : null}
    </div>
  );
}

type SimilarIdea = {
  id: string;
  title: string;
  hook: string;
  caption: string;
  hashtag: string;
  cta: string;
  contentAngle: string;
  suggestedDuration: number;
  targetPlatform: SocialPlatform;
  viralScorePrediction: number;
  notes: string;
};

type SimilarReference = {
  id?: string;
  title: string;
  platform: SocialPlatform;
  projectId?: string;
  project: string;
  socialAccountId?: string;
  socialAccount: string;
  views: number;
  engagementRate: number;
  viralReason: string;
};

export function CreateSimilarContentButton({ contentItemId, recommendationTitle }: { contentItemId?: string; recommendationTitle: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [reference, setReference] = useState<SimilarReference | null>(null);
  const [ideas, setIdeas] = useState<SimilarIdea[]>([]);

  async function generate() {
    setOpen(true);
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/content/create-similar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentItemId, recommendationTitle })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Similar content generation failed.");
      setReference(data.reference);
      setIdeas(data.ideas);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Similar content generation failed.");
    } finally {
      setLoading(false);
    }
  }

  async function saveIdea(idea: SimilarIdea) {
    setSavingId(idea.id);
    setMessage(null);
    try {
      const response = await fetch("/api/content/save-similar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...idea,
          projectId: reference?.projectId,
          socialAccountId: reference?.socialAccountId,
          linkedFromContentId: reference?.id
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Similar content could not be saved.");
      setMessage(`${data.item.title} saved to Content Library as Draft.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Similar content could not be saved.");
    } finally {
      setSavingId(null);
    }
  }

  function updateIdea(id: string, patch: Partial<SimilarIdea>) {
    setIdeas((current) => current.map((idea) => (idea.id === id ? { ...idea, ...patch } : idea)));
  }

  return (
    <>
      <button type="button" onClick={generate} className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-white hover:bg-white/[0.1]">
        Create Similar Content
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 p-4">
          <div className="mx-auto my-8 max-w-6xl rounded-2xl border border-white/10 bg-slate-950 p-5 shadow-glow">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white">Create Similar Content</h2>
                <p className="mt-2 text-sm text-slate-400">Generate rule-based variations from the selected high-performing recommendation.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white">Close</button>
            </div>

            {reference ? (
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <Info label="Reference" value={reference.title} />
                <Info label="Project / Account" value={`${reference.project} - ${reference.socialAccount}`} />
                <Info label="Performance" value={`${reference.views} views - ${reference.engagementRate}% ER`} />
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:col-span-3">
                  <div className="text-xs font-semibold uppercase text-slate-500">Viral Reason</div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{reference.viralReason}</p>
                </div>
              </div>
            ) : null}

            {loading ? <div className="mt-8 rounded-2xl border border-white/10 p-6 text-slate-300">Generating similar ideas...</div> : null}
            {message ? <div className="mt-5 rounded-2xl border border-teal-300/20 bg-teal-300/10 p-4 text-sm text-teal-100">{message}</div> : null}

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {ideas.map((idea) => (
                <article key={idea.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span className="rounded-full bg-teal-300 px-3 py-1 text-xs font-semibold text-slate-950">Predicted {Math.round(idea.viralScorePrediction)}</span>
                    <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-slate-200">{idea.targetPlatform}</span>
                  </div>
                  <div className="grid gap-3">
                    <Field label="Title"><input value={idea.title} onChange={(e) => updateIdea(idea.id, { title: e.target.value })} className="premium-input px-4 py-3" /></Field>
                    <Field label="Hook"><textarea value={idea.hook} onChange={(e) => updateIdea(idea.id, { hook: e.target.value })} rows={2} className="premium-input px-4 py-3" /></Field>
                    <Field label="Caption"><textarea value={idea.caption} onChange={(e) => updateIdea(idea.id, { caption: e.target.value })} rows={2} className="premium-input px-4 py-3" /></Field>
                    <Field label="Hashtag"><input value={idea.hashtag} onChange={(e) => updateIdea(idea.id, { hashtag: e.target.value })} className="premium-input px-4 py-3" /></Field>
                    <Field label="CTA"><input value={idea.cta} onChange={(e) => updateIdea(idea.id, { cta: e.target.value })} className="premium-input px-4 py-3" /></Field>
                    <Field label="Notes"><textarea value={idea.notes} onChange={(e) => updateIdea(idea.id, { notes: e.target.value })} rows={2} className="premium-input px-4 py-3" /></Field>
                  </div>
                  <button type="button" disabled={savingId === idea.id} onClick={() => saveIdea(idea)} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-300 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60">
                    {savingId === idea.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save to Project
                  </button>
                </article>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-xs font-semibold uppercase text-slate-500">{label}</span>{children}</label>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><div className="text-xs font-semibold uppercase text-slate-500">{label}</div><div className="mt-2 text-sm font-semibold text-white">{value}</div></div>;
}
