import { AlertTriangle, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { DashboardPanel } from "@/components/dashboard/ui";

export function PolicyQualitySnapshot({ warningCount }: { warningCount: number }) {
  const items = [
    { label: "Policy compliance", value: warningCount ? "Needs review" : "Passed", icon: ShieldCheck, color: warningCount ? "text-amber-200" : "text-emerald-200" },
    { label: "Content quality score", value: "92 / 100", icon: Sparkles, color: "text-cyan-200" },
    { label: "Assets checked", value: "38 items", icon: CheckCircle2, color: "text-blue-200" },
    { label: "Warning detected", value: `${warningCount} warning`, icon: AlertTriangle, color: warningCount ? "text-amber-200" : "text-slate-400" }
  ];
  return <DashboardPanel title="Policy & Quality Snapshot" description="Pengecekan kualitas dan kesiapan publish."><div className="space-y-2.5">{items.map((item) => <div key={item.label} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3"><item.icon className={`h-4 w-4 ${item.color}`} /><span className="flex-1 text-sm text-slate-400">{item.label}</span><span className="text-xs font-semibold text-slate-200">{item.value}</span></div>)}</div></DashboardPanel>;
}
