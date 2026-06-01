import {
  BarChart3,
  Bot,
  BrainCircuit,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  MessageCircle,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Store,
  Video
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { WorkflowPanel } from "@/components/centers/center-ui";
import { DashboardPanel } from "@/components/dashboard/ui";
import { PageHeader, StatCard } from "@/components/studio-ui";

type AgentStatus = "Active" | "Idle" | "Need Setup";

const agents: Array<{ name: string; role: string; status: AgentStatus; lastRun: string; successRate: string; icon: LucideIcon }> = [
  { name: "CEO Agent", role: "Strategi, prioritas, dan keputusan konten.", status: "Active", lastRun: "12 min ago", successRate: "96%", icon: BrainCircuit },
  { name: "Research Agent", role: "Riset tren, keyword, niche, dan kompetitor.", status: "Active", lastRun: "24 min ago", successRate: "92%", icon: Search },
  { name: "Creator Agent", role: "Ide konten, script, hook, dan scene plan.", status: "Active", lastRun: "38 min ago", successRate: "94%", icon: Sparkles },
  { name: "Clipper Agent", role: "Deteksi hook, potong video, dan segmentasi.", status: "Idle", lastRun: "2 hours ago", successRate: "89%", icon: Video },
  { name: "Affiliate Agent", role: "Product hunter, campaign, dan komisi.", status: "Active", lastRun: "46 min ago", successRate: "91%", icon: Store },
  { name: "Policy Agent", role: "Cek originality, AI disclosure, dan safety policy.", status: "Active", lastRun: "18 min ago", successRate: "98%", icon: ShieldCheck },
  { name: "Publishing Agent", role: "Metadata, export, dan jadwal posting.", status: "Need Setup", lastRun: "Not configured", successRate: "-", icon: Send },
  { name: "Analytics Agent", role: "Membaca performa dan membuat rekomendasi.", status: "Idle", lastRun: "3 hours ago", successRate: "93%", icon: BarChart3 }
];

const activities = [
  ["Research Agent", "Scored 28 rising keywords for affiliate short-form content.", "12 min ago"],
  ["Policy Agent", "Completed originality review for Podcast Shorts Batch #08.", "18 min ago"],
  ["Creator Agent", "Generated three hooks and scene plans for Product Campaign #04.", "38 min ago"],
  ["CEO Agent", "Updated priority queue based on conversion opportunity score.", "52 min ago"]
];

function statusTone(status: AgentStatus) {
  if (status === "Active") return "border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-200";
  if (status === "Need Setup") return "border-amber-300/20 bg-amber-300/[0.08] text-amber-200";
  return "border-slate-300/10 bg-white/[0.035] text-slate-400";
}

function AgentCard({ agent }: { agent: (typeof agents)[number] }) {
  return (
    <article className="premium-panel rounded-2xl p-5 transition hover:border-cyan-300/20 hover:bg-cyan-300/[0.025]">
      <div className="flex items-start justify-between gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl border border-cyan-300/10 bg-cyan-300/[0.06] text-cyan-200"><agent.icon className="h-5 w-5" /></div>
        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${statusTone(agent.status)}`}>{agent.status}</span>
      </div>
      <h2 className="mt-5 font-semibold text-white">{agent.name}</h2>
      <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">{agent.role}</p>
      <div className="mt-4 grid grid-cols-2 gap-3 border-y border-white/[0.06] py-3">
        <div><div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">Last run</div><div className="mt-1 text-xs font-semibold text-slate-300">{agent.lastRun}</div></div>
        <div><div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">Success rate</div><div className="mt-1 text-xs font-semibold text-cyan-100">{agent.successRate}</div></div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" className="rounded-lg border border-cyan-300/15 bg-cyan-300/[0.06] px-3 py-2 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-300/[0.1]">Configure</button>
        <button type="button" className="rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.05]">View Logs</button>
      </div>
    </article>
  );
}

export function AIAgentsWorkspace() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Automation Control"
        title="AI Agents"
        subtitle="Manage specialized agents that research, create, review, publish, and analyze your content operations."
        description="Agent cards menggunakan clean dummy data. Configure dan log preview disiapkan sebagai UI foundation tanpa menjalankan workflow backend otomatis."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Agents" value="08" detail="Specialized automation roles" />
        <StatCard label="Active Agents" value="05" detail="Available for current workflows" />
        <StatCard label="Approval Needed" value="03" detail="Waiting for operator review" />
        <StatCard label="Average Success" value="93%" detail="Dummy operational rate" />
      </div>

      <DashboardPanel title="Agent Directory" description="Monitor status, responsibilities, and recent execution health for every agent.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {agents.map((agent) => <AgentCard key={agent.name} agent={agent} />)}
        </div>
      </DashboardPanel>

      <WorkflowPanel title="Agent Workflow" steps={["Research", "Create", "Review", "Approve", "Publish", "Analyze"]} />

      <div className="grid gap-6 2xl:grid-cols-[1.35fr_1fr]">
        <DashboardPanel title="Recent Agent Activity" description="Latest dummy agent execution records.">
          <div className="space-y-2.5">
            {activities.map(([agent, activity, time]) => (
              <div key={`${agent}-${time}`} className="flex gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-cyan-300/[0.07] text-cyan-200"><Bot className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-slate-200">{agent}</div>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{activity}</p>
                </div>
                <span className="shrink-0 text-[10px] text-slate-600">{time}</span>
              </div>
            ))}
          </div>
        </DashboardPanel>

        <DashboardPanel title="Approval Needed" description="Operator review queue before agent workflow continues.">
          <div className="space-y-2.5">
            {[
              ["Product Campaign #04", "Creator Agent", "Hook and CTA review"],
              ["Podcast Shorts Batch #08", "Publishing Agent", "Export bundle approval"],
              ["Workspace Tools Listicle", "Policy Agent", "AI disclosure review"]
            ].map(([title, agent, note]) => (
              <div key={title} className="rounded-xl border border-amber-300/10 bg-amber-300/[0.035] p-3">
                <div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold text-slate-200">{title}</span><ClipboardCheck className="h-4 w-4 text-amber-200" /></div>
                <p className="mt-1 text-[11px] text-slate-500">{agent} · {note}</p>
              </div>
            ))}
          </div>
        </DashboardPanel>
      </div>

      <DashboardPanel title="Telegram Approval Preview" description="UI-only Telegram approval card. No real message is sent.">
        <div className="flex flex-col gap-4 rounded-xl border border-cyan-300/10 bg-cyan-300/[0.04] p-4 md:flex-row md:items-center">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-cyan-300/10 text-cyan-200"><MessageCircle className="h-5 w-5" /></div>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200"><CheckCircle2 className="h-4 w-4 text-emerald-300" /> Podcast Shorts Batch #08</div>
            <p className="mt-1 text-xs leading-5 text-slate-500">Policy Agent completed originality review. Approve export bundle before Publishing Agent continues.</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="rounded-lg border border-emerald-300/20 bg-emerald-300/[0.08] px-3 py-2 text-xs font-semibold text-emerald-200">Approve Preview</button>
            <button type="button" className="rounded-lg border border-white/[0.08] bg-white/[0.035] px-3 py-2 text-xs font-semibold text-slate-300">View Detail</button>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-600"><Clock3 className="h-3.5 w-3.5" /> Approval controls are placeholders for a future backend workflow.</div>
      </DashboardPanel>
    </div>
  );
}
