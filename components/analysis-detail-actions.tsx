"use client";

import { Loader2, Save, Send, Wand2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { studioHref } from "@/lib/intelligence/action-flow";

type AnalysisActionInput = {
  id: string;
  keyword: string;
  topic: string;
  mode: "creator" | "affiliate";
  summary: string;
  score: number;
  confidence: number;
  isDemo: boolean;
  platformRecommendation: string;
  sourceUrl?: string;
  recommendedAngles?: string[];
  recommendedHooks?: string[];
  notes?: string;
};

export function AnalysisDetailActions({ analysis }: { analysis: AnalysisActionInput }) {
  const [working, setWorking] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const studio = studioHref({
    topic: analysis.topic,
    keyword: analysis.keyword,
    source: "Data-Driven Analysis",
    sourceUrl: analysis.sourceUrl,
    score: analysis.score,
    confidence: analysis.confidence,
    platform: analysis.platformRecommendation,
    reason: analysis.summary,
    recommendedContentAngle: analysis.recommendedAngles?.[0] ?? analysis.summary,
    isDemo: analysis.isDemo,
    notes: analysis.notes ?? analysis.summary,
    suggestedHook: analysis.recommendedHooks?.[0] ?? `Perhatikan ini sebelum mencoba ${analysis.keyword}.`,
    suggestedCaption: `${analysis.topic}: validasi angle ini sebelum produksi.`,
    generationType: "AI_VIDEO"
  });

  async function create(kind: "opportunity" | "project" | "campaign") {
    setWorking(kind);
    setMessage("");
    try {
      const config = requestFor(kind, analysis);
      const response = await fetch(config.url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(config.body) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message ?? "Action gagal.");
      setMessage(config.success);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Action gagal.");
    } finally {
      setWorking(null);
    }
  }

  return <div className="rounded-xl border border-white/[0.06] bg-[#111A2E] p-5"><h2 className="text-lg font-semibold text-white">Next Action</h2><p className="mt-2 text-sm text-slate-400">Continue from the persisted analysis without losing its source context.</p><div className="mt-4 flex flex-wrap gap-2"><Link href={studio} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white"><Wand2 className="h-4 w-4" />Creative Studio</Link><ActionButton label="Save Opportunity" icon={<Save className="h-4 w-4" />} loading={working === "opportunity"} onClick={() => create("opportunity")} /><ActionButton label="Create Project" icon={<Send className="h-4 w-4" />} loading={working === "project"} onClick={() => create("project")} /><ActionButton label="Create Campaign" icon={<Send className="h-4 w-4" />} loading={working === "campaign"} onClick={() => create("campaign")} /></div>{message ? <div className="mt-4 rounded-lg border border-white/[0.08] p-3 text-sm text-slate-300">{message}</div> : null}</div>;
}

function ActionButton({ label, icon, loading, onClick }: { label: string; icon: React.ReactNode; loading: boolean; onClick: () => void }) {
  return <button type="button" disabled={loading} onClick={onClick} className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] px-3 py-2 text-xs font-semibold text-slate-200 disabled:opacity-50">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}{label}</button>;
}

function requestFor(kind: "opportunity" | "project" | "campaign", analysis: AnalysisActionInput) {
  if (kind === "project") return { url: "/api/projects", success: "Project draft berhasil dibuat.", body: { name: `${analysis.topic} Draft`, niche: analysis.keyword, category: "Data-Driven Analysis", targetAccounts: [], contentMode: "IMAGE_GENERATOR" } };
  if (kind === "campaign") return { url: "/api/affiliate/campaigns", success: "Campaign draft berhasil dibuat.", body: { campaignName: `${analysis.topic} Campaign`, productName: analysis.topic, platform: analysis.platformRecommendation, category: "Data-Driven Analysis", trendScore: analysis.score, competitionLevel: "Validate manually", commissionEstimate: "Validate manually", priceRange: "Validate manually", contentPotentialScore: analysis.score, source: "Data-Driven Analysis", sourceUrl: analysis.sourceUrl, notes: analysis.summary, isDemo: analysis.isDemo, metadata: { analysisId: analysis.id } } };
  return { url: "/api/affiliate/opportunities", success: "Opportunity berhasil disimpan.", body: { title: analysis.topic, type: analysis.mode === "affiliate" ? "affiliate_product" : "content_topic", source: "Data-Driven Analysis", sourceUrl: analysis.sourceUrl, platform: analysis.platformRecommendation, score: analysis.score, confidence: analysis.confidence, reason: analysis.summary, notes: analysis.notes ?? "", isDemo: analysis.isDemo, metadata: { analysisId: analysis.id } } };
}

