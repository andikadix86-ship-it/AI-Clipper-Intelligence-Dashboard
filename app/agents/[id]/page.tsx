"use client";

import clsx from "clsx";
import { ArrowLeft, BrainCircuit, CheckCircle2, ClipboardList, FileClock, Lightbulb, Pause, Play, Settings2, TerminalSquare, Wand2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { AgentRecommendationDto, AgentTaskDto, AIAgentDto } from "@/lib/types";

type Tab = "overview" | "tasks" | "recommendations" | "logs" | "settings";

type AgentDetail = {
  agent: AIAgentDto;
  tasks: AgentTaskDto[];
  recommendations: AgentRecommendationDto[];
  logs: Array<{ id: string; message: string; detail: string; createdAt: string }>;
};

const tabs: Array<{ id: Tab; label: string; icon: typeof BrainCircuit }> = [
  { id: "overview", label: "Overview", icon: BrainCircuit },
  { id: "tasks", label: "Tasks", icon: ClipboardList },
  { id: "recommendations", label: "Recommendations", icon: Lightbulb },
  { id: "logs", label: "Logs", icon: TerminalSquare },
  { id: "settings", label: "Settings", icon: Settings2 }
];

const priorityClass = {
  HIGH: "border-rose-300/25 bg-rose-400/15 text-rose-100",
  MEDIUM: "border-amber-300/25 bg-amber-400/15 text-amber-100",
  LOW: "border-teal-300/25 bg-teal-300/15 text-teal-100"
};

export default function AgentDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [data, setData] = useState<AgentDetail | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [working, setWorking] = useState(false);

  const loadDetail = useCallback(async function loadDetail() {
    try {
      const response = await fetch(`/api/agents/${params.id}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Agent detail gagal dimuat.");
      setData(payload);
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Agent detail gagal dimuat." });
    }
  }, [params.id]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  async function runAgent() {
    setWorking(true);
    try {
      const response = await fetch(`/api/agents/${params.id}/run`, { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Run agent gagal.");
      setToast({ type: "success", message: `Task selesai: ${payload.task.title}` });
      await loadDetail();
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Run agent gagal." });
    } finally {
      setWorking(false);
    }
  }

  async function toggleAgent() {
    setWorking(true);
    try {
      const response = await fetch(`/api/agents/${params.id}/toggle`, { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Toggle agent gagal.");
      setData((current) => current ? { ...current, agent: payload.agent } : current);
      setToast({ type: "success", message: `${payload.agent.name} is now ${payload.agent.statusLabel}.` });
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Toggle agent gagal." });
    } finally {
      setWorking(false);
    }
  }

  async function createContent(recommendation: AgentRecommendationDto) {
    setWorking(true);
    try {
      const response = await fetch(`/api/agents/recommendations/${recommendation.id}/create-content`, { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Create content from recommendation gagal.");
      setToast({ type: "success", message: `Content Draft created: ${payload.item.title}` });
      await loadDetail();
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Create content from recommendation gagal." });
    } finally {
      setWorking(false);
    }
  }

  if (!data) return <div className="glass rounded-2xl p-6 text-slate-300">Loading agent detail...</div>;

  return (
    <div className="space-y-6">
      {toast ? <Toast {...toast} onClose={() => setToast(null)} /> : null}
      <Link href="/agents" className="inline-flex items-center gap-2 text-sm font-semibold text-teal-200"><ArrowLeft className="h-4 w-4" />Back to AI Agents</Link>

      <section className="glass rounded-2xl p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1 text-sm text-teal-100">
              <BrainCircuit className="h-4 w-4" />
              {data.agent.roleLabel}
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">{data.agent.name}</h1>
            <p className="mt-3 max-w-3xl text-slate-300">{data.agent.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={working || data.agent.status === "DISABLED"} onClick={runAgent} className="inline-flex items-center gap-2 rounded-2xl bg-teal-300 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50"><Play className="h-4 w-4" />Run Agent</button>
            <button type="button" disabled={working || data.agent.status === "DISABLED"} onClick={toggleAgent} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"><Pause className="h-4 w-4" />{data.agent.status === "ACTIVE" ? "Pause" : "Activate"}</button>
          </div>
        </div>
      </section>

      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.04] p-2">
        {tabs.map((tab) => <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={clsx("inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold", activeTab === tab.id ? "bg-teal-300 text-slate-950" : "text-slate-300 hover:bg-white/[0.08]")}><tab.icon className="h-4 w-4" />{tab.label}</button>)}
      </div>

      {activeTab === "overview" ? <Overview data={data} /> : null}
      {activeTab === "tasks" ? <Tasks rows={data.tasks} /> : null}
      {activeTab === "recommendations" ? <Recommendations rows={data.recommendations} onCreateContent={createContent} working={working} /> : null}
      {activeTab === "logs" ? <Logs rows={data.logs} /> : null}
      {activeTab === "settings" ? <Settings agent={data.agent} /> : null}
    </div>
  );
}

function Overview({ data }: { data: AgentDetail }) {
  return <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Metric label="Status" value={data.agent.statusLabel} /><Metric label="Total Tasks" value={data.agent.totalTasks} /><Metric label="Success Rate" value={`${data.agent.successRate}%`} /><Metric label="Last Run" value={data.agent.lastRunAt ? new Date(data.agent.lastRunAt).toLocaleString("id-ID") : "Never"} /></section>;
}

function Tasks({ rows }: { rows: AgentTaskDto[] }) {
  if (!rows.length) return <Empty title="No tasks yet" detail="Click Run Agent to generate a dummy rule-based task." />;
  return <div className="grid gap-3">{rows.map((row) => <article key={row.id} className="glass rounded-2xl p-4"><div className="flex flex-wrap gap-2"><Badge>{row.taskTypeLabel}</Badge><Priority value={row.priority} /><Badge>{row.status}</Badge></div><h2 className="mt-3 text-lg font-semibold text-white">{row.title}</h2><p className="mt-2 text-sm text-slate-400">{row.description}</p><p className="mt-3 text-sm text-teal-100">{row.result}</p><div className="mt-3 text-xs text-slate-500">{row.project ?? "No project"} - {row.contentTitle ?? "No content"} - {new Date(row.createdAt).toLocaleString("id-ID")}</div></article>)}</div>;
}

function Recommendations({ rows, onCreateContent, working }: { rows: AgentRecommendationDto[]; onCreateContent: (row: AgentRecommendationDto) => void; working: boolean }) {
  if (!rows.length) return <Empty title="No recommendations yet" detail="Run this agent to create recommendation output." />;
  return <div className="grid gap-4 md:grid-cols-2">{rows.map((row) => <article key={row.id} className="glass rounded-2xl p-5"><div className="flex flex-wrap gap-2"><Priority value={row.priority} /><Badge>{row.recommendationType.replaceAll("_", " ")}</Badge><Badge>{row.status}</Badge></div><h2 className="mt-3 text-lg font-semibold text-white">{row.title}</h2><p className="mt-2 text-sm leading-6 text-slate-400">{row.description}</p><div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.08]"><div className="h-full rounded-full bg-teal-300" style={{ width: `${row.score}%` }} /></div><div className="mt-2 text-xs text-slate-500">Score {row.score}/100</div><button type="button" disabled={working || row.status === "CONVERTED"} onClick={() => onCreateContent(row)} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal-300 px-4 py-2 text-xs font-semibold text-slate-950 disabled:opacity-50"><Wand2 className="h-4 w-4" />{row.status === "CONVERTED" ? "Converted" : "Create Content from Recommendation"}</button></article>)}</div>;
}

function Logs({ rows }: { rows: AgentDetail["logs"] }) {
  if (!rows.length) return <Empty title="No logs yet" detail="Agent run logs appear after the first task completes." />;
  return <div className="glass rounded-2xl p-5"><div className="space-y-3">{rows.map((row) => <div key={row.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><div className="flex items-center gap-2 text-sm font-semibold text-white"><FileClock className="h-4 w-4 text-teal-200" />{row.message}</div><p className="mt-2 text-sm text-slate-400">{row.detail}</p><div className="mt-2 text-xs text-slate-500">{new Date(row.createdAt).toLocaleString("id-ID")}</div></div>)}</div></div>;
}

function Settings({ agent }: { agent: AIAgentDto }) {
  return <div className="glass rounded-2xl p-5"><h2 className="text-xl font-semibold text-white">Settings</h2><p className="mt-2 text-sm text-slate-400">Provider connection is intentionally disabled for this phase. This agent is ready for future OpenAI/Gemini wiring through Settings without exposing API keys.</p><div className="mt-4 grid gap-3 md:grid-cols-3"><Metric label="Role" value={agent.roleLabel} /><Metric label="Mode" value="Rule-based dummy" /><Metric label="Auto Posting" value="Disabled" /></div></div>;
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="glass rounded-2xl p-5"><div className="text-xs font-semibold uppercase text-slate-500">{label}</div><div className="mt-3 text-xl font-semibold text-white">{value}</div></div>;
}

function Priority({ value }: { value: AgentRecommendationDto["priority"] }) {
  return <span className={clsx("rounded-full border px-3 py-1 text-xs font-semibold", priorityClass[value])}>{value}</span>;
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-slate-200">{children}</span>;
}

function Empty({ title, detail }: { title: string; detail: string }) {
  return <div className="glass grid min-h-72 place-items-center rounded-2xl p-8 text-center"><div><CheckCircle2 className="mx-auto mb-4 h-10 w-10 text-teal-300" /><h2 className="text-xl font-semibold text-white">{title}</h2><p className="mt-2 max-w-md text-sm text-slate-400">{detail}</p></div></div>;
}

function Toast({ type, message, onClose }: { type: "success" | "error"; message: string; onClose: () => void }) {
  return <div className={`fixed right-4 top-4 z-50 max-w-sm rounded-2xl border p-4 text-sm shadow-glow ${type === "success" ? "border-teal-300/30 bg-teal-950 text-teal-50" : "border-rose-300/30 bg-rose-950 text-rose-50"}`}><div className="flex items-start justify-between gap-4"><span>{message}</span><button type="button" onClick={onClose} className="opacity-70 hover:opacity-100">Close</button></div></div>;
}
