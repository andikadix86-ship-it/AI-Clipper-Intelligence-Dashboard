import { AlertTriangle, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { DashboardPanel } from "@/components/dashboard/ui";

const guardrails = [
  { label: "Reused Content Risk", value: "Low", icon: ShieldCheck, color: "text-emerald-200" },
  { label: "Copyright Reminder", value: "Review source rights", icon: AlertTriangle, color: "text-amber-200" },
  { label: "AI Disclosure", value: "Recommended", icon: Sparkles, color: "text-violet-200" },
  { label: "Originality Score", value: "91 / 100", icon: CheckCircle2, color: "text-cyan-200" },
  { label: "Platform Safety", value: "Passed", icon: ShieldCheck, color: "text-blue-200" }
];

export function PolicyGuardrail() {
  return (
    <DashboardPanel title="Policy & Originality Guardrail" description="Dummy quality checks before clips move to publishing.">
      <div className="space-y-2.5">
        {guardrails.map((item) => <div key={item.label} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3"><item.icon className={`h-4 w-4 ${item.color}`} /><span className="flex-1 text-sm text-slate-400">{item.label}</span><span className="text-xs font-semibold text-slate-200">{item.value}</span></div>)}
      </div>
    </DashboardPanel>
  );
}
