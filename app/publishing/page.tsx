"use client";

/* eslint-disable @next/next/no-img-element */

import clsx from "clsx";
import { BarChart3, CheckCircle2, Clipboard, Download, Loader2, Send, UploadCloud } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type PublishingItem = {
  scheduleId: string;
  projectId?: string;
  contentItemId?: string;
  socialAccountId: string;
  title: string;
  description: string;
  caption: string;
  hashtag: string;
  thumbnail: string;
  assetUrl: string;
  project: string;
  socialAccount: string;
  socialAccountAuthStatus: string;
  platform: string;
  platformLabel: string;
  scheduledAt: string;
  scheduledTime: string;
  status: string;
  publishMode: "MANUAL" | "SEMI_AUTO" | "AUTO";
  publishingJobId?: string;
  publishingJobStatus?: string;
  publishingError?: string;
  contentStatus: string;
  contentType: string;
  postUrl: string;
  postedAt?: string;
  analyticsRecorded: boolean;
  platformPostUrl?: string;
  checklist: {
    assetChecked: boolean;
    captionCopied: boolean;
    hashtagCopied: boolean;
    uploadedManually: boolean;
    postUrlAdded: boolean;
  };
};

const emptyPerformance = {
  views: 0,
  likes: 0,
  comments: 0,
  shares: 0,
  saves: 0,
  watchTime: 0,
  averageViewDuration: 0,
  followersGained: 0,
  notes: ""
};

export default function PublishingPage() {
  const [items, setItems] = useState<PublishingItem[]>([]);
  const [activeTab, setActiveTab] = useState("Ready to Post");
  const [platformFilter, setPlatformFilter] = useState("ALL");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [postedModal, setPostedModal] = useState<PublishingItem | null>(null);
  const [performanceModal, setPerformanceModal] = useState<PublishingItem | null>(null);
  const [publishModal, setPublishModal] = useState<PublishingItem | null>(null);
  const [postedForm, setPostedForm] = useState({ postUrl: "", postedAt: new Date().toISOString().slice(0, 16), notes: "" });
  const [performanceForm, setPerformanceForm] = useState(emptyPerformance);
  const [publishForm, setPublishForm] = useState({ privacyStatus: "private", madeForKids: false, notifySubscribers: false });

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    setLoading(true);
    try {
      const response = await fetch("/api/publishing");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Publishing queue gagal dimuat.");
      setItems(data.items ?? []);
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Publishing queue gagal dimuat." });
    } finally {
      setLoading(false);
    }
  }

  async function copyText(label: string, text: string) {
    await navigator.clipboard.writeText(text || "");
    setToast({ type: "success", message: `${label} copied.` });
  }

  async function saveChecklist(item: PublishingItem, patch: Partial<PublishingItem["checklist"]>) {
    const nextChecklist = { ...item.checklist, ...patch };
    setWorkingId(item.scheduleId);
    try {
      const response = await fetch("/api/publishing/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentItemId: item.contentItemId, postingScheduleId: item.scheduleId, ...nextChecklist })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Checklist gagal disimpan.");
      setItems((current) => current.map((row) => (row.scheduleId === item.scheduleId ? { ...row, checklist: data.checklist } : row)));
      setToast({ type: "success", message: "Checklist tersimpan." });
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Checklist gagal disimpan." });
    } finally {
      setWorkingId(null);
    }
  }

  function openPosted(item: PublishingItem) {
    setPostedForm({ postUrl: item.postUrl ?? "", postedAt: item.postedAt ? item.postedAt.slice(0, 16) : new Date().toISOString().slice(0, 16), notes: "" });
    setPostedModal(item);
  }

  function openPerformance(item: PublishingItem) {
    setPerformanceForm(emptyPerformance);
    setPerformanceModal(item);
  }

  async function markPosted() {
    if (!postedModal) return;
    setWorkingId(postedModal.scheduleId);
    try {
      const response = await fetch("/api/publishing/mark-posted", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postingScheduleId: postedModal.scheduleId, ...postedForm })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Mark as posted gagal.");
      setToast({ type: "success", message: "Content ditandai Posted." });
      setPostedModal(null);
      await loadItems();
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Mark as posted gagal." });
    } finally {
      setWorkingId(null);
    }
  }

  async function publishingAction(item: PublishingItem, action: "start" | "retry" | "cancel") {
    setWorkingId(item.scheduleId);
    try {
      const response = await fetch(`/api/publishing/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postingScheduleId: item.scheduleId, publishMode: item.publishMode })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Publishing action gagal.");
      setToast({ type: "success", message: `Publishing ${action} berhasil. Status ${data.job.status}.` });
      await loadItems();
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Publishing action gagal." });
    } finally {
      setWorkingId(null);
    }
  }

  function canPublishYouTube(item: PublishingItem) {
    return item.platform === "YOUTUBE_SHORTS" && item.socialAccountAuthStatus === "CONNECTED" && ["APPROVED", "SCHEDULED"].includes(item.contentStatus) && ["READY_TO_POST", "SCHEDULED"].includes(item.status) && Boolean(item.assetUrl);
  }

  async function publishYouTubeNow(item: PublishingItem) {
    setWorkingId(item.scheduleId);
    try {
      const response = await fetch("/api/publishing/youtube/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postingScheduleId: item.scheduleId, ...publishForm })
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error ?? data.errorMessage ?? "YouTube publish failed.");
      setToast({ type: "success", message: `YouTube Shorts published: ${data.postUrl}` });
      setPublishModal(null);
      await loadItems();
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "YouTube publish failed." });
      await loadItems();
    } finally {
      setWorkingId(null);
    }
  }

  async function savePerformance() {
    if (!performanceModal) return;
    setWorkingId(performanceModal.scheduleId);
    try {
      const response = await fetch("/api/publishing/input-performance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...performanceForm,
          postingScheduleId: performanceModal.scheduleId,
          contentItemId: performanceModal.contentItemId,
          socialAccountId: performanceModal.socialAccountId,
          projectId: performanceModal.projectId,
          platform: performanceModal.platform,
          postUrl: performanceModal.postUrl,
          postedAt: performanceModal.postedAt
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Performance gagal disimpan.");
      setToast({ type: "success", message: `Performance tersimpan. ER ${data.analytics.engagementRate}%.` });
      setPerformanceModal(null);
      await loadItems();
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Performance gagal disimpan." });
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {toast ? <Toast {...toast} onClose={() => setToast(null)} /> : null}
      {postedModal ? <PostedModal form={postedForm} setForm={setPostedForm} loading={workingId === postedModal.scheduleId} onCancel={() => setPostedModal(null)} onConfirm={markPosted} /> : null}
      {performanceModal ? <PerformanceModal form={performanceForm} setForm={setPerformanceForm} loading={workingId === performanceModal.scheduleId} onCancel={() => setPerformanceModal(null)} onConfirm={savePerformance} /> : null}
      {publishModal ? <PublishModal item={publishModal} form={publishForm} setForm={setPublishForm} loading={workingId === publishModal.scheduleId} onCancel={() => setPublishModal(null)} onConfirm={() => publishYouTubeNow(publishModal)} /> : null}

      <header>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1 text-sm text-teal-100">
          <Send className="h-4 w-4" />
          Publishing Center
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">Publishing Center</h1>
        <p className="mt-3 max-w-3xl text-slate-300">Prepare approved and scheduled content for manual posting, copy assets, track checklist, and record performance.</p>
      </header>

      {loading ? <div className="glass rounded-2xl p-6 text-slate-300">Loading publishing queue...</div> : null}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-2">
        {["Ready to Post", "Manual Upload", "Semi Auto", "Auto Queue", "Posted", "Failed"].map((tab) => (
          <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={clsx("rounded-xl px-4 py-2 text-sm font-semibold", activeTab === tab ? "bg-white text-slate-950" : "text-slate-300 hover:bg-white/[0.08]")}>{tab}</button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {[
          ["ALL", "All Platforms"],
          ["YOUTUBE_SHORTS", "YouTube"],
          ["TIKTOK", "TikTok"],
          ["INSTAGRAM_REELS", "Instagram"],
          ["FACEBOOK_REELS", "Facebook"]
        ].map(([value, label]) => (
          <button key={value} type="button" onClick={() => setPlatformFilter(value)} className={clsx("rounded-lg border px-3 py-2 text-xs font-semibold", platformFilter === value ? "border-sky-300/30 bg-sky-300/10 text-sky-100" : "border-white/10 bg-white/[0.03] text-slate-400 hover:text-white")}>{label}</button>
        ))}
      </div>
      {!loading && !items.length ? (
        <div className="glass grid min-h-72 place-items-center rounded-2xl p-8 text-center">
          <div>
            <UploadCloud className="mx-auto mb-4 h-10 w-10 text-teal-300" />
            <h2 className="text-xl font-semibold text-white">Belum ada konten ready to post</h2>
            <p className="mt-2 max-w-md text-sm text-slate-400">Approve content di Content Library lalu kirim ke Scheduler untuk masuk Publishing Center.</p>
            <Link href="/library" className="mt-5 inline-flex rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500">Review Content Library</Link>
          </div>
        </div>
      ) : null}

      <section className="grid gap-5">
        {items.filter((item) => {
          if (platformFilter !== "ALL" && item.platform !== platformFilter) return false;
          if (activeTab === "Manual Upload") return item.publishMode === "MANUAL";
          if (activeTab === "Semi Auto") return item.publishMode === "SEMI_AUTO";
          if (activeTab === "Auto Queue") return item.publishMode === "AUTO";
          if (activeTab === "Posted") return item.status === "POSTED" || item.publishingJobStatus === "POSTED";
          if (activeTab === "Failed") return item.status === "FAILED" || item.publishingJobStatus === "FAILED";
          return item.status === "READY_TO_POST" || item.status === "SCHEDULED" || item.status === "DRAFT";
        }).map((item) => (
          <article key={item.scheduleId} className="glass rounded-2xl p-5">
            <div className="grid gap-5 xl:grid-cols-[180px_1fr_300px]">
              <img src={item.thumbnail} alt="" className="aspect-[4/5] w-full rounded-2xl object-cover opacity-70 mix-blend-luminosity" />
              <div>
                <div className="mb-3 flex flex-wrap gap-2">
                  <Badge>{item.status}</Badge>
                  <Badge>{item.publishMode}</Badge>
                  {item.publishingJobStatus ? <Badge>{item.publishingJobStatus}</Badge> : null}
                  <Badge>{item.contentType}</Badge>
                  <Badge>{item.platformLabel}</Badge>
                </div>
                <h2 className="text-2xl font-semibold text-white">{item.title}</h2>
                <p className="mt-2 text-sm text-slate-400">{item.project} - {item.socialAccount} - {item.scheduledTime}</p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  <CopyButton label="Copy Title" onClick={() => copyText("Title", item.title)} />
                  <CopyButton label="Copy Caption" onClick={() => copyText("Caption", item.caption)} />
                  <CopyButton label="Copy Hashtag" onClick={() => copyText("Hashtag", item.hashtag)} />
                  <CopyButton label="Copy Description" onClick={() => copyText("Description", item.description)} />
                </div>
                <a href={item.thumbnail} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-white">
                  <Download className="h-4 w-4" />
                  Download asset/video/image
                </a>
                {item.platformPostUrl ? <a href={item.platformPostUrl} target="_blank" rel="noreferrer" className="ml-2 mt-3 inline-flex items-center gap-2 rounded-xl border border-teal-300/20 bg-teal-300/10 px-3 py-2 text-xs font-semibold text-teal-100">Open YouTube Post</a> : null}
              </div>
              <div className="space-y-3">
                <Checklist label="Asset sudah dicek" checked={item.checklist.assetChecked} disabled={workingId === item.scheduleId} onChange={(value) => saveChecklist(item, { assetChecked: value })} />
                <Checklist label="Caption sudah dicopy" checked={item.checklist.captionCopied} disabled={workingId === item.scheduleId} onChange={(value) => saveChecklist(item, { captionCopied: value })} />
                <Checklist label="Hashtag sudah dicopy" checked={item.checklist.hashtagCopied} disabled={workingId === item.scheduleId} onChange={(value) => saveChecklist(item, { hashtagCopied: value })} />
                <Checklist label="Sudah upload manual" checked={item.checklist.uploadedManually} disabled={workingId === item.scheduleId} onChange={(value) => saveChecklist(item, { uploadedManually: value })} />
                <Checklist label="Sudah input link posting" checked={item.checklist.postUrlAdded} disabled={workingId === item.scheduleId} onChange={(value) => saveChecklist(item, { postUrlAdded: value })} />
                <button type="button" onClick={() => openPosted(item)} disabled={workingId === item.scheduleId} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-300 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60">
                  <CheckCircle2 className="h-4 w-4" />
                  Mark as Posted
                </button>
                <button type="button" onClick={() => setPublishModal(item)} disabled={workingId === item.scheduleId || !canPublishYouTube(item)} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-red-500 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">
                  Publish Now
                </button>
                {!canPublishYouTube(item) && item.platform === "YOUTUBE_SHORTS" ? <p className="text-xs leading-5 text-slate-400">Publish Now aktif hanya untuk YouTube connected, content Approved/Scheduled, schedule Ready/Scheduled, dan video output tersedia.</p> : null}
                <button type="button" onClick={() => publishingAction(item, "start")} disabled={workingId === item.scheduleId || item.status === "POSTED"} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-teal-300/20 bg-teal-300/10 px-4 py-3 text-sm font-semibold text-teal-100 disabled:opacity-60">
                  Start Publishing Dummy
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => publishingAction(item, "retry")} disabled={workingId === item.scheduleId} className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">Retry</button>
                  <button type="button" onClick={() => publishingAction(item, "cancel")} disabled={workingId === item.scheduleId} className="rounded-xl border border-rose-300/20 bg-rose-400/10 px-4 py-2 text-sm font-semibold text-rose-100 disabled:opacity-60">Cancel</button>
                </div>
                <button type="button" onClick={() => openPerformance(item)} disabled={workingId === item.scheduleId} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
                  <BarChart3 className="h-4 w-4" />
                  Input Performance
                </button>
                {item.publishingError ? <p className="text-xs leading-5 text-amber-200">{item.publishingError}</p> : null}
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1 text-xs font-semibold text-teal-100">{children}</span>;
}

function CopyButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-white"><Clipboard className="h-4 w-4" />{label}</button>;
}

function Checklist({ label, checked, disabled, onChange }: { label: string; checked: boolean; disabled: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-200">
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-teal-300" />
      {label}
    </label>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm font-medium text-slate-300">{label}</span>{children}</label>;
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
          <button type="button" disabled={loading || !form.postUrl} onClick={onConfirm} className="rounded-xl bg-teal-300 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50">{loading ? "Saving..." : "Save Posted"}</button>
        </div>
      </div>
    </div>
  );
}

function PerformanceModal({ form, setForm, loading, onCancel, onConfirm }: { form: typeof emptyPerformance; setForm: (form: typeof emptyPerformance) => void; loading: boolean; onCancel: () => void; onConfirm: () => void }) {
  const engagementRate = form.views ? (((form.likes + form.comments + form.shares + form.saves) / form.views) * 100).toFixed(2) : "0.00";
  const setNumber = (key: keyof typeof emptyPerformance, value: string) => setForm({ ...form, [key]: Math.max(0, Number(value) || 0) });
  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/70 p-4">
      <div className="glass w-full max-w-3xl rounded-2xl p-5">
        <h2 className="text-xl font-semibold text-white">Input Performance</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
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
          <button type="button" disabled={loading} onClick={onConfirm} className="rounded-xl bg-teal-300 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50">{loading ? "Saving..." : "Save Performance"}</button>
        </div>
      </div>
    </div>
  );
}

function PublishModal({ item, form, setForm, loading, onCancel, onConfirm }: { item: PublishingItem; form: { privacyStatus: string; madeForKids: boolean; notifySubscribers: boolean }; setForm: (form: { privacyStatus: string; madeForKids: boolean; notifySubscribers: boolean }) => void; loading: boolean; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/70 p-4">
      <div className="glass w-full max-w-2xl rounded-2xl p-5">
        <h2 className="text-xl font-semibold text-white">Confirm YouTube Shorts Publish</h2>
        <p className="mt-2 text-sm text-slate-400">Upload real hanya berjalan setelah admin klik Confirm Publish. Token tetap server-side.</p>
        <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm">
          <div><span className="text-slate-500">Title:</span> <span className="text-white">{item.title}</span></div>
          <div><span className="text-slate-500">Account:</span> <span className="text-white">{item.socialAccount}</span></div>
          <div><span className="text-slate-500">Asset:</span> <span className="break-all text-teal-100">{item.assetUrl}</span></div>
          <div><span className="text-slate-500">Description:</span> <span className="text-slate-300">{item.description} #Shorts</span></div>
          <div><span className="text-slate-500">Tags:</span> <span className="text-slate-300">{item.hashtag}</span></div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Field label="Privacy Status">
            <select value={form.privacyStatus} onChange={(e) => setForm({ ...form, privacyStatus: e.target.value })} className="premium-input px-4 py-3">
              <option value="private">Private</option>
              <option value="unlisted">Unlisted</option>
              <option value="public">Public</option>
            </select>
          </Field>
          <label className="mt-7 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-slate-200">
            <input type="checkbox" checked={form.notifySubscribers} onChange={(e) => setForm({ ...form, notifySubscribers: e.target.checked })} className="h-4 w-4 accent-teal-300" />
            Notify subscribers
          </label>
          <label className="mt-7 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-slate-200">
            <input type="checkbox" checked={form.madeForKids} onChange={(e) => setForm({ ...form, madeForKids: e.target.checked })} className="h-4 w-4 accent-teal-300" />
            Made for kids
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" disabled={loading} onClick={onCancel} className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Cancel</button>
          <button type="button" disabled={loading} onClick={onConfirm} className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{loading ? "Publishing..." : "Confirm Publish"}</button>
        </div>
      </div>
    </div>
  );
}

function Toast({ type, message, onClose }: { type: "success" | "error"; message: string; onClose: () => void }) {
  return <div className={clsx("fixed right-4 top-4 z-50 max-w-sm rounded-2xl border p-4 text-sm shadow-glow", type === "success" ? "border-teal-300/30 bg-teal-950 text-teal-50" : "border-rose-300/30 bg-rose-950 text-rose-50")}><div className="flex items-start justify-between gap-4"><span>{message}</span><button type="button" onClick={onClose} className="opacity-70 hover:opacity-100">Close</button></div></div>;
}
