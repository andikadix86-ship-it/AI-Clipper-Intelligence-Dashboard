"use client";

import clsx from "clsx";
import { ArrowLeft, BarChart3, CalendarClock, CheckCircle2, Clock, LinkIcon, LogOut, RefreshCcw, Settings, Share2, ShieldCheck, ThumbsUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { authStatusLabels, publishModeLabels, socialPlatformLabels, statusLabels, uploadMethodLabels, type SocialAccountDto } from "@/lib/social-account-service";

type Tab = "overview" | "scheduled" | "posted" | "analytics" | "settings";
type ScheduleRow = { id: string; title: string; status: string; date: string; platform: keyof typeof socialPlatformLabels };

const fallbackAccount: SocialAccountDto = {
  id: "fallback",
  projectId: "project_creator_growth",
  projectName: "Creator Growth Engine",
  platform: "YOUTUBE_SHORTS",
  name: "Fatih Shorts",
  handle: "@fatihshorts",
  niche: "AI creator workflow",
  status: "MANUAL",
  uploadMethod: "MANUAL",
  uploadMode: "MANUAL",
  authStatus: "NOT_CONNECTED",
  tokenMasked: "",
  connectionNotes: "Manual upload only. No token stored.",
  permissionStatus: "NOT_REQUESTED",
  loginNotes: "Manual upload via studio dashboard.",
  notes: "Best performance in evening posting window.",
  isActive: true,
  totalContent: 148,
  scheduledPosts: 18,
  postedPosts: 116,
  lastActivityAt: "2026-05-30T12:00:00.000Z"
};

const dummyAnalytics = [
  { label: "Total views", value: "1.24M", icon: BarChart3 },
  { label: "Likes", value: "84.6K", icon: ThumbsUp },
  { label: "Comments", value: "8.9K", icon: Share2 },
  { label: "Shares", value: "19.4K", icon: CheckCircle2 },
  { label: "Engagement rate", value: "13.8%", icon: BarChart3 },
  { label: "Best posting time", value: "19:00-21:00", icon: Clock }
];

export default function SocialAccountDetailPage({ params }: { params: { id: string } }) {
  const [tab, setTab] = useState<Tab>("overview");
  const [account, setAccount] = useState<SocialAccountDto>(fallbackAccount);
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [workingAuth, setWorkingAuth] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/social-accounts/${params.id}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Akun tidak ditemukan.");
        setAccount(data.account);
        setSchedules(data.schedules ?? []);
      })
      .catch((error) => setToast(error instanceof Error ? error.message : "Gagal memuat detail akun."));
  }, [params.id]);

  const scheduledContent = useMemo(() => schedules.filter((schedule) => schedule.status === "SCHEDULED" || schedule.status === "DRAFT"), [schedules]);
  const postedContent = useMemo(() => schedules.filter((schedule) => schedule.status === "POSTED"), [schedules]);

  async function reloadAccount() {
    const response = await fetch(`/api/social-accounts/${params.id}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Akun tidak ditemukan.");
    setAccount(data.account);
    setSchedules(data.schedules ?? []);
  }

  function connectYouTube() {
    window.location.href = `/api/auth/youtube/start?socialAccountId=${account.id}`;
  }

  function oauthProviderPath() {
    if (account.platform === "TIKTOK") return "tiktok";
    if (account.platform === "INSTAGRAM_REELS" || account.platform === "FACEBOOK_REELS") return "meta";
    return "youtube";
  }

  function connectPlatform() {
    window.location.href = `/api/auth/${oauthProviderPath()}/start?socialAccountId=${account.id}`;
  }

  async function youtubeAction(action: "validate" | "disconnect" | "refresh") {
    setWorkingAuth(action);
    try {
      const response = await fetch(`/api/auth/youtube/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ socialAccountId: account.id })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? `YouTube ${action} failed.`);
      await reloadAccount();
      setToast(`YouTube ${action} selesai. Status: ${data.authStatus ?? data.result?.authStatus ?? "ok"}.`);
    } catch (error) {
      setToast(error instanceof Error ? error.message : `YouTube ${action} failed.`);
    } finally {
      setWorkingAuth(null);
    }
  }

  async function platformAction(action: "validate" | "disconnect" | "refresh") {
    const provider = oauthProviderPath();
    setWorkingAuth(action);
    try {
      const response = await fetch(`/api/auth/${provider}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ socialAccountId: account.id })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? `${provider} ${action} failed.`);
      await reloadAccount();
      setToast(`${provider} ${action} selesai. Status: ${data.authStatus ?? "ok"}.`);
    } catch (error) {
      setToast(error instanceof Error ? error.message : `${provider} ${action} failed.`);
    } finally {
      setWorkingAuth(null);
    }
  }

  return (
    <div className="space-y-6">
      {toast ? <Toast message={toast} onClose={() => setToast(null)} /> : null}
      <Link href="/social-accounts" className="inline-flex items-center gap-2 text-sm font-semibold text-teal-200">
        <ArrowLeft className="h-4 w-4" />
        Back to Social Accounts
      </Link>

      <section className="glass rounded-2xl p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1 text-sm text-teal-100">
              <Share2 className="h-4 w-4" />
              {socialPlatformLabels[account.platform]}
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">{account.name}</h1>
            <p className="mt-3 text-slate-300">{account.handle} - {account.niche} - {account.projectName}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone={account.status === "DISABLED" ? "danger" : "good"}>{statusLabels[account.status]}</Badge>
            <Badge>{uploadMethodLabels[account.uploadMethod]}</Badge>
            <Badge>{publishModeLabels[account.uploadMode]}</Badge>
            <Badge tone={account.authStatus === "CONNECTED" ? "good" : account.authStatus === "ERROR" ? "danger" : "neutral"}>{authStatusLabels[account.authStatus]}</Badge>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-2">
        {(["overview", "scheduled", "posted", "analytics", "settings"] as Tab[]).map((item) => (
          <button key={item} type="button" onClick={() => setTab(item)} className={clsx("rounded-xl px-4 py-2 text-sm font-semibold capitalize transition", tab === item ? "bg-teal-300 text-slate-950" : "text-slate-300 hover:bg-white/[0.08]")}>
            {item.replace("-", " ")}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <section className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Metric label="Total Content" value={account.totalContent} icon={BarChart3} />
            <Metric label="Scheduled Posts" value={account.scheduledPosts} icon={CalendarClock} />
            <Metric label="Posted Posts" value={account.postedPosts} icon={CheckCircle2} />
          </div>
          {account.platform === "YOUTUBE_SHORTS" ? <YouTubeOAuthCard account={account} working={workingAuth} onConnect={connectYouTube} onAction={youtubeAction} /> : null}
          {account.platform !== "YOUTUBE_SHORTS" ? <PlatformOAuthCard account={account} working={workingAuth} onConnect={connectPlatform} onAction={platformAction} /> : null}
        </section>
      ) : null}

      {tab === "scheduled" ? <ScheduleList title="Scheduled Content" rows={scheduledContent} empty="Belum ada content terjadwal untuk akun ini." /> : null}
      {tab === "posted" ? <ScheduleList title="Posted Content" rows={postedContent} empty="Belum ada content posted untuk akun ini." /> : null}

      {tab === "analytics" ? (
        <section className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            {dummyAnalytics.map((item) => <Metric key={item.label} label={item.label} value={item.value} icon={item.icon} />)}
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <InfoCard title="Best Content" value="The 30 Second AI Workflow That Saves 2 Hours" detail="168K views, 18.6% engagement rate, strongest retention in first 3 seconds." />
            <InfoCard title="Best Posting Time" value="19:00-21:00 Asia/Jakarta" detail="Evening posts outperform morning posts by 27% on this account." />
          </div>
        </section>
      ) : null}

      {tab === "settings" ? (
        <section className="glass rounded-2xl p-5">
          <div className="mb-4 flex items-center gap-3">
            <Settings className="h-5 w-5 text-teal-300" />
            <h2 className="text-xl font-semibold text-white">Settings</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <InfoCard title="Upload Method" value={uploadMethodLabels[account.uploadMethod]} detail="API/token belum digunakan pada tahap ini." />
            <InfoCard title="Notes" value={account.notes || "No notes"} detail={account.loginNotes || "Tidak ada password atau token yang ditampilkan di UI."} />
          </div>
          {account.platform === "YOUTUBE_SHORTS" ? <div className="mt-4"><YouTubeOAuthCard account={account} working={workingAuth} onConnect={connectYouTube} onAction={youtubeAction} /></div> : null}
          {account.platform !== "YOUTUBE_SHORTS" ? <div className="mt-4"><PlatformOAuthCard account={account} working={workingAuth} onConnect={connectPlatform} onAction={platformAction} /></div> : null}
        </section>
      ) : null}
    </div>
  );
}

function PlatformOAuthCard({ account, working, onConnect, onAction }: { account: SocialAccountDto; working: string | null; onConnect: () => void; onAction: (action: "validate" | "disconnect" | "refresh") => void }) {
  const platformName = socialPlatformLabels[account.platform];
  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">{platformName} OAuth Status</h2>
          <p className="mt-2 text-sm text-slate-400">Preparation only. Token disimpan server-side, upload real belum aktif untuk platform ini.</p>
        </div>
        <Badge tone={account.authStatus === "CONNECTED" ? "good" : account.authStatus === "ERROR" ? "danger" : "neutral"}>{authStatusLabels[account.authStatus]}</Badge>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <InfoCard title="Account Name" value={account.platformAccountName || "Not connected"} detail="Placeholder sampai profile API real diaktifkan." />
        <InfoCard title="Account ID" value={account.platformAccountId || "Not connected"} detail="Token tidak pernah ditampilkan." />
        <InfoCard title="Permission Status" value={account.permissionStatus || "NOT_REQUESTED"} detail="Scope/permission akan divalidasi saat OAuth real aktif." />
        <InfoCard title="Last Sync" value={account.lastSyncAt ? new Date(account.lastSyncAt).toLocaleString("id-ID") : "Never"} detail={account.connectionNotes || "Manual Upload tetap tersedia."} />
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" onClick={onConnect} disabled={working !== null} className="inline-flex items-center gap-2 rounded-xl bg-teal-300 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"><LinkIcon className="h-4 w-4" />Connect</button>
        <button type="button" onClick={onConnect} disabled={working !== null} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"><RefreshCcw className="h-4 w-4" />Reconnect</button>
        <button type="button" onClick={() => onAction("validate")} disabled={working !== null} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"><ShieldCheck className="h-4 w-4" />Validate Connection</button>
        <button type="button" onClick={() => onAction("refresh")} disabled={working !== null || account.authStatus === "NOT_CONNECTED"} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"><RefreshCcw className="h-4 w-4" />Refresh</button>
        <button type="button" onClick={() => onAction("disconnect")} disabled={working !== null || account.authStatus === "NOT_CONNECTED"} className="inline-flex items-center gap-2 rounded-xl border border-rose-300/20 bg-rose-400/10 px-4 py-2 text-sm font-semibold text-rose-100 disabled:opacity-60"><LogOut className="h-4 w-4" />Disconnect</button>
      </div>
    </div>
  );
}

function YouTubeOAuthCard({ account, working, onConnect, onAction }: { account: SocialAccountDto; working: string | null; onConnect: () => void; onAction: (action: "validate" | "disconnect" | "refresh") => void }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">YouTube OAuth Status</h2>
          <p className="mt-2 text-sm text-slate-400">Token disimpan server-side dan tidak ditampilkan di UI. Upload real belum aktif.</p>
        </div>
        <Badge tone={account.authStatus === "CONNECTED" ? "good" : account.authStatus === "ERROR" ? "danger" : "neutral"}>{authStatusLabels[account.authStatus]}</Badge>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <InfoCard title="Channel Name" value={account.platformAccountName || "Not connected"} detail="Placeholder sampai Google channel API diaktifkan." />
        <InfoCard title="Channel ID" value={account.platformAccountId || "Not connected"} detail="Tidak ada token yang ditampilkan." />
        <InfoCard title="Token Expiry" value={account.tokenExpiresAt ? new Date(account.tokenExpiresAt).toLocaleString("id-ID") : "Not available"} detail="Refresh sebelum expired untuk Auto Publishing." />
        <InfoCard title="Last Sync" value={account.lastSyncAt ? new Date(account.lastSyncAt).toLocaleString("id-ID") : "Never"} detail={account.connectionNotes || "No connection notes."} />
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" onClick={onConnect} disabled={working !== null} className="inline-flex items-center gap-2 rounded-xl bg-teal-300 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"><LinkIcon className="h-4 w-4" />Connect YouTube</button>
        <button type="button" onClick={onConnect} disabled={working !== null} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"><RefreshCcw className="h-4 w-4" />Reconnect</button>
        <button type="button" onClick={() => onAction("validate")} disabled={working !== null} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"><ShieldCheck className="h-4 w-4" />Validate Connection</button>
        <button type="button" onClick={() => onAction("refresh")} disabled={working !== null || account.authStatus === "NOT_CONNECTED"} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"><RefreshCcw className="h-4 w-4" />Refresh</button>
        <button type="button" onClick={() => onAction("disconnect")} disabled={working !== null || account.authStatus === "NOT_CONNECTED"} className="inline-flex items-center gap-2 rounded-xl border border-rose-300/20 bg-rose-400/10 px-4 py-2 text-sm font-semibold text-rose-100 disabled:opacity-60"><LogOut className="h-4 w-4" />Disconnect</button>
      </div>
    </div>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: number | string; icon: typeof BarChart3 }) {
  return (
    <div className="glass rounded-2xl p-5">
      <Icon className="mb-4 h-5 w-5 text-teal-300" />
      <div className="text-2xl font-semibold text-white">{value}</div>
      <div className="mt-1 text-sm text-slate-400">{label}</div>
    </div>
  );
}

function ScheduleList({ title, rows, empty }: { title: string; rows: ScheduleRow[]; empty: string }) {
  return (
    <section className="glass rounded-2xl p-5">
      <h2 className="mb-4 text-xl font-semibold text-white">{title}</h2>
      {rows.length ? (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="font-semibold text-white">{row.title}</div>
              <div className="mt-1 text-sm text-slate-400">{socialPlatformLabels[row.platform]} - {row.status} - {new Date(row.date).toLocaleString("id-ID")}</div>
            </div>
          ))}
        </div>
      ) : <div className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-slate-400">{empty}</div>}
    </section>
  );
}

function InfoCard({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <div className="glass rounded-2xl p-5">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <div className="mt-2 font-semibold text-teal-100">{value}</div>
      <p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p>
    </div>
  );
}

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "good" | "danger" }) {
  return <span className={clsx("rounded-full border px-3 py-1 text-xs font-semibold", tone === "good" && "border-teal-200 bg-teal-300 text-slate-950", tone === "danger" && "border-rose-300/20 bg-rose-400/10 text-rose-100", tone === "neutral" && "border-white/10 bg-white/[0.07] text-slate-200")}>{children}</span>;
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed right-4 top-4 z-50 max-w-sm rounded-2xl border border-rose-300/30 bg-rose-950 p-4 text-sm text-rose-50 shadow-glow">
      <div className="flex items-start justify-between gap-4">
        <span>{message}</span>
        <button type="button" onClick={onClose} className="opacity-70 hover:opacity-100">Close</button>
      </div>
    </div>
  );
}
