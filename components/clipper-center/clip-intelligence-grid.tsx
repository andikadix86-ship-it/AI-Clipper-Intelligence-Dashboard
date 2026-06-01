import { AudioLines, ChartNoAxesCombined, Eye, ScanSearch, Sparkles, Target } from "lucide-react";
import { DashboardPanel } from "@/components/dashboard/ui";

const intelligence = [
  { title: "Hook Detection", detail: "AI identifies scroll-stopping openings.", score: "94%", icon: ScanSearch, color: "text-cyan-200 bg-cyan-300/10" },
  { title: "Viral Moment Finder", detail: "Ranks quotable and high-energy segments.", score: "89%", icon: Sparkles, color: "text-violet-200 bg-violet-300/10" },
  { title: "Retention Pattern", detail: "Predicts attention peaks and drop-off risk.", score: "87%", icon: ChartNoAxesCombined, color: "text-blue-200 bg-blue-300/10" },
  { title: "Speaker Highlight", detail: "Finds strong delivery and key speakers.", score: "91%", icon: AudioLines, color: "text-emerald-200 bg-emerald-300/10" },
  { title: "Scene Change Detection", detail: "Detects visual transitions for clean edits.", score: "96%", icon: Eye, color: "text-amber-200 bg-amber-300/10" },
  { title: "Platform Fit Score", detail: "Matches clip structure to each platform.", score: "92%", icon: Target, color: "text-fuchsia-200 bg-fuchsia-300/10" }
];

export function ClipIntelligenceGrid({ analyzed }: { analyzed: boolean }) {
  return (
    <DashboardPanel title="AI Clip Intelligence" description="Dummy AI signals for hook strength, retention potential, and output quality." action={<span className={`rounded-full border px-3 py-1 text-xs font-semibold ${analyzed ? "border-emerald-300/15 bg-emerald-300/[0.06] text-emerald-100" : "border-white/[0.07] bg-white/[0.03] text-slate-500"}`}>{analyzed ? "Demo analysis ready" : "Waiting for source"}</span>}>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {intelligence.map((item) => <article key={item.title} className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4"><div className="flex items-start justify-between gap-3"><div className={`grid h-9 w-9 place-items-center rounded-xl ${item.color}`}><item.icon className="h-4 w-4" /></div><span className="text-lg font-bold text-white">{analyzed ? item.score : "--"}</span></div><h3 className="mt-4 text-sm font-semibold text-slate-200">{item.title}</h3><p className="mt-1.5 text-xs leading-5 text-slate-500">{item.detail}</p></article>)}
      </div>
    </DashboardPanel>
  );
}
