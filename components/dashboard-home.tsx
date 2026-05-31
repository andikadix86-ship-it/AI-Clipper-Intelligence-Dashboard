"use client";

import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CalendarClock,
  CheckCircle2,
  Clapperboard,
  DollarSign,
  FileCheck2,
  Flame,
  PackageSearch,
  Palette,
  Rocket,
  Search,
  Send,
  Share2,
  Sparkles,
  TrendingUp,
  UsersRound,
  Wand2
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useWorkspaceMode } from "@/components/workspace-mode";
import { demoAffiliateProductInsights } from "@/lib/intelligence/products";

type Tone = "success" | "info" | "waiting" | "review" | "danger" | "neutral";

const toneClasses: Record<Tone, string> = {
  success: "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
  info: "border-sky-300/20 bg-sky-300/10 text-sky-100",
  waiting: "border-amber-300/20 bg-amber-300/10 text-amber-100",
  review: "border-orange-300/20 bg-orange-300/10 text-orange-100",
  danger: "border-rose-300/20 bg-rose-300/10 text-rose-100",
  neutral: "border-white/10 bg-white/[0.06] text-slate-300"
};

export function DashboardHome() {
  const { mode } = useWorkspaceMode();
  return mode === "creator" ? <CreatorDashboard /> : <AffiliateDashboard />;
}

function CreatorDashboard() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
  const { summary, summaryWarning } = useDashboardSummary();
  const operations = [
    { label: "Review Queue", value: String(summary.reviewQueue), detail: "Draft clips and creative assets", icon: FileCheck2, tone: "review" as Tone, action: "Review Now", href: "/library?status=DRAFT" },
    { label: "Approval Queue", value: String(summary.approvalQueue), detail: "Waiting for admin decision", icon: CheckCircle2, tone: "waiting" as Tone, action: "Approve Now", href: "/approval" },
    { label: "Scheduled Today", value: String(summary.scheduledToday), detail: "Ready across active social accounts", icon: CalendarClock, tone: "info" as Tone, action: "Open Schedule", href: "/schedule" },
    { label: "Failed Posting", value: String(summary.failedPosting), detail: "Manual retry recommended", icon: AlertTriangle, tone: "danger" as Tone, action: "Retry Failed", href: "/publishing?status=failed" }
  ];
  const trends = [
    ["AI automation workflow", "94", "TikTok"],
    ["Faceless content system", "89", "YouTube"],
    ["Productivity prompt stack", "86", "Google Trends"],
    ["Creator burnout solution", "81", "Reddit"]
  ];
  const pipeline = [["Draft", summary.reviewQueue, "review"], ["Approval", summary.approvalQueue, "waiting"], ["Scheduled", summary.scheduledContent, "info"], ["Published", summary.publishedContent, "success"]] as const;
  return (
    <div className="space-y-8">
      <Hero eyebrow="Creator Action Center" title={`${greeting}, Andika`} description="Prioritaskan review, approval, dan publikasi hari ini. Workflow penting dapat dibuka dalam satu klik." actions={[
        { label: "Generate Clip", href: "/clipper", icon: Clapperboard },
        { label: "Create Visual", href: "/creative-studio", icon: Palette },
        { label: "Review Content", href: "/library", icon: CheckCircle2 }
      ]} />
      <Section title="What needs your attention?" subtitle="Mulai dari antrean dengan dampak tertinggi.">
        {summaryWarning ? <p className="mb-4 rounded-lg border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-sm text-amber-100">{summaryWarning}</p> : null}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{operations.map((item) => <ActionCard key={item.label} {...item} />)}</div>
      </Section>
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Section title="Trending Alert" subtitle="Sample signals. Buka Trending Center untuk metadata sumber dan confidence.">
          <div className="space-y-2">{trends.map(([topic, score, source]) => <TrendRow key={topic} title={topic} score={score} source={source} />)}</div>
          <LinkButton href="/trending-center" label="Explore Trending Center" />
        </Section>
        <Section title="AI Team Status" subtitle="Agent yang mendampingi workflow creator.">
          <AgentGrid agents={agentGrid(summary.aiTeam)} />
          <LinkButton href="/agents" label="Open AI Team" />
        </Section>
      </div>
      <Section title="Today's Pipeline" subtitle="Alur konten aktif dari riset sampai publish.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{pipeline.map(([label, value, tone]) => <PipelineCard key={label} label={label} value={value} tone={tone} />)}</div>
      </Section>
      <Section title="Notification Summary" subtitle="Inbox workflow real dari database.">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <PipelineCard label="Unread" value={summary.unreadNotifications} tone="info" />
          <PipelineCard label="Approval Pending" value={summary.approvalQueue} tone="waiting" />
          <PipelineCard label="Provider Warning" value={summary.providerWarnings} tone="danger" />
          <PipelineCard label="Recommendation Ready" value={summary.recommendationsReady} tone="success" />
        </div>
      </Section>
      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Section title="Quick Start" subtitle="Shortcut pekerjaan utama.">
          <div className="grid gap-3 sm:grid-cols-2">
            <Shortcut href="/projects" label="Create Project" icon={Sparkles} />
            <Shortcut href="/trending-center" label="Find Trend" icon={Search} />
            <Shortcut href="/clipper" label="Generate Clip" icon={Clapperboard} />
            <Shortcut href="/publishing" label="Publish Content" icon={Send} />
          </div>
        </Section>
        <Section title="Recent Activity" subtitle="Aktivitas terbaru dari sistem dan tim.">
          <ActivityList items={summary.recentActivities.length ? summary.recentActivities : ["Belum ada aktivitas. Mulai dari membuat project atau menjalankan agent."]} />
        </Section>
      </div>
    </div>
  );
}

function AffiliateDashboard() {
  const { summary } = useDashboardSummary();
  const actions = [
    { label: "Produk Trending", value: "24", detail: "8 produk naik cepat hari ini", icon: Flame, tone: "review" as Tone, action: "Cari Produk", href: "/trending-center" },
    { label: "Konten Siap Posting", value: "16", detail: "Caption dan asset sudah siap", icon: Send, tone: "success" as Tone, action: "Posting Sekarang", href: "/publishing" },
    { label: "Jadwal Hari Ini", value: "11", detail: "Across TikTok and Reels", icon: CalendarClock, tone: "info" as Tone, action: "Open Schedule", href: "/schedule" },
    { label: "Estimasi Komisi Bulan Ini", value: "Rp 8,4 jt", detail: "Demo estimate - platform belum terhubung", icon: DollarSign, tone: "waiting" as Tone, action: "View Analytics", href: "/analytics" },
    { label: "Followers Growth", value: "+1.248", detail: "Demo insight - 30 hari terakhir", icon: UsersRound, tone: "success" as Tone, action: "View Channels", href: "/analytics" }
  ];
  const products = demoAffiliateProductInsights;
  return (
    <div className="space-y-8">
      <Hero eyebrow="Affiliate Intelligence OS" title="Affiliate Command Center" description="Temukan produk potensial, siapkan konten, dan fokus pada campaign yang paling cepat menghasilkan komisi." actions={[
        { label: "Cari Produk", href: "/trending-center", icon: PackageSearch },
        { label: "Buat Konten", href: "/creative-studio", icon: Wand2 },
        { label: "Posting Sekarang", href: "/publishing", icon: Rocket }
      ]} />
      <div className="rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm leading-6 text-amber-100">
        Demo workspace: insight produk, estimasi komisi, dan growth masih berupa sample data sampai koneksi marketplace affiliate diaktifkan.
      </div>
      <Section title="Today's Affiliate Actions" subtitle="Pilih tindakan berikutnya berdasarkan peluang dan antrean.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">{actions.map((item) => <ActionCard key={item.label} {...item} />)}</div>
      </Section>
      <Section title="Notification Summary" subtitle="Workflow inbox untuk campaign dan publishing.">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <PipelineCard label="Unread" value={summary.unreadNotifications} tone="info" />
          <PipelineCard label="Approval Pending" value={summary.approvalQueue} tone="waiting" />
          <PipelineCard label="Provider Warning" value={summary.providerWarnings} tone="danger" />
          <PipelineCard label="Recommendation Ready" value={summary.recommendationsReady} tone="success" />
        </div>
      </Section>
      <Section title="Winning Products" subtitle="Demo insights produk dengan momentum terbaik untuk eksplorasi campaign affiliate.">
        <p className="mb-3 text-xs text-slate-500 md:hidden">Geser tabel ke samping untuk melihat seluruh detail produk.</p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.12em] text-slate-500"><tr>{["Product", "Trend", "Competition", "Est. Commission", "Source", "Status"].map((label) => <th key={label} className="px-4 py-3">{label}</th>)}</tr></thead>
            <tbody>{products.map((product) => <tr key={product.id} className="border-t border-white/10"><td className="px-4 py-4"><div className="font-semibold text-white">{product.productName}</div><div className="mt-1 text-xs text-amber-100">Demo insight - {product.confidence}% confidence</div></td><td className="px-4 py-4 text-teal-200">{product.trendScore}</td><td className="px-4 py-4 text-slate-300">{product.competitionLevel}</td><td className="px-4 py-4 text-slate-300">{product.commissionEstimate}</td><td className="px-4 py-4 text-slate-400">{product.source}</td><td className="px-4 py-4"><StatusBadge tone="waiting">Demo</StatusBadge></td></tr>)}</tbody>
          </table>
        </div>
        <LinkButton href="/trending-center" label="Open Product Hunter" />
      </Section>
      <div className="grid gap-6 xl:grid-cols-3">
        <Section title="Content Factory Queue" subtitle="Asset affiliate yang siap diproses.">
          <StatList items={[["Scripts Ready", "12"], ["Videos Ready", "8"], ["Captions Ready", "17"], ["Need Approval", "5"]]} />
        </Section>
        <Section title="Commission Snapshot" subtitle="Demo estimate. Commission tracking belum terhubung ke platform affiliate.">
          <StatList items={[["Today", "Rp 428 rb"], ["This Week", "Rp 2,1 jt"], ["This Month", "Rp 8,4 jt"], ["Top Product", "Nuvo Family Soap"]]} />
        </Section>
        <Section title="Affiliate AI Team" subtitle="Agent untuk riset produk dan profit.">
          <AgentGrid agents={agentGrid(summary.aiTeam)} />
        </Section>
      </div>
    </div>
  );
}

type DashboardSummary = {
  reviewQueue: number;
  approvalQueue: number;
  scheduledToday: number;
  failedPosting: number;
  publishedContent: number;
  scheduledContent: number;
  aiTeam: Array<{ name: string; status: string }>;
  recentActivities: string[];
  unreadNotifications: number;
  providerWarnings: number;
  recommendationsReady: number;
};

function useDashboardSummary() {
  const [summary, setSummary] = useState<DashboardSummary>({ reviewQueue: 0, approvalQueue: 0, scheduledToday: 0, failedPosting: 0, publishedContent: 0, scheduledContent: 0, aiTeam: [], recentActivities: [], unreadNotifications: 0, providerWarnings: 0, recommendationsReady: 0 });
  const [summaryWarning, setSummaryWarning] = useState("");
  useEffect(() => {
    const load = () => fetch("/api/dashboard/operations")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Dashboard summary gagal dimuat.");
        setSummary({ ...data.operations, ...data.analytics, ...data.notifications, aiTeam: data.aiTeam ?? [], recentActivities: data.recentActivities ?? [] });
      })
      .catch((error) => setSummaryWarning(error instanceof Error ? error.message : "Dashboard summary gagal dimuat."));
    load();
    const timer = window.setInterval(load, 60_000);
    return () => window.clearInterval(timer);
  }, []);
  return { summary, summaryWarning };
}

function agentGrid(rows: DashboardSummary["aiTeam"]): Array<[string, string, Tone]> {
  return (rows.length ? rows : [{ name: "CEO Agent", status: "Waiting" }]).slice(0, 6).map((agent) => [
    agent.name,
    agent.status,
    agent.status === "Working" ? "info" : agent.status === "Waiting" ? "waiting" : agent.status === "Offline" ? "neutral" : "success"
  ]);
}

function Hero({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description: string; actions: Array<{ label: string; href: string; icon: LucideIcon }> }) {
  return <section className="glass rounded-xl p-6 md:p-8"><div className="max-w-3xl"><div className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-200">{eyebrow}</div><h1 className="mt-3 text-3xl font-semibold text-white md:text-5xl">{title}</h1><p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">{description}</p></div><div className="mt-6 flex flex-wrap gap-3">{actions.map((action, index) => <Link key={action.label} href={action.href} className={`inline-flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition ${index === 0 ? "bg-primary text-white hover:bg-blue-500" : "border border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08]"}`}><action.icon className="h-4 w-4" />{action.label}</Link>)}</div></section>;
}
function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) { return <section className="glass rounded-xl p-5 md:p-6"><h2 className="text-xl font-semibold text-white">{title}</h2><p className="mt-1.5 text-sm text-slate-400">{subtitle}</p><div className="mt-6">{children}</div></section>; }
function ActionCard({ label, value, detail, icon: Icon, tone, action, href }: { label: string; value: string; detail: string; icon: LucideIcon; tone: Tone; action: string; href: string }) { return <article className="rounded-xl border border-white/10 bg-white/[0.04] p-4"><div className="flex items-start justify-between gap-3"><Icon className="h-5 w-5 text-teal-200" /><StatusBadge tone={tone}>{label}</StatusBadge></div><div className="mt-5 text-3xl font-semibold text-white">{value}</div><p className="mt-2 min-h-10 text-sm leading-5 text-slate-400">{detail}</p><Link href={href} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-teal-200 hover:text-teal-100">{action}<ArrowRight className="h-4 w-4" /></Link></article>; }
function StatusBadge({ tone, children }: { tone: Tone; children: React.ReactNode }) { return <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClasses[tone]}`}>{children}</span>; }
function TrendRow({ title, score, source }: { title: string; score: string; source: string }) { return <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3"><div><div className="font-semibold text-white">{title}</div><div className="mt-1 text-xs text-slate-500">{source}</div></div><div className="text-lg font-semibold text-teal-200">{score}</div></div>; }
function AgentGrid({ agents }: { agents: Array<[string, string, Tone]> }) { return <div className="grid gap-2 sm:grid-cols-2">{agents.map(([name, status, tone]) => <div key={name} className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-3"><div className="flex items-center gap-2 text-sm font-semibold text-white"><Bot className="h-4 w-4 text-teal-200" />{name}</div><StatusBadge tone={tone}>{status}</StatusBadge></div>)}</div>; }
function PipelineCard({ label, value, tone }: { label: string; value: number; tone: Tone }) { return <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4"><StatusBadge tone={tone}>{label}</StatusBadge><div className="mt-4 text-3xl font-semibold text-white">{value}</div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full ${tone === "success" ? "bg-emerald-300" : tone === "info" ? "bg-sky-300" : tone === "review" ? "bg-orange-300" : "bg-amber-300"}`} style={{ width: `${Math.min(100, 22 + value * 3)}%` }} /></div></div>; }
function Shortcut({ href, label, icon: Icon }: { href: string; label: string; icon: LucideIcon }) { return <Link href={href} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm font-semibold text-white hover:border-teal-300/30 hover:bg-white/[0.07]"><Icon className="h-5 w-5 text-teal-200" />{label}<ArrowRight className="ml-auto h-4 w-4 text-slate-500" /></Link>; }
function ActivityList({ items }: { items: string[] }) { return <div className="space-y-3">{items.map((item) => <div key={item} className="flex gap-3 text-sm leading-6 text-slate-300"><div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-teal-300" />{item}</div>)}</div>; }
function StatList({ items }: { items: Array<[string, string]> }) { return <div className="space-y-2">{items.map(([label, value]) => <div key={label} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-3"><span className="text-sm text-slate-400">{label}</span><span className="text-sm font-semibold text-white">{value}</span></div>)}</div>; }
function LinkButton({ href, label }: { href: string; label: string }) { return <Link href={href} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-white hover:bg-white/[0.09]">{label}<ArrowRight className="h-4 w-4" /></Link>; }
