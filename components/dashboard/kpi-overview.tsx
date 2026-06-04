import { AlertTriangle, CheckCircle2, FileText, Lightbulb, Video } from "lucide-react";
import type { DashboardSummary } from "@/components/dashboard/types";

export function KPIOverview({ summary }: { summary: DashboardSummary }) {
  const kpis = [
    { label: "Ideas Generated", value: Math.max(24, summary.recommendationsReady), change: "+18% this week", icon: Lightbulb, tone: "text-cyan-200 bg-cyan-300/10" },
    { label: "Scripts Ready", value: Math.max(12, summary.approvalQueue), change: "4 new today", icon: FileText, tone: "text-blue-200 bg-blue-300/10" },
    { label: "Videos Need Review", value: summary.reviewQueue, change: "Review queue", icon: Video, tone: "text-violet-200 bg-violet-300/10" },
    { label: "Ready to Publish", value: summary.scheduledContent, change: `${summary.scheduledToday} scheduled today`, icon: CheckCircle2, tone: "text-emerald-200 bg-emerald-300/10" },
    { label: "Policy Warning", value: summary.providerWarnings, change: summary.providerWarnings ? "Needs attention" : "All clear", icon: AlertTriangle, tone: "text-amber-200 bg-amber-300/10" }
  ];

  return (
    <section>
      <div className="mb-4"><h2 className="text-lg font-semibold text-white">Today&apos;s Overview</h2><p className="mt-1 text-sm text-slate-500">Ringkasan workflow konten hari ini.</p></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {kpis.map((kpi) => <article key={kpi.label} className="premium-panel h-full rounded-2xl p-4"><div className={`grid h-9 w-9 place-items-center rounded-xl ${kpi.tone}`}><kpi.icon className="h-4 w-4" /></div><div className="mt-4 text-2xl font-bold text-white">{kpi.value}</div><div className="mt-1 text-sm font-medium text-slate-300">{kpi.label}</div><div className="mt-2 text-xs text-slate-500">{kpi.change}</div></article>)}
      </div>
    </section>
  );
}
