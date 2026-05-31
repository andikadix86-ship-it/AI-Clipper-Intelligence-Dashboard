"use client";

/* eslint-disable @next/next/no-img-element */

import clsx from "clsx";
import { ArrowLeft, BarChart3, CalendarClock, Clapperboard, FileVideo, FolderKanban, ImageIcon, Library, Link2, Share2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type Tab = "overview" | "sources" | "clips" | "assets" | "library" | "scheduler" | "accounts" | "analytics";

type ProjectCenter = {
  project: { id: string; name: string; niche: string; category: string; targetAccounts: string[]; contentMode: string; status: string };
  stats: { totalVideoSources: number; totalClips: number; totalImages: number; totalAiVideos: number; totalScheduled: number; totalPosted: number };
  videoSources: Array<{ id: string; platform: string; url: string; title: string; thumbnail: string; clips: number; createdAt: string }>;
  generatedClips: Array<{ id: string; title: string; description: string; thumbnail: string; duration: number; viralScore: number; sourceTitle: string; createdAt: string }>;
  creativeAssets: Array<{ id: string; type: string; title: string; prompt: string; thumbnail: string; status: string; createdAt: string }>;
  contentItems: Array<{ id: string; type: string; title: string; status: string; thumbnail: string; platform: string; sourceType?: string; viralScorePrediction?: number; updatedAt: string }>;
  schedules: Array<{ id: string; title: string; socialAccount: string; platform: string; status: string; scheduledAt: string }>;
  socialAccounts: Array<{ id: string; name: string; platform: string; handle: string; status: string; scheduled: number }>;
  analytics: { isDummy?: boolean; views: string; engagement: string; topContent: string; topAccount: string; bestPostingTime: string };
  agentRecommendations: Array<{ id: string; agentName: string; contentTitle: string; title: string; description: string; recommendationType: string; priority: string; score: number; createdAt: string }>;
  recentActivity: string[];
};

const tabs: Array<{ id: Tab; label: string; icon: typeof FolderKanban }> = [
  { id: "overview", label: "Overview", icon: FolderKanban },
  { id: "sources", label: "Video Sources", icon: FileVideo },
  { id: "clips", label: "Generated Clips", icon: Clapperboard },
  { id: "assets", label: "Creative Assets", icon: ImageIcon },
  { id: "library", label: "Content Library", icon: Library },
  { id: "scheduler", label: "Scheduler", icon: CalendarClock },
  { id: "accounts", label: "Social Accounts", icon: Share2 },
  { id: "analytics", label: "Analytics", icon: BarChart3 }
];

const fallback: ProjectCenter = {
  project: { id: "fallback", name: "Creator Growth Engine", niche: "AI productivity for creators", category: "Education", targetAccounts: ["YouTube Shorts", "TikTok"], contentMode: "CLIPPER", status: "Active" },
  stats: { totalVideoSources: 4, totalClips: 18, totalImages: 9, totalAiVideos: 3, totalScheduled: 7, totalPosted: 42 },
  videoSources: [],
  generatedClips: [],
  creativeAssets: [],
  contentItems: [],
  schedules: [],
  socialAccounts: [],
  analytics: { isDummy: true, views: "1.92M", engagement: "14.8%", topContent: "The 30 Second AI Workflow", topAccount: "Fatih Shorts", bestPostingTime: "19:00-21:00 Asia/Jakarta" },
  agentRecommendations: [],
  recentActivity: ["Project loaded with realistic fallback data.", "No live records found yet.", "Generate content from Clipper or Creative Studio to populate this center."]
};

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [data, setData] = useState<ProjectCenter>(fallback);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/projects/${params.id}`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Project not found.");
        setData(payload);
      })
      .catch((error) => setToast(error instanceof Error ? error.message : "Project center gagal dimuat."));
  }, [params.id]);

  return (
    <div className="space-y-6">
      {toast ? <Toast message={toast} onClose={() => setToast(null)} /> : null}
      <Link href="/projects" className="inline-flex items-center gap-2 text-sm font-semibold text-teal-200">
        <ArrowLeft className="h-4 w-4" />
        Back to Projects
      </Link>

      <section className="glass rounded-2xl p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1 text-sm text-teal-100">
              <Sparkles className="h-4 w-4" />
              Project Detail Center
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">{data.project.name}</h1>
            <p className="mt-3 max-w-3xl text-slate-300">{data.project.niche} - {data.project.category} - {data.project.contentMode}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>{data.project.status}</Badge>
            {data.project.targetAccounts.map((target) => <Badge key={target}>{target}</Badge>)}
          </div>
        </div>
      </section>

      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.04] p-2">
        {tabs.map((tab) => (
          <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={clsx("inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition", activeTab === tab.id ? "bg-teal-300 text-slate-950" : "text-slate-300 hover:bg-white/[0.08]")}>
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" ? <Overview data={data} /> : null}
      {activeTab === "sources" ? <SourceGrid rows={data.videoSources} /> : null}
      {activeTab === "clips" ? <ClipGrid rows={data.generatedClips} /> : null}
      {activeTab === "assets" ? <AssetGrid rows={data.creativeAssets} /> : null}
      {activeTab === "library" ? <ContentGrid rows={data.contentItems} /> : null}
      {activeTab === "scheduler" ? <ScheduleList rows={data.schedules} /> : null}
      {activeTab === "accounts" ? <AccountList rows={data.socialAccounts} /> : null}
      {activeTab === "analytics" ? <Analytics data={data.analytics} /> : null}
    </div>
  );
}

function Overview({ data }: { data: ProjectCenter }) {
  const stats = [
    ["Video Sources", data.stats.totalVideoSources],
    ["Generated Clips", data.stats.totalClips],
    ["Images", data.stats.totalImages],
    ["AI Videos", data.stats.totalAiVideos],
    ["Scheduled", data.stats.totalScheduled],
    ["Posted", data.stats.totalPosted]
  ];
  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {stats.map(([label, value]) => <Metric key={label} label={String(label)} value={String(value)} />)}
      </div>
      <div className="glass rounded-2xl p-5">
        <h2 className="mb-4 text-xl font-semibold text-white">Recent Activity</h2>
        <div className="grid gap-3">
          {data.recentActivity.map((item) => <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">{item}</div>)}
        </div>
      </div>
      <div className="glass rounded-2xl p-5">
        <h2 className="mb-4 text-xl font-semibold text-white">Agent Recommendations</h2>
        {data.agentRecommendations.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {data.agentRecommendations.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex flex-wrap gap-2"><Badge>{item.agentName}</Badge><Badge>{item.priority}</Badge><Badge>Score {item.score}</Badge></div>
                <div className="mt-3 font-semibold text-white">{item.title}</div>
                <p className="mt-2 text-sm text-slate-400">{item.description}</p>
              </div>
            ))}
          </div>
        ) : <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-400">Belum ada rekomendasi agent untuk project ini. Jalankan agent dari menu AI Agents.</div>}
      </div>
    </section>
  );
}

function SourceGrid({ rows }: { rows: ProjectCenter["videoSources"] }) {
  if (!rows.length) return <Empty title="No video sources" detail="Load a source from Clipper Workflow and choose this Project." />;
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{rows.map((row) => <article key={row.id} className="glass rounded-2xl p-4"><img src={row.thumbnail} alt="" className="mb-4 aspect-video w-full rounded-xl object-cover opacity-75" /><Badge>{row.platform}</Badge><h2 className="mt-3 font-semibold text-white">{row.title}</h2><p className="mt-2 break-all text-sm text-slate-400">{row.url}</p><p className="mt-2 text-sm text-teal-100">{row.clips} clips generated</p></article>)}</div>;
}

function ClipGrid({ rows }: { rows: ProjectCenter["generatedClips"] }) {
  if (!rows.length) return <Empty title="No generated clips" detail="Generate clips from a project video source to populate this tab." />;
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{rows.map((row) => <article key={row.id} className="glass overflow-hidden rounded-2xl"><img src={row.thumbnail} alt="" className="aspect-[4/5] w-full object-cover opacity-60 mix-blend-luminosity" /><div className="p-4"><Badge>Viral {row.viralScore}</Badge><h2 className="mt-3 font-semibold text-white">{row.title}</h2><p className="mt-2 text-sm text-slate-400">{row.duration}s - {row.sourceTitle}</p></div></article>)}</div>;
}

function AssetGrid({ rows }: { rows: ProjectCenter["creativeAssets"] }) {
  if (!rows.length) return <Empty title="Belum ada asset di project ini" detail="Buat konten dari Creative Studio atau pilih dari Content Library." actionHref="/creative-studio" actionLabel="Open Creative Studio" />;
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{rows.map((row) => <article key={row.id} className="glass overflow-hidden rounded-2xl"><img src={row.thumbnail} alt="" className="aspect-[4/5] w-full object-cover opacity-60 mix-blend-luminosity" /><div className="p-4"><Badge>{row.type}</Badge><h2 className="mt-3 font-semibold text-white">{row.title}</h2><p className="mt-2 line-clamp-2 text-sm text-slate-400">{row.prompt}</p></div></article>)}</div>;
}

function ContentGrid({ rows }: { rows: ProjectCenter["contentItems"] }) {
  if (!rows.length) return <Empty title="No content library items" detail="Approved workflow content for this Project will appear here." />;
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{rows.map((row) => <Link href={`/library/${row.id}`} key={row.id} className="glass overflow-hidden rounded-2xl hover:border-teal-300/40"><img src={row.thumbnail} alt="" className="aspect-[4/5] w-full object-cover opacity-60 mix-blend-luminosity" /><div className="p-4"><div className="flex flex-wrap gap-2"><Badge>{row.status}</Badge>{row.sourceType === "SIMILAR_CONTENT" ? <Badge>Similar Content</Badge> : null}</div><h2 className="mt-3 font-semibold text-white">{row.title}</h2><p className="mt-2 text-sm text-slate-400">{row.type} - {row.platform}</p>{row.viralScorePrediction ? <p className="mt-2 text-sm text-teal-100">Predicted viral score {row.viralScorePrediction}</p> : null}</div></Link>)}</div>;
}

function ScheduleList({ rows }: { rows: ProjectCenter["schedules"] }) {
  if (!rows.length) return <Empty title="No schedules" detail="Project-specific posting schedules will appear after sending Approved content to Scheduler." />;
  return <div className="glass rounded-2xl p-5"><div className="grid gap-3">{rows.map((row) => <div key={row.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><div className="font-semibold text-white">{row.title}</div><div className="mt-1 text-sm text-slate-400">{row.platform} - {row.socialAccount} - {row.status} - {new Date(row.scheduledAt).toLocaleString("id-ID")}</div></div>)}</div></div>;
}

function AccountList({ rows }: { rows: ProjectCenter["socialAccounts"] }) {
  if (!rows.length) return <Empty title="No social accounts" detail="Link Social Accounts to this Project from the Social Account Manager." />;
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{rows.map((row) => <Link href={`/social-accounts/${row.id}`} key={row.id} className="glass rounded-2xl p-5 hover:border-teal-300/40"><Badge>{row.status}</Badge><h2 className="mt-3 text-lg font-semibold text-white">{row.name}</h2><p className="mt-1 text-sm text-slate-400">{row.handle} - {row.platform}</p><p className="mt-3 text-sm text-teal-100">{row.scheduled} scheduled posts</p></Link>)}</div>;
}

function Analytics({ data }: { data: ProjectCenter["analytics"] }) {
  return <section className="space-y-4">{data.isDummy ? <div className="rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">Demo analytics: performance platform belum terhubung untuk project ini.</div> : null}<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5"><Metric label="Views" value={data.views} /><Metric label="Engagement" value={data.engagement} /><Metric label="Top Content" value={data.topContent} /><Metric label="Top Account" value={data.topAccount} /><Metric label="Best Time" value={data.bestPostingTime} /></div></section>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="glass rounded-2xl p-5"><div className="text-xs font-semibold uppercase text-slate-500">{label}</div><div className="mt-3 text-xl font-semibold text-white">{value}</div></div>;
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1 text-xs font-semibold text-teal-100">{children}</span>;
}

function Empty({ title, detail, actionHref, actionLabel }: { title: string; detail: string; actionHref?: string; actionLabel?: string }) {
  return <div className="glass grid min-h-72 place-items-center rounded-2xl p-8 text-center"><div><Link2 className="mx-auto mb-4 h-10 w-10 text-teal-300" /><h2 className="text-xl font-semibold text-white">{title}</h2><p className="mt-2 max-w-md text-sm text-slate-400">{detail}</p>{actionHref && actionLabel ? <Link href={actionHref} className="mt-5 inline-flex rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500">{actionLabel}</Link> : null}</div></div>;
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return <div className="fixed right-4 top-4 z-50 max-w-sm rounded-2xl border border-rose-300/30 bg-rose-950 p-4 text-sm text-rose-50 shadow-glow"><div className="flex items-start justify-between gap-4"><span>{message}</span><button type="button" onClick={onClose} className="opacity-70 hover:opacity-100">Close</button></div></div>;
}
