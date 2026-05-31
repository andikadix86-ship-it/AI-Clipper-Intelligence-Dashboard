"use client";

import clsx from "clsx";
import { Activity, BrainCircuit, CheckCircle2, Clock3, FileCheck2, Pause, Play, RefreshCcw, Settings2, ShieldCheck, UsersRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { AIAgentDto, AutomationPlanDto } from "@/lib/types";

const statusClass = {
  ACTIVE: "border-emerald-300/25 bg-emerald-400/15 text-emerald-100",
  PAUSED: "border-amber-300/25 bg-amber-400/15 text-amber-100",
  DISABLED: "border-rose-300/25 bg-rose-400/15 text-rose-100"
};

type CenterAgent = AIAgentDto & {
  operationalStatus: "Active" | "Working" | "Waiting" | "Error" | "Offline";
  lastActivity?: string;
  tasksCompleted: number;
  currentQueue: number;
  queue: { pending: number; running: number; completed: number; failed: number };
};

type AgentCenter = {
  agents: CenterAgent[];
  ceo: { projects: number; campaigns: number; pendingApproval: number; failedJobs: number; providerIssues: number; opportunities: number; automationPlans: number };
  logs: Array<{ id: string; timestamp: string; agent: string; action: string; status: string; message: string }>;
};

export default function AgentsPage() {
  const [agents, setAgents] = useState<CenterAgent[]>([]);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [plans, setPlans] = useState<AutomationPlanDto[]>([]);
  const [center, setCenter] = useState<AgentCenter | null>(null);

  useEffect(() => {
    loadAgents();
    loadPlans();
    const timer = window.setInterval(loadAgents, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  async function loadAgents() {
    try {
      const response = await fetch("/api/agents/center");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Agents gagal dimuat.");
      setAgents(data.agents ?? []);
      setCenter(data);
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Agents gagal dimuat." });
    }
  }

  async function loadPlans() {
    try {
      const response = await fetch("/api/automation-plans");
      const data = await response.json();
      if (response.ok) setPlans(data.plans ?? []);
    } catch {
      setPlans([]);
    }
  }

  async function runAgent(agent: AIAgentDto) {
    setWorkingId(agent.id);
    try {
      const response = await fetch(`/api/agents/${agent.id}/run`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Run agent gagal.");
      setToast({ type: "success", message: `${agent.name} completed: ${data.task.title}` });
      await loadAgents();
      await loadPlans();
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Run agent gagal." });
    } finally {
      setWorkingId(null);
    }
  }

  async function runCeoAgent() {
    setWorkingId("ceo");
    try {
      const response = await fetch("/api/agents/ceo/run", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Run CEO Agent gagal.");
      setToast({ type: "success", message: `CEO Agent created plan: ${data.plan.title}` });
      await loadAgents();
      await loadPlans();
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Run CEO Agent gagal." });
    } finally {
      setWorkingId(null);
    }
  }

  async function planAction(plan: AutomationPlanDto, action: "approve" | "reject" | "convert-to-content") {
    setWorkingId(plan.id);
    try {
      const response = await fetch(`/api/automation-plans/${plan.id}/${action}`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Automation plan action failed.");
      setToast({ type: "success", message: action === "convert-to-content" ? `Draft created: ${data.item.title}` : `Plan ${data.plan.statusLabel}.` });
      await loadPlans();
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Automation plan action failed." });
    } finally {
      setWorkingId(null);
    }
  }

  async function toggleAgent(agent: AIAgentDto) {
    setWorkingId(agent.id);
    try {
      const response = await fetch(`/api/agents/${agent.id}/toggle`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Toggle agent gagal.");
      await loadAgents();
      setToast({ type: "success", message: `${data.agent.name} is now ${data.agent.statusLabel}.` });
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Toggle agent gagal." });
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {toast ? <Toast {...toast} onClose={() => setToast(null)} /> : null}
      <header className="glass rounded-2xl p-6">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1 text-sm text-teal-100">
          <UsersRound className="h-4 w-4" />
          Multi-Agent Workflow
        </div>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">AI Team Center</h1>
            <p className="mt-3 max-w-3xl text-slate-300">Rule-based digital team for monitoring, research, content operations, scheduling, and publishing readiness.</p>
          </div>
          <button type="button" onClick={loadAgents} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-white"><RefreshCcw className="h-4 w-4" />Refresh</button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Summary label="Active Agents" value={agents.filter((agent) => agent.status === "ACTIVE").length} icon={Activity} />
        <Summary label="Total Tasks" value={agents.reduce((sum, agent) => sum + agent.totalTasks, 0)} icon={CheckCircle2} />
        <Summary label="Avg Success Rate" value={`${Math.round(agents.reduce((sum, agent) => sum + agent.successRate, 0) / Math.max(agents.length, 1))}%`} icon={ShieldCheck} />
        <Summary label="Latest Run" value={agents.find((agent) => agent.lastRunAt)?.name ?? "Not yet"} icon={Clock3} />
      </section>

      <section className="glass rounded-2xl p-5">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">CEO Agent Orchestrator</h2>
            <p className="mt-2 text-sm text-slate-400">Creates Automation Plans only. Admin approval is still required before content or scheduler handoff.</p>
          </div>
          <button type="button" disabled={workingId === "ceo"} onClick={runCeoAgent} className="inline-flex items-center gap-2 rounded-2xl bg-teal-300 px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60">
            <Play className="h-4 w-4" />
            Run CEO Agent
          </button>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {plans.slice(0, 6).map((plan) => (
            <div key={plan.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1 text-xs font-semibold text-teal-100">{plan.statusLabel}</span>
                <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-slate-200">{plan.priority}</span>
              </div>
              <h3 className="mt-3 font-semibold text-white">{plan.title}</h3>
              <p className="mt-2 line-clamp-3 text-sm text-slate-400">{plan.reason}</p>
              <div className="mt-3 text-xs text-slate-500">{plan.project ?? "No project"} - {plan.suggestedPlatformLabel} - {plan.suggestedPostingTime}</div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <button type="button" disabled={workingId === plan.id || plan.status === "APPROVED"} onClick={() => planAction(plan, "approve")} className="rounded-xl bg-teal-300 px-3 py-2 text-xs font-semibold text-slate-950 disabled:opacity-50">Approve</button>
                <button type="button" disabled={workingId === plan.id || plan.status === "REJECTED"} onClick={() => planAction(plan, "reject")} className="rounded-xl bg-rose-400/10 px-3 py-2 text-xs font-semibold text-rose-100 disabled:opacity-50">Reject</button>
                <button type="button" disabled={workingId === plan.id || plan.status === "REJECTED"} onClick={() => planAction(plan, "convert-to-content")} className="rounded-xl bg-white/[0.06] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">To Draft</button>
              </div>
            </div>
          ))}
          {!plans.length ? <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-400">Belum ada Automation Plan. Jalankan CEO Agent.</div> : null}
        </div>
      </section>

      <section className="glass rounded-2xl p-5">
        <h2 className="text-2xl font-semibold text-white">CEO Monitoring Dashboard</h2>
        <p className="mt-2 text-sm text-slate-400">Operational signals read from Prisma/Supabase.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
          {[
            ["Projects", center?.ceo.projects ?? 0],
            ["Campaigns", center?.ceo.campaigns ?? 0],
            ["Pending Approval", center?.ceo.pendingApproval ?? 0],
            ["Failed Jobs", center?.ceo.failedJobs ?? 0],
            ["Provider Issues", center?.ceo.providerIssues ?? 0],
            ["Top Opportunities", center?.ceo.opportunities ?? 0],
            ["Automation Plans", center?.ceo.automationPlans ?? 0]
          ].map(([label, value]) => <Mini key={label} label={String(label)} value={value} />)}
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {agents.map((agent) => (
          <article key={agent.id} className={clsx("glass rounded-2xl p-5", agent.role === "CEO" && "border-teal-300/30")}>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-white">
                <BrainCircuit className="h-6 w-6" />
              </div>
              <span className={clsx("rounded-full border px-3 py-1 text-xs font-semibold", operationalClass(agent.operationalStatus))}>{agent.operationalStatus}</span>
            </div>
            <h2 className="text-xl font-semibold text-white">{agent.name}</h2>
            {agent.role === "CEO" ? <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-teal-300/10 px-3 py-1 text-xs font-semibold text-teal-100"><FileCheck2 className="h-3.5 w-3.5" />Orchestrator</div> : null}
            <p className="mt-2 min-h-20 text-sm leading-6 text-slate-400">{agent.description}</p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
              <Mini label="Last activity" value={agent.lastActivity ? new Date(agent.lastActivity).toLocaleDateString("id-ID") : "Never"} />
              <Mini label="Completed" value={agent.tasksCompleted} />
              <Mini label="Queue" value={agent.currentQueue} />
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              <button type="button" disabled={workingId === agent.id || agent.status === "DISABLED"} onClick={() => runAgent(agent)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-300 px-3 py-2 text-xs font-semibold text-slate-950 disabled:opacity-50">
                <Play className="h-4 w-4" />
                Run
              </button>
              <button type="button" disabled={workingId === agent.id || agent.status === "DISABLED"} onClick={() => toggleAgent(agent)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
                <Pause className="h-4 w-4" />
                {agent.status === "ACTIVE" ? "Pause" : "Activate"}
              </button>
              <Link href={`/agents/${agent.id}`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-white">
                <Settings2 className="h-4 w-4" />
                View Tasks
              </Link>
            </div>
          </article>
        ))}
      </section>

      {!agents.length ? <div className="glass grid min-h-72 place-items-center rounded-2xl p-8 text-center text-slate-300">Loading agent team...</div> : null}

      <section className="glass rounded-2xl p-5">
        <h2 className="text-2xl font-semibold text-white">Agent Activity Logs</h2>
        <p className="mt-2 text-sm text-slate-400">Timestamped operational log. Refresh manual atau otomatis setiap 60 detik.</p>
        <div className="mt-5 space-y-3">
          {(center?.logs ?? []).map((log) => <div key={log.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3"><div className="flex flex-wrap items-center gap-2 text-xs"><span className="font-semibold text-sky-200">{log.status}</span><span className="text-slate-500">{new Date(log.timestamp).toLocaleString("id-ID")}</span></div><div className="mt-2 text-sm font-semibold text-white">{log.message}</div><div className="mt-1 text-xs text-slate-500">{log.action}</div></div>)}
          {!center?.logs.length ? <p className="text-sm text-slate-400">Belum ada log agent. Jalankan salah satu agent untuk membuat activity log.</p> : null}
        </div>
      </section>
    </div>
  );
}

function operationalClass(status: CenterAgent["operationalStatus"]) {
  if (status === "Working") return "border-sky-300/25 bg-sky-400/15 text-sky-100";
  if (status === "Waiting") return "border-amber-300/25 bg-amber-400/15 text-amber-100";
  if (status === "Error") return "border-rose-300/25 bg-rose-400/15 text-rose-100";
  if (status === "Offline") return "border-slate-300/20 bg-slate-400/10 text-slate-300";
  return statusClass.ACTIVE;
}

function Summary({ label, value, icon: Icon }: { label: string; value: string | number; icon: typeof Activity }) {
  return <div className="glass rounded-2xl p-5"><Icon className="mb-4 h-5 w-5 text-teal-300" /><div className="text-2xl font-semibold text-white">{value}</div><div className="mt-1 text-xs text-slate-400">{label}</div></div>;
}

function Mini({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2"><div className="font-semibold text-white">{value}</div><div className="mt-1 text-slate-500">{label}</div></div>;
}

function Toast({ type, message, onClose }: { type: "success" | "error"; message: string; onClose: () => void }) {
  return <div className={`fixed right-4 top-4 z-50 max-w-sm rounded-2xl border p-4 text-sm shadow-glow ${type === "success" ? "border-teal-300/30 bg-teal-950 text-teal-50" : "border-rose-300/30 bg-rose-950 text-rose-50"}`}><div className="flex items-start justify-between gap-4"><span>{message}</span><button type="button" onClick={onClose} className="opacity-70 hover:opacity-100">Close</button></div></div>;
}
