import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Download,
  FileCheck2,
  FileText,
  ListChecks,
  MessageCircle,
  Send,
  ShieldCheck
} from "lucide-react";
import { ModuleGrid, WorkflowPanel } from "@/components/centers/center-ui";
import { DashboardPanel } from "@/components/dashboard/ui";
import { PageHeader, StatCard } from "@/components/studio-ui";
import { PublishingEnginePanel } from "@/components/centers/publishing-engine-panel";
import { TelegramApprovalQueue } from "@/components/centers/telegram-approval-queue";

const modules = [
  { title: "Content Queue", detail: "Review content entering the manual publishing workflow.", icon: ListChecks, metric: "38" },
  { title: "Ready To Publish", detail: "Approved content ready to export for manual posting.", icon: CheckCircle2, metric: "16" },
  { title: "Scheduled Content", detail: "Content prepared for planned publishing windows.", icon: CalendarClock, metric: "22" },
  { title: "Need Approval", detail: "Assets waiting for team or Telegram approval.", icon: MessageCircle, metric: "07" },
  { title: "Failed Publishing", detail: "Export bundles that require manual review.", icon: AlertTriangle, metric: "03" },
  { title: "Export Center", detail: "Download video and metadata bundles for each platform.", icon: Download, metric: "09" },
  { title: "Platform Metadata Preview", detail: "Validate captions, hashtags, and CTA before export.", icon: FileText, metric: "04" },
  { title: "Telegram Approval Preview", detail: "Preview the approval request sent to operators.", icon: Send, metric: "07" }
];

const queue = [
  { title: "Podcast Shorts Batch #08", platform: "YouTube Shorts", status: "Ready to Export", schedule: "Today, 19:00", approval: "Approved", metadata: "100%", policy: "Passed" },
  { title: "Ramadan Affiliate Product #04", platform: "TikTok", status: "Need Approval", schedule: "Tomorrow, 09:00", approval: "Pending Telegram", metadata: "92%", policy: "Passed" },
  { title: "AI UMKM Explainer", platform: "Instagram Reels", status: "Review", schedule: "Not scheduled", approval: "Waiting", metadata: "78%", policy: "Review" },
  { title: "Weekly Product Deep Dive", platform: "Facebook Reels", status: "Failed Export", schedule: "Retry required", approval: "Approved", metadata: "100%", policy: "Passed" }
];

const platformMetadata = [
  { platform: "YouTube Shorts", fields: "Title, description, hashtags, watch-next CTA", completeness: "100%" },
  { platform: "TikTok", fields: "Caption, hashtags, affiliate CTA, disclosure", completeness: "92%" },
  { platform: "Instagram Reels", fields: "Caption, hashtags, cover text, share CTA", completeness: "78%" },
  { platform: "Facebook Reels", fields: "Caption, page CTA, WhatsApp CTA, disclosure", completeness: "86%" }
];

function statusTone(value: string) {
  if (value === "Passed" || value === "Approved" || value === "Ready to Export") return "border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-200";
  if (value.includes("Failed") || value === "Review") return "border-amber-300/20 bg-amber-300/[0.08] text-amber-200";
  return "border-cyan-300/20 bg-cyan-300/[0.08] text-cyan-100";
}

function StatusBadge({ value }: { value: string }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-semibold ${statusTone(value)}`}>{value}</span>;
}

export function PublishingCenterWorkspace() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Publishing Operations"
        title="Publishing Center"
        subtitle="Prepare content for multi-platform publishing with approval, metadata validation, and manual export."
        description="MVP ini berfokus pada export video dan metadata untuk posting manual. Tidak ada auto-post real yang dijalankan."
        action={{ label: "Open Publishing Queue", href: "/publishing" }}
      />
      <PublishingEnginePanel />
      <TelegramApprovalQueue />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Content Queue" value="38" detail="Assets in review workflow" />
        <StatCard label="Ready To Publish" value="16" detail="Approved for manual export" />
        <StatCard label="Need Approval" value="07" detail="Waiting for operator decision" />
        <StatCard label="Export Bundles" value="09" detail="Video and metadata packages" />
      </div>

      <ModuleGrid title="Publishing Modules" description="Operational tools for reviewing, approving, and exporting content." items={modules} columns="xl:grid-cols-4" />
      <WorkflowPanel title="Publishing Workflow" steps={["Review", "Approve", "Schedule", "Export", "Publish", "Track"]} />

      <DashboardPanel title="Content Queue" description="Dummy content records prepared for future publishing integrations.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="text-[10px] uppercase tracking-[0.16em] text-slate-600">
              <tr>
                {["Title", "Platform", "Status", "Schedule Time", "Approval Status", "Metadata Completeness", "Policy Status"].map((label) => (
                  <th key={label} className="pb-3 pr-4 font-semibold">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {queue.map((item) => (
                <tr key={item.title} className="border-t border-white/[0.06]">
                  <td className="py-4 pr-4 font-semibold text-slate-200">{item.title}</td>
                  <td className="py-4 pr-4 text-slate-400">{item.platform}</td>
                  <td className="py-4 pr-4"><StatusBadge value={item.status} /></td>
                  <td className="py-4 pr-4 text-slate-400">{item.schedule}</td>
                  <td className="py-4 pr-4"><StatusBadge value={item.approval} /></td>
                  <td className="py-4 pr-4 font-semibold text-cyan-100">{item.metadata}</td>
                  <td className="py-4 pr-4"><StatusBadge value={item.policy} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardPanel>

      <div className="grid gap-6 2xl:grid-cols-[1.45fr_1fr]">
        <DashboardPanel title="Platform Metadata Preview" description="Review required metadata before creating manual export bundles.">
          <div className="grid gap-3 sm:grid-cols-2">
            {platformMetadata.map((item) => (
              <article key={item.platform} className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-200">{item.platform}</h3>
                  <span className="text-xs font-bold text-cyan-100">{item.completeness}</span>
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-500">{item.fields}</p>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-300" style={{ width: item.completeness }} />
                </div>
              </article>
            ))}
          </div>
        </DashboardPanel>

        <DashboardPanel title="Telegram Approval Preview" description="UI-only approval card for operator review.">
          <div className="rounded-xl border border-cyan-300/10 bg-cyan-300/[0.04] p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-300/10 text-cyan-200"><Send className="h-4 w-4" /></div>
              <div>
                <div className="text-sm font-semibold text-slate-200">Ramadan Affiliate Product #04</div>
                <div className="mt-1 text-xs text-slate-500">TikTok · 00:38 · Policy passed</div>
              </div>
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-400">Approval request preview: hook score 91%, metadata 92%, affiliate disclosure included.</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" disabled title="Preview only. Gunakan Approval Queue untuk aksi operasional." className="cursor-not-allowed rounded-lg border border-emerald-300/20 bg-emerald-300/[0.08] px-3 py-2 text-xs font-semibold text-emerald-200 opacity-60">Approve Preview Only</button>
              <button type="button" disabled title="Preview only. Gunakan Approval Queue untuk aksi operasional." className="cursor-not-allowed rounded-lg border border-white/[0.08] bg-white/[0.035] px-3 py-2 text-xs font-semibold text-slate-300 opacity-60">Revision Preview Only</button>
            </div>
          </div>
        </DashboardPanel>
      </div>

      <DashboardPanel title="Export Center" description="Manual posting mode is active for the MVP.">
        <div className="flex flex-col gap-4 rounded-xl border border-blue-300/10 bg-blue-300/[0.04] p-4 md:flex-row md:items-center">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-300/10 text-blue-200"><Download className="h-5 w-5" /></div>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200"><FileCheck2 className="h-4 w-4 text-emerald-300" /> Export video + metadata bundle</div>
            <p className="mt-1 text-xs leading-5 text-slate-500">Auto-post belum diaktifkan. Operator mengunduh bundle final dan melakukan posting manual setelah approval dan policy check selesai.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/[0.06] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-200"><ShieldCheck className="h-3.5 w-3.5" /> Manual mode</div>
        </div>
      </DashboardPanel>
    </div>
  );
}
