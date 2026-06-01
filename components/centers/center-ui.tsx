import { Check, ChevronRight, Circle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { DashboardPanel } from "@/components/dashboard/ui";

export function WorkflowPanel({ title = "Workflow", steps }: { title?: string; steps: string[] }) {
  return <DashboardPanel title={title} description="Dummy operational flow prepared for backend integration."><div className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">{steps.map((step, index) => <div key={step} className="relative flex items-center gap-2 xl:block"><div className="flex min-h-[76px] flex-1 items-center gap-3 rounded-xl border border-cyan-300/15 bg-cyan-300/[0.045] p-3 xl:block"><div className="grid h-7 w-7 place-items-center rounded-full bg-cyan-300/15 text-cyan-100"><Check className="h-3.5 w-3.5" /></div><div className="mt-0 text-xs font-semibold text-slate-300 xl:mt-3">{step}</div></div>{index < steps.length - 1 ? <ChevronRight className="hidden h-4 w-4 text-slate-700 xl:absolute xl:-right-3 xl:top-8 xl:z-10 xl:block" /> : null}</div>)}</div></DashboardPanel>;
}

export function ModuleGrid({ title, description, items, columns = "xl:grid-cols-4" }: { title: string; description: string; items: Array<{ title: string; detail: string; icon: LucideIcon; metric?: string; tag?: string }>; columns?: string }) {
  return <DashboardPanel title={title} description={description}><div className={`grid gap-3 sm:grid-cols-2 ${columns}`}>{items.map((item) => <article key={item.title} className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4"><div className="flex items-start justify-between gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-300/[0.08] text-cyan-200"><item.icon className="h-4 w-4" /></div>{item.metric ? <span className="text-lg font-bold text-white">{item.metric}</span> : null}</div><h3 className="mt-4 text-sm font-semibold text-slate-200">{item.title}</h3><p className="mt-1.5 text-xs leading-5 text-slate-500">{item.detail}</p>{item.tag ? <div className="mt-3 inline-flex rounded-full border border-white/[0.07] bg-white/[0.035] px-2.5 py-1 text-[10px] font-semibold text-slate-400">{item.tag}</div> : null}</article>)}</div></DashboardPanel>;
}

export function StatusList({ title, description, items }: { title: string; description: string; items: Array<{ label: string; value: string; tone?: "success" | "warning" | "neutral" }> }) {
  return <DashboardPanel title={title} description={description}><div className="space-y-2.5">{items.map((item) => <div key={item.label} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3"><Circle className={`h-2.5 w-2.5 fill-current ${item.tone === "warning" ? "text-amber-300" : item.tone === "neutral" ? "text-slate-600" : "text-emerald-300"}`} /><span className="flex-1 text-sm text-slate-400">{item.label}</span><span className="text-xs font-semibold text-slate-200">{item.value}</span></div>)}</div></DashboardPanel>;
}

export function BarChartPanel({ title, description, items }: { title: string; description: string; items: Array<{ label: string; value: number; display: string }> }) {
  return <DashboardPanel title={title} description={description}><div className="space-y-4">{items.map((item) => <div key={item.label}><div className="mb-2 flex items-center justify-between gap-3"><span className="text-xs font-semibold text-slate-400">{item.label}</span><span className="text-xs font-bold text-cyan-100">{item.display}</span></div><div className="h-2 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-300" style={{ width: `${item.value}%` }} /></div></div>)}</div></DashboardPanel>;
}
