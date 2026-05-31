"use client";

import clsx from "clsx";
import { BarChart3, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Edit3, List, Plus, Send, Trash2, XCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { LibraryItemDto, ProjectDto, SocialPlatform } from "@/lib/types";

type ScheduleStatus = "DRAFT" | "SCHEDULED" | "READY_TO_POST" | "PUBLISHING" | "POSTED" | "FAILED" | "CANCELED";
type PublishMode = "MANUAL" | "SEMI_AUTO" | "AUTO";
type ViewMode = "month" | "week" | "list";

type SchedulerItem = {
  id: string;
  projectId?: string;
  project: string;
  contentItemId?: string;
  contentTitle: string;
  contentType: string;
  socialAccountId: string;
  socialAccount: string;
  platform: SocialPlatform;
  platformLabel: string;
  date: string;
  time: string;
  scheduledAt: string;
  timezone: string;
  videosPerDay: number;
  status: ScheduleStatus;
  publishMode: PublishMode;
  notes: string;
  postUrl?: string;
  postedAt?: string;
  analyticsRecorded: boolean;
};

type SocialAccountOption = { id: string; name: string; platform: SocialPlatform; projectId?: string; isActive?: boolean; status?: string };
type ContentOption = { id: string; title: string; typeLabel: string; status: string; projectId?: string };

const platformLabels: Record<SocialPlatform, string> = {
  TIKTOK: "TikTok",
  YOUTUBE_SHORTS: "YouTube Shorts",
  INSTAGRAM_REELS: "Instagram Reels",
  FACEBOOK_REELS: "Facebook Reels"
};

const statusLabels: Record<ScheduleStatus, string> = {
  DRAFT: "Draft",
  SCHEDULED: "Scheduled",
  READY_TO_POST: "Ready To Post",
  PUBLISHING: "Publishing",
  POSTED: "Posted",
  FAILED: "Failed",
  CANCELED: "Canceled"
};

const fallbackContentItems: ContentOption[] = [
  { id: "clip_ai_workflow", title: "The 30 Second AI Workflow That Saves 2 Hours", typeLabel: "Clip", status: "Approved" }
];

const fallbackSocialAccounts: SocialAccountOption[] = [
  { id: "acct_fatih_yt", name: "Fatih Shorts", platform: "YOUTUBE_SHORTS" }
];

function todayJakarta() {
  return new Date().toISOString().slice(0, 10);
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function startOfWeek(date: Date) {
  const next = new Date(date);
  const day = next.getDay();
  next.setDate(next.getDate() - day);
  return next;
}

function monthDays(cursor: Date) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const start = startOfWeek(first);
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

function weekDays(cursor: Date) {
  const start = startOfWeek(cursor);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

export default function SchedulerPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [cursor, setCursor] = useState(new Date());
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [contentItems, setContentItems] = useState<ContentOption[]>(fallbackContentItems);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccountOption[]>(fallbackSocialAccounts);
  const [schedules, setSchedules] = useState<SchedulerItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modal, setModal] = useState<{ type: "posted" | "performance"; schedule: SchedulerItem } | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [filters, setFilters] = useState({
    projectId: "All",
    socialAccountId: "All",
    platform: "All",
    status: "All",
    from: "",
    to: ""
  });
  const [form, setForm] = useState({
    projectId: "",
    contentItemId: fallbackContentItems[0].id,
    socialAccountId: fallbackSocialAccounts[0].id,
    platform: fallbackSocialAccounts[0].platform,
    date: todayJakarta(),
    time: "09:00",
    timezone: "Asia/Jakarta",
    videosPerDay: 1,
    status: "SCHEDULED" as ScheduleStatus,
    publishMode: "MANUAL" as PublishMode,
    notes: ""
  });
  const [postedForm, setPostedForm] = useState({ postUrl: "", postedAt: new Date().toISOString().slice(0, 16), notes: "" });
  const [performanceForm, setPerformanceForm] = useState({
    postUrl: "",
    postedAt: new Date().toISOString().slice(0, 16),
    views: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    saves: 0,
    watchTime: 0,
    averageViewDuration: 0,
    followersGained: 0,
    notes: ""
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      const [projectData, libraryData, accountData, scheduleData] = await Promise.all([
        fetch("/api/projects").then((response) => response.json()),
        fetch("/api/library").then((response) => response.json()),
        fetch("/api/social-accounts").then((response) => response.json()),
        fetch("/api/scheduler").then((response) => response.json())
      ]);

      const approvedContent = (libraryData.items ?? [])
        .filter((item: LibraryItemDto) => item.workflowStatus === "APPROVED")
        .map((item: LibraryItemDto) => ({
          id: item.id,
          title: item.title,
          typeLabel: item.typeLabel,
          status: item.workflowStatusLabel,
          projectId: item.projectId
        }));
      const accounts = (accountData.accounts ?? [])
        .filter((account: SocialAccountOption) => account.isActive !== false && account.status !== "DISABLED" && account.status !== "NOT_CONNECTED")
        .map((account: SocialAccountOption) => ({
          id: account.id,
          name: account.name,
          platform: account.platform,
          projectId: account.projectId
        }));

      setProjects(projectData.projects ?? []);
      setContentItems(approvedContent);
      setSocialAccounts(accounts.length ? accounts : fallbackSocialAccounts);
      setSchedules(scheduleData.schedules ?? []);
      setForm((current) => ({
        ...current,
        projectId: projectData.projects?.[0]?.id ?? "",
        contentItemId: approvedContent[0]?.id ?? "",
        socialAccountId: accounts[0]?.id ?? fallbackSocialAccounts[0].id,
        platform: accounts[0]?.platform ?? fallbackSocialAccounts[0].platform
      }));
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Scheduler data gagal dimuat." });
    }
  }

  const filteredSchedules = useMemo(
    () =>
      schedules.filter((schedule) => {
        return (
          (filters.projectId === "All" || schedule.projectId === filters.projectId) &&
          (filters.socialAccountId === "All" || schedule.socialAccountId === filters.socialAccountId) &&
          (filters.platform === "All" || schedule.platform === filters.platform) &&
          (filters.status === "All" || schedule.status === filters.status) &&
          (!filters.from || schedule.date >= filters.from) &&
          (!filters.to || schedule.date <= filters.to)
        );
      }),
    [filters, schedules]
  );

  const days = viewMode === "week" ? weekDays(cursor) : monthDays(cursor);

  function schedulesForDate(day: Date) {
    const key = dateKey(day);
    return filteredSchedules.filter((schedule) => schedule.date === key).sort((a, b) => a.time.localeCompare(b.time));
  }

  function moveCursor(direction: -1 | 1) {
    const next = new Date(cursor);
    if (viewMode === "week") next.setDate(next.getDate() + direction * 7);
    else next.setMonth(next.getMonth() + direction);
    setCursor(next);
  }

  function updateAccount(accountId: string) {
    const account = socialAccounts.find((item) => item.id === accountId) ?? socialAccounts[0];
    setForm({ ...form, socialAccountId: account.id, platform: account.platform, projectId: account.projectId ?? form.projectId });
  }

  function startEdit(schedule: SchedulerItem) {
    setEditingId(schedule.id);
    setForm({
      projectId: schedule.projectId ?? "",
      contentItemId: schedule.contentItemId ?? contentItems[0]?.id ?? "",
      socialAccountId: schedule.socialAccountId,
      platform: schedule.platform,
      date: schedule.date,
      time: schedule.time,
      timezone: schedule.timezone,
      videosPerDay: schedule.videosPerDay,
      status: schedule.status,
      publishMode: schedule.publishMode ?? "MANUAL",
      notes: schedule.notes
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm({
      projectId: projects[0]?.id ?? "",
      contentItemId: contentItems[0]?.id ?? "",
      socialAccountId: socialAccounts[0]?.id ?? "",
      platform: socialAccounts[0]?.platform ?? "YOUTUBE_SHORTS",
      date: todayJakarta(),
      time: "09:00",
      timezone: "Asia/Jakarta",
      videosPerDay: 1,
      status: "SCHEDULED",
      publishMode: "MANUAL",
      notes: ""
    });
  }

  async function saveSchedule() {
    const selectedContent = contentItems.find((item) => item.id === form.contentItemId);
    if (!selectedContent) {
      setToast({ type: "error", message: "Pilih content dengan status Approved sebelum membuat schedule." });
      return;
    }

    try {
      const response = await fetch(editingId ? `/api/scheduler/${editingId}` : "/api/scheduler/create", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Schedule gagal disimpan ke Supabase.");

      setSchedules((current) =>
        editingId ? current.map((schedule) => (schedule.id === editingId ? data.schedule : schedule)) : [...current, data.schedule]
      );
      setToast({ type: "success", message: editingId ? "Schedule berhasil diupdate." : "Schedule berhasil dibuat." });
      resetForm();
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Schedule gagal disimpan." });
    }
  }

  async function deleteSchedule(schedule: SchedulerItem) {
    const ok = window.confirm(`Hapus jadwal "${schedule.contentTitle}" pada ${schedule.date} ${schedule.time}?`);
    if (!ok) return;

    try {
      const response = await fetch(`/api/scheduler/${schedule.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Schedule gagal dihapus.");
      setSchedules((current) => current.filter((item) => item.id !== schedule.id));
      setToast({ type: "success", message: "Schedule berhasil dihapus." });
      if (editingId === schedule.id) resetForm();
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Schedule gagal dihapus." });
    }
  }

  function openPosted(schedule: SchedulerItem) {
    setPostedForm({
      postUrl: schedule.postUrl ?? "",
      postedAt: schedule.postedAt ? schedule.postedAt.slice(0, 16) : new Date().toISOString().slice(0, 16),
      notes: schedule.notes ?? ""
    });
    setModal({ type: "posted", schedule });
  }

  function openPerformance(schedule: SchedulerItem) {
    setPerformanceForm({
      postUrl: schedule.postUrl ?? "",
      postedAt: schedule.postedAt ? schedule.postedAt.slice(0, 16) : new Date().toISOString().slice(0, 16),
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
      watchTime: 0,
      averageViewDuration: 0,
      followersGained: 0,
      notes: schedule.notes ?? ""
    });
    setModal({ type: "performance", schedule });
  }

  async function markPosted() {
    if (!modal) return;
    setWorkingId(modal.schedule.id);
    try {
      const response = await fetch(`/api/schedule/${modal.schedule.id}/mark-posted`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postedForm)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Schedule gagal ditandai posted.");
      setSchedules((current) => current.map((schedule) => (schedule.id === modal.schedule.id ? data.schedule : schedule)));
      setToast({ type: "success", message: "Schedule berhasil ditandai Posted." });
      setModal(null);
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Schedule gagal ditandai posted." });
    } finally {
      setWorkingId(null);
    }
  }

  async function markFailed(schedule: SchedulerItem) {
    setWorkingId(schedule.id);
    try {
      const response = await fetch(`/api/schedule/${schedule.id}/mark-failed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "Manual posting failed." })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Schedule gagal ditandai failed.");
      setSchedules((current) => current.map((item) => (item.id === schedule.id ? data.schedule : item)));
      setToast({ type: "success", message: "Schedule berhasil ditandai Failed." });
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Schedule gagal ditandai failed." });
    } finally {
      setWorkingId(null);
    }
  }

  async function savePerformance() {
    if (!modal?.schedule.contentItemId) {
      setToast({ type: "error", message: "Schedule belum terhubung ke content." });
      return;
    }
    setWorkingId(modal.schedule.id);
    try {
      const response = await fetch("/api/analytics/input-performance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...performanceForm,
          postingScheduleId: modal.schedule.id,
          contentItemId: modal.schedule.contentItemId,
          socialAccountId: modal.schedule.socialAccountId,
          projectId: modal.schedule.projectId,
          platform: modal.schedule.platform
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Performance gagal disimpan.");
      setSchedules((current) => current.map((schedule) => (schedule.id === modal.schedule.id ? { ...schedule, postUrl: data.analytics.postUrl, postedAt: data.analytics.postedAt, analyticsRecorded: true } : schedule)));
      setToast({ type: "success", message: `Performance tersimpan. Engagement rate ${data.analytics.engagementRate}%.` });
      setModal(null);
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Performance gagal disimpan." });
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {toast ? <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} /> : null}
      {modal?.type === "posted" ? (
        <PostedModal form={postedForm} setForm={setPostedForm} loading={workingId === modal.schedule.id} onCancel={() => setModal(null)} onConfirm={markPosted} />
      ) : null}
      {modal?.type === "performance" ? (
        <PerformanceModal form={performanceForm} setForm={setPerformanceForm} loading={workingId === modal.schedule.id} onCancel={() => setModal(null)} onConfirm={savePerformance} />
      ) : null}
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1 text-sm text-teal-100">
            <CalendarDays className="h-4 w-4" />
            Scheduler
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">Scheduler Calendar</h1>
          <p className="mt-3 max-w-3xl text-slate-300">Professional posting calendar for all Approved content across Projects and Social Accounts.</p>
        </div>
        <div className="flex rounded-2xl border border-white/10 bg-white/[0.05] p-1">
          {(["month", "week", "list"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={clsx("rounded-xl px-4 py-2 text-sm font-semibold capitalize transition", viewMode === mode ? "bg-white text-slate-950" : "text-slate-300 hover:bg-white/[0.08]")}
            >
              {mode}
            </button>
          ))}
        </div>
      </header>

      <section className="glass rounded-2xl p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <Filter label="Project" value={filters.projectId} options={[["All", "All"], ...projects.map((project) => [project.id, project.name])]} onChange={(projectId) => setFilters({ ...filters, projectId })} />
          <Filter label="Social Account" value={filters.socialAccountId} options={[["All", "All"], ...socialAccounts.map((account) => [account.id, account.name])]} onChange={(socialAccountId) => setFilters({ ...filters, socialAccountId })} />
          <Filter label="Platform" value={filters.platform} options={[["All", "All"], ...Object.entries(platformLabels)]} onChange={(platform) => setFilters({ ...filters, platform })} />
          <Filter label="Status" value={filters.status} options={[["All", "All"], ...Object.entries(statusLabels)]} onChange={(status) => setFilters({ ...filters, status })} />
          <DateField label="From" value={filters.from} onChange={(from) => setFilters({ ...filters, from })} />
          <DateField label="To" value={filters.to} onChange={(to) => setFilters({ ...filters, to })} />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <div className="glass rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-white">{editingId ? "Edit Schedule" : "Create Schedule"}</h2>
            {editingId ? <button type="button" onClick={resetForm} className="text-sm font-semibold text-teal-200">Cancel</button> : null}
          </div>
          <div className="space-y-4">
            <Field label="Pilih Project">
              <select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} className="premium-input px-4 py-3">
                {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
              </select>
            </Field>
            <Field label="Pilih Content dari Content Library">
              <select value={form.contentItemId} onChange={(e) => setForm({ ...form, contentItemId: e.target.value })} className="premium-input px-4 py-3">
                {contentItems.map((item) => <option key={item.id} value={item.id}>{item.title} - {item.typeLabel} - {item.status}</option>)}
              </select>
              {!contentItems.length ? (
                <p className="mt-2 rounded-xl border border-amber-300/20 bg-amber-400/10 px-3 py-2 text-xs leading-5 text-amber-100">
                  Belum ada content Approved. Kirim content ke Review lalu Approve di Content Library sebelum membuat schedule.
                  <Link href="/library" className="mt-2 block font-semibold text-white underline underline-offset-2">Open Content Library</Link>
                </p>
              ) : null}
            </Field>
            <Field label="Pilih Social Account">
              <select value={form.socialAccountId} onChange={(e) => updateAccount(e.target.value)} className="premium-input px-4 py-3">
                {socialAccounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
              </select>
            </Field>
            <Field label="Pilih Platform">
              <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value as SocialPlatform })} className="premium-input px-4 py-3">
                {Object.entries(platformLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <DateField label="Tanggal posting" value={form.date} onChange={(date) => setForm({ ...form, date })} />
              <Field label="Jam posting">
                <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="premium-input px-4 py-3" />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Timezone">
                <input value={form.timezone} readOnly className="premium-input px-4 py-3 text-slate-300" />
              </Field>
              <Field label="Status">
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ScheduleStatus })} className="premium-input px-4 py-3">
                  {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </Field>
              <Field label="Publish Mode">
                <select value={form.publishMode} onChange={(e) => setForm({ ...form, publishMode: e.target.value as PublishMode })} className="premium-input px-4 py-3">
                  <option value="MANUAL">Manual</option>
                  <option value="SEMI_AUTO">Semi Auto</option>
                  <option value="AUTO">Auto</option>
                </select>
              </Field>
            </div>
            <Field label="Notes">
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="premium-input px-4 py-3" />
            </Field>
            <button type="button" onClick={saveSchedule} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-300 px-5 py-4 font-semibold text-slate-950 shadow-glow">
              <Plus className="h-5 w-5" />
              {editingId ? "Update Schedule" : "Create Schedule"}
            </button>
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">
                {cursor.toLocaleString("en-US", { month: "long", year: "numeric" })}
              </h2>
              <p className="mt-1 text-sm text-slate-400">{filteredSchedules.length} schedules in current filters</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => moveCursor(-1)} className="rounded-xl border border-white/10 bg-white/[0.06] p-3 text-white"><ChevronLeft className="h-4 w-4" /></button>
              <button type="button" onClick={() => setCursor(new Date())} className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white">Today</button>
              <button type="button" onClick={() => moveCursor(1)} className="rounded-xl border border-white/10 bg-white/[0.06] p-3 text-white"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>

          {viewMode === "list" ? (
            <ListView schedules={filteredSchedules} onEdit={startEdit} onDelete={deleteSchedule} onMarkPosted={openPosted} onMarkFailed={markFailed} onInputPerformance={openPerformance} workingId={workingId} />
          ) : (
            <div className={clsx("grid gap-2", viewMode === "week" ? "grid-cols-1 md:grid-cols-7" : "grid-cols-1 md:grid-cols-7")}>
              {days.map((day) => (
                <DayCell key={day.toISOString()} day={day} compact={viewMode === "month"} schedules={schedulesForDate(day)} currentMonth={day.getMonth() === cursor.getMonth()} onEdit={startEdit} onDelete={deleteSchedule} onMarkPosted={openPosted} onMarkFailed={markFailed} onInputPerformance={openPerformance} workingId={workingId} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function DayCell({ day, compact, schedules, currentMonth, onEdit, onDelete, onMarkPosted, onMarkFailed, onInputPerformance, workingId }: { day: Date; compact: boolean; schedules: SchedulerItem[]; currentMonth: boolean; onEdit: (schedule: SchedulerItem) => void; onDelete: (schedule: SchedulerItem) => void; onMarkPosted: (schedule: SchedulerItem) => void; onMarkFailed: (schedule: SchedulerItem) => void; onInputPerformance: (schedule: SchedulerItem) => void; workingId: string | null }) {
  return (
    <div className={clsx("min-h-36 rounded-2xl border border-white/10 bg-white/[0.035] p-3", !currentMonth && compact && "opacity-45")}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-white">{day.getDate()}</span>
        <span className="text-xs text-slate-500">{day.toLocaleDateString("en-US", { weekday: "short" })}</span>
      </div>
      <div className="space-y-2">
        {schedules.length ? schedules.map((schedule) => <ScheduleCard key={schedule.id} schedule={schedule} onEdit={onEdit} onDelete={onDelete} onMarkPosted={onMarkPosted} onMarkFailed={onMarkFailed} onInputPerformance={onInputPerformance} working={workingId === schedule.id} />) : <div className="rounded-xl border border-dashed border-white/10 p-3 text-xs text-slate-500">No posts</div>}
      </div>
    </div>
  );
}

function ListView({ schedules, onEdit, onDelete, onMarkPosted, onMarkFailed, onInputPerformance, workingId }: { schedules: SchedulerItem[]; onEdit: (schedule: SchedulerItem) => void; onDelete: (schedule: SchedulerItem) => void; onMarkPosted: (schedule: SchedulerItem) => void; onMarkFailed: (schedule: SchedulerItem) => void; onInputPerformance: (schedule: SchedulerItem) => void; workingId: string | null }) {
  if (!schedules.length) {
    return (
      <div className="grid min-h-72 place-items-center rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-8 text-center">
        <div>
          <List className="mx-auto mb-4 h-10 w-10 text-teal-300" />
          <h3 className="text-xl font-semibold text-white">No schedules found</h3>
          <p className="mt-2 max-w-sm text-sm text-slate-400">Adjust filters or create a schedule from approved Content Library items.</p>
          <Link href="/library" className="mt-5 inline-flex rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500">Review Approved Content</Link>
        </div>
      </div>
    );
  }
  return <div className="grid gap-3">{schedules.map((schedule) => <ScheduleCard key={schedule.id} schedule={schedule} onEdit={onEdit} onDelete={onDelete} onMarkPosted={onMarkPosted} onMarkFailed={onMarkFailed} onInputPerformance={onInputPerformance} working={workingId === schedule.id} wide />)}</div>;
}

function ScheduleCard({ schedule, onEdit, onDelete, onMarkPosted, onMarkFailed, onInputPerformance, working, wide = false }: { schedule: SchedulerItem; onEdit: (schedule: SchedulerItem) => void; onDelete: (schedule: SchedulerItem) => void; onMarkPosted: (schedule: SchedulerItem) => void; onMarkFailed: (schedule: SchedulerItem) => void; onInputPerformance: (schedule: SchedulerItem) => void; working: boolean; wide?: boolean }) {
  return (
    <article className={clsx("rounded-xl border border-white/10 bg-slate-950/70 p-3", wide && "md:flex md:items-start md:justify-between md:gap-4")}>
      <div>
        <div className="mb-2 flex flex-wrap gap-1.5 text-[11px] font-semibold">
          <span className="rounded-full bg-teal-300 px-2 py-0.5 text-slate-950">{schedule.time}</span>
          <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-slate-200">{statusLabels[schedule.status]}</span>
          <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-slate-200">{schedule.publishMode}</span>
          <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-slate-200">{schedule.contentType}</span>
        </div>
        <h3 className="line-clamp-2 text-sm font-semibold text-white">{schedule.contentTitle}</h3>
        <p className="mt-1 text-xs leading-5 text-slate-400">{schedule.platformLabel} - {schedule.socialAccount}</p>
        <p className="text-xs leading-5 text-slate-500">{schedule.project}</p>
        {schedule.postUrl ? <p className="mt-1 break-all text-[11px] text-teal-200">{schedule.postUrl}</p> : null}
        <p className="mt-1 text-[11px] text-slate-500">{schedule.analyticsRecorded ? "Performance recorded" : "Performance pending"}</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 md:mt-0">
        <button type="button" disabled={working || schedule.status === "POSTED"} onClick={() => onMarkPosted(schedule)} className="rounded-lg bg-emerald-400/10 p-2 text-emerald-100 disabled:opacity-40" title="Mark as Posted"><CheckCircle2 className="h-3.5 w-3.5" /></button>
        <button type="button" disabled={working || schedule.status === "FAILED"} onClick={() => onMarkFailed(schedule)} className="rounded-lg bg-rose-400/10 p-2 text-rose-100 disabled:opacity-40" title="Mark as Failed"><XCircle className="h-3.5 w-3.5" /></button>
        <button type="button" disabled={working} onClick={() => onInputPerformance(schedule)} className="rounded-lg bg-teal-300/10 p-2 text-teal-100 disabled:opacity-40" title="Input Performance"><BarChart3 className="h-3.5 w-3.5" /></button>
        <button type="button" disabled={working} onClick={() => onEdit(schedule)} className="rounded-lg bg-white/[0.08] p-2 text-slate-200 disabled:opacity-40"><Edit3 className="h-3.5 w-3.5" /></button>
        <button type="button" disabled={working} onClick={() => onDelete(schedule)} className="rounded-lg bg-rose-400/10 p-2 text-rose-200 disabled:opacity-40"><Trash2 className="h-3.5 w-3.5" /></button>
      </div>
    </article>
  );
}

function Filter({ label, value, options, onChange }: { label: string; value: string; options: string[][]; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium text-slate-300">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="premium-input px-3 py-2">
        {options.map(([optionValue, optionLabel]) => <option key={`${label}-${optionValue}`} value={optionValue}>{optionLabel}</option>)}
      </select>
    </label>
  );
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">{label}</span>
      <input type="date" value={value} onChange={(e) => onChange(e.target.value)} className="premium-input px-4 py-3" />
    </label>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">{label}</span>
      {children}
    </label>
  );
}

function PostedModal({ form, setForm, loading, onCancel, onConfirm }: { form: { postUrl: string; postedAt: string; notes: string }; setForm: (form: { postUrl: string; postedAt: string; notes: string }) => void; loading: boolean; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <div className="glass w-full max-w-lg rounded-2xl p-5">
        <h2 className="text-xl font-semibold text-white">Mark as Posted</h2>
        <div className="mt-4 space-y-4">
          <Field label="Post URL"><input value={form.postUrl} onChange={(e) => setForm({ ...form, postUrl: e.target.value })} className="premium-input px-4 py-3" /></Field>
          <Field label="Posted At"><input type="datetime-local" value={form.postedAt} onChange={(e) => setForm({ ...form, postedAt: e.target.value })} className="premium-input px-4 py-3" /></Field>
          <Field label="Notes"><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="premium-input px-4 py-3" /></Field>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" disabled={loading} onClick={onCancel} className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Cancel</button>
          <button type="button" disabled={loading || !form.postUrl} onClick={onConfirm} className="inline-flex items-center gap-2 rounded-xl bg-teal-300 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"><Send className="h-4 w-4" />Mark Posted</button>
        </div>
      </div>
    </div>
  );
}

function PerformanceModal({ form, setForm, loading, onCancel, onConfirm }: { form: { postUrl: string; postedAt: string; views: number; likes: number; comments: number; shares: number; saves: number; watchTime: number; averageViewDuration: number; followersGained: number; notes: string }; setForm: (form: { postUrl: string; postedAt: string; views: number; likes: number; comments: number; shares: number; saves: number; watchTime: number; averageViewDuration: number; followersGained: number; notes: string }) => void; loading: boolean; onCancel: () => void; onConfirm: () => void }) {
  const engagementRate = form.views ? (((form.likes + form.comments + form.shares + form.saves) / form.views) * 100).toFixed(2) : "0.00";
  const setNumber = (key: keyof typeof form, value: string) => setForm({ ...form, [key]: Math.max(0, Number(value) || 0) });
  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/70 p-4">
      <div className="glass w-full max-w-3xl rounded-2xl p-5">
        <h2 className="text-xl font-semibold text-white">Input Performance</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Post URL"><input value={form.postUrl} onChange={(e) => setForm({ ...form, postUrl: e.target.value })} className="premium-input px-4 py-3" /></Field>
          <Field label="Posted At"><input type="datetime-local" value={form.postedAt} onChange={(e) => setForm({ ...form, postedAt: e.target.value })} className="premium-input px-4 py-3" /></Field>
          {(["views", "likes", "comments", "shares", "saves", "watchTime", "averageViewDuration", "followersGained"] as const).map((key) => (
            <Field key={key} label={key.replace(/([A-Z])/g, " $1")}>
              <input type="number" min={0} value={form[key]} onChange={(e) => setNumber(key, e.target.value)} className="premium-input px-4 py-3" />
            </Field>
          ))}
          <Field label="Notes"><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="premium-input px-4 py-3" /></Field>
          <div className="rounded-2xl border border-teal-300/20 bg-teal-300/10 p-4">
            <div className="text-sm text-teal-100">Engagement Rate</div>
            <div className="mt-2 text-3xl font-semibold text-white">{engagementRate}%</div>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" disabled={loading} onClick={onCancel} className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Cancel</button>
          <button type="button" disabled={loading} onClick={onConfirm} className="inline-flex items-center gap-2 rounded-xl bg-teal-300 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"><BarChart3 className="h-4 w-4" />Save Performance</button>
        </div>
      </div>
    </div>
  );
}

function Toast({ type, message, onClose }: { type: "success" | "error"; message: string; onClose: () => void }) {
  return (
    <div className={`fixed right-4 top-4 z-50 max-w-sm rounded-2xl border p-4 text-sm shadow-glow ${type === "success" ? "border-teal-300/30 bg-teal-950 text-teal-50" : "border-rose-300/30 bg-rose-950 text-rose-50"}`}>
      <div className="flex items-start justify-between gap-4">
        <span>{message}</span>
        <button type="button" onClick={onClose} className="opacity-70 hover:opacity-100">Close</button>
      </div>
    </div>
  );
}
