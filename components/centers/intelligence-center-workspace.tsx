import { BarChart3, BrainCircuit, ChartNoAxesCombined, Flame, Lightbulb, Search, Target, TrendingDown, TrendingUp, Youtube } from "lucide-react";
import { ModuleGrid, WorkflowPanel } from "@/components/centers/center-ui";
import { DashboardPanel } from "@/components/dashboard/ui";
import { PageHeader, StatCard } from "@/components/studio-ui";

const trending = [
  { title: "Google Trends Intelligence", detail: "Search momentum and regional demand.", metric: "94", icon: TrendingUp },
  { title: "YouTube Trend Research", detail: "Video demand, format, and topic velocity.", metric: "89", icon: Youtube },
  { title: "TikTok Trend Research", detail: "Short-form hooks and fast-moving topics.", metric: "91", icon: Flame }
];
const creator = [
  { title: "Creator Pattern", detail: "Winning creator behavior and posting rhythm.", icon: BrainCircuit },
  { title: "Hook Pattern", detail: "Reusable opening structures that retain attention.", icon: Target },
  { title: "Viral Structure", detail: "Content sequence patterns across high performers.", icon: ChartNoAxesCombined }
];
const opportunities = [
  { title: "Niche Finder", detail: "Map underserved audience clusters.", icon: Target },
  { title: "Keyword Finder", detail: "Identify high-intent keywords and questions.", icon: Search },
  { title: "Content Gap Finder", detail: "Spot demand without enough quality content.", icon: Lightbulb }
];
const radar = [
  { title: "Rising", detail: "AI workflow for UMKM", metric: "+38%", icon: TrendingUp },
  { title: "Stable", detail: "Faceless productivity tips", metric: "+8%", icon: BarChart3 },
  { title: "Declining", detail: "Generic motivational quotes", metric: "-21%", icon: TrendingDown }
];

export function IntelligenceCenterWorkspace() {
  return <div className="space-y-6"><PageHeader eyebrow="System Intelligence Layer" title="Intelligence Center" subtitle="The strategic brain of FVN AI Studio for trend research, creator patterns, and opportunity discovery." description="Collect clean dummy signals, analyze patterns, score opportunities, and turn them into actionable recommendations for every content workflow." action={{ label: "Explore Live Research UI", href: "/trending-center" }} /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Signals Collected" value="8,420" detail="Dummy multi-source dataset" /><StatCard label="Opportunities" value="128" detail="Scored content gaps" /><StatCard label="Rising Topics" value="34" detail="Momentum detected" /><StatCard label="Recommendations" value="24" detail="Ready for production" /></div><WorkflowPanel title="Intelligence Workflow" steps={["Collect Data", "Analyze", "Score", "Recommend"]} /><ModuleGrid title="Trending Intelligence" description="Cross-platform trend signals for topic discovery." items={trending} columns="xl:grid-cols-3" /><div className="grid gap-6 2xl:grid-cols-2"><ModuleGrid title="Creator Intelligence" description="Pattern library for repeatable creator performance." items={creator} columns="xl:grid-cols-3" /><ModuleGrid title="Opportunity Finder" description="Find niches, keywords, and missing content angles." items={opportunities} columns="xl:grid-cols-3" /></div><DashboardPanel title="Trend Radar" description="Dummy topic movement grouped by current momentum."><div className="grid gap-3 md:grid-cols-3">{radar.map((item) => <article key={item.title} className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4"><div className="flex items-center justify-between gap-3"><item.icon className={`h-5 w-5 ${item.title === "Declining" ? "text-rose-300" : item.title === "Stable" ? "text-blue-300" : "text-emerald-300"}`} /><span className="font-bold text-white">{item.metric}</span></div><h3 className="mt-4 text-sm font-semibold text-slate-200">{item.title}</h3><p className="mt-1.5 text-xs text-slate-500">{item.detail}</p></article>)}</div></DashboardPanel></div>;
}
