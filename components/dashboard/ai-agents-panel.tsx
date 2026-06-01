import { ArrowRight, Bot, Circle } from "lucide-react";
import Link from "next/link";
import { DashboardPanel } from "@/components/dashboard/ui";

const fallbackAgents = [
  { name: "Content Strategist", status: "Active" },
  { name: "Script Writer", status: "Working" },
  { name: "Policy Checker", status: "Active" },
  { name: "Trend Analyst", status: "Waiting" }
];

export function AIAgentsPanel({ agents }: { agents: Array<{ name: string; status: string }> }) {
  const rows = (agents.length ? agents : fallbackAgents).slice(0, 6);
  return (
    <DashboardPanel title="AI Agents" description="Tim AI yang membantu menjalankan workflow studio." action={<Link href="/agents" className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-200 hover:text-cyan-100">Manage agents <ArrowRight className="h-3.5 w-3.5" /></Link>}>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {rows.map((agent) => <div key={agent.name} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3"><div className="grid h-9 w-9 place-items-center rounded-xl bg-violet-300/10 text-violet-200"><Bot className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold text-slate-200">{agent.name}</div><div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><Circle className={`h-2 w-2 fill-current ${agent.status === "Offline" ? "text-slate-600" : agent.status === "Waiting" ? "text-amber-300" : "text-emerald-300"}`} />{agent.status}</div></div></div>)}
      </div>
    </DashboardPanel>
  );
}
