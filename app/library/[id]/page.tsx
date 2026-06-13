"use client";

/* eslint-disable @next/next/no-img-element */

import clsx from "clsx";
import { Archive, ArrowLeft, CheckCircle2, Copy, GitBranch, History, RotateCcw, Save, Send, ThumbsDown, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { assetStatusBadgeClasses, assetStatusLabels, contentStatusLabels, socialPlatformLabels, statusBadgeClasses, workflowStatuses } from "@/lib/content-library";
import type { ContentStatus, LibraryAssetStatus, LibraryItemDto, SocialPlatform } from "@/lib/types";

type FormState = {
  title: string;
  description: string;
  caption: string;
  tags: string;
  status: ContentStatus;
  platform?: SocialPlatform;
  assetStatus: LibraryAssetStatus;
  versionNotes: string;
};

export default function LibraryDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [item, setItem] = useState<LibraryItemDto | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [modal, setModal] = useState<{ type: "approve" | "reject"; title: string } | null>(null);
  const [approvalText, setApprovalText] = useState("");

  useEffect(() => {
    fetch(`/api/library/${params.id}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Content not found.");
        setItem(data.item);
        setForm({
          title: data.item.title,
          description: data.item.description,
          caption: data.item.caption,
          tags: data.item.tags.join(", "),
          status: data.item.status,
          platform: data.item.platform,
          assetStatus: data.item.assetStatus,
          versionNotes: data.item.versionNotes
        });
      })
      .catch((error) => setToast({ type: "error", message: error instanceof Error ? error.message : "Gagal memuat detail." }))
      .finally(() => setLoading(false));
  }, [params.id]);

  async function saveChanges() {
    if (!form) return;
    setWorking(true);
    try {
      const response = await fetch(`/api/library/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          caption: form.caption,
          tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
          status: form.status,
          platform: form.platform,
          assetStatus: form.assetStatus,
          versionNotes: form.versionNotes
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Gagal menyimpan perubahan.");
      setItem(data.item);
      setToast({ type: "success", message: "Content berhasil disimpan ke Supabase." });
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Gagal menyimpan perubahan." });
    } finally {
      setWorking(false);
    }
  }

  async function duplicateItem() {
    setWorking(true);
    try {
      const response = await fetch(`/api/library/${params.id}/duplicate`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Gagal duplicate content.");
      setToast({ type: "success", message: "Content berhasil diduplicate." });
      router.push(`/library/${data.item.id}`);
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Gagal duplicate content." });
      setWorking(false);
    }
  }

  async function createVersion() {
    setWorking(true);
    try {
      const response = await fetch(`/api/assets/${params.id}/version`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionNotes: form?.versionNotes || "New iteration for review." })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Gagal membuat version baru.");
      setToast({ type: "success", message: "Version baru berhasil dibuat." });
      router.push(`/library/${data.item.id}`);
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Gagal membuat version baru." });
      setWorking(false);
    }
  }

  async function assetLifecycle(action: "archive" | "trash" | "restore") {
    setWorking(true);
    try {
      const response = await fetch(`/api/assets/${params.id}/${action}`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Asset lifecycle gagal.");
      setItem(data.item);
      setForm((current) => current ? { ...current, assetStatus: data.item.assetStatus, versionNotes: data.item.versionNotes } : current);
      setToast({ type: "success", message: `Asset ${action} berhasil.` });
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Asset lifecycle gagal." });
    } finally {
      setWorking(false);
    }
  }

  async function sendTelegramApproval() {
    setWorking(true);
    try {
      const response = await fetch("/api/telegram/send-approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentItemId: params.id, action: item?.workflowStatus === "APPROVED" ? "SENT_APPROVED" : "SENT_REVIEW" })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Telegram approval gagal dikirim.");
      setToast({
        type: data.log?.status === "FAILED" ? "error" : "success",
        message: data.log?.status === "FAILED" ? data.log.errorMessage ?? "Telegram not connected." : "Telegram approval notification sent."
      });
      const refreshed = await fetch(`/api/library/${params.id}`).then((res) => res.json());
      if (refreshed.item) setItem(refreshed.item);
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Telegram approval gagal dikirim." });
    } finally {
      setWorking(false);
    }
  }

  async function deleteItem() {
    if (!window.confirm("Permanent delete asset ini? Data yang terhapus tidak bisa dikembalikan.")) return;
    setWorking(true);
    try {
      const response = await fetch(`/api/library/${params.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Gagal menghapus content.");
      router.push("/library");
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Gagal menghapus content." });
      setWorking(false);
    }
  }

  async function sendToScheduler() {
    setWorking(true);
    try {
      const response = await fetch(`/api/library/${params.id}/send-to-scheduler`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Gagal mengirim ke scheduler.");
      setToast({ type: "success", message: `Content dikirim ke Scheduler sebagai draft (${data.scheduleId}).` });
      setItem((current) => (current ? { ...current, workflowStatus: "SCHEDULED", workflowStatusLabel: "Scheduled", status: "SCHEDULED", statusLabel: "Scheduled" } : current));
      setForm((current) => (current ? { ...current, status: "SCHEDULED" } : current));
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Gagal mengirim ke scheduler." });
    } finally {
      setWorking(false);
    }
  }

  async function transitionWorkflow(action: "review" | "approve" | "reject", text = "") {
    setWorking(true);
    try {
      const response = await fetch(`/api/content/${params.id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: text, reason: action === "reject" ? text : undefined, actionBy: "Admin" })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Workflow gagal diupdate.");
      setItem(data.item);
      setForm((current) => (current ? { ...current, status: data.item.workflowStatus } : current));
      setToast({ type: "success", message: `Workflow diupdate ke ${data.item.workflowStatusLabel}.` });
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Workflow gagal diupdate." });
    } finally {
      setWorking(false);
    }
  }

  async function confirmApproval() {
    if (!modal) return;
    if (modal.type === "reject" && !approvalText.trim()) {
      setToast({ type: "error", message: "Reject reason wajib diisi." });
      return;
    }
    await transitionWorkflow(modal.type, approvalText);
    setModal(null);
    setApprovalText("");
  }

  if (loading) {
    return <div className="glass rounded-2xl p-6 text-slate-300">Loading content detail...</div>;
  }

  if (!item || !form) {
    return (
      <div className="glass rounded-2xl p-6">
        <h1 className="text-2xl font-semibold text-white">Content not found</h1>
        <Link href="/library" className="mt-4 inline-flex text-teal-200">Back to Content Library</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast ? <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} /> : null}
      {modal ? (
        <ConfirmModal
          type={modal.type}
          title={modal.title}
          value={approvalText}
          onChange={setApprovalText}
          onCancel={() => {
            setModal(null);
            setApprovalText("");
          }}
          onConfirm={confirmApproval}
        />
      ) : null}
      <Link href="/library" className="inline-flex items-center gap-2 text-sm font-semibold text-teal-200">
        <ArrowLeft className="h-4 w-4" />
        Back to Content Library
      </Link>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="glass overflow-hidden rounded-2xl">
          <div className="relative aspect-[4/5] bg-slate-950">
            <img src={item.thumbnail} alt="" className="h-full w-full object-cover opacity-65 mix-blend-luminosity" />
            <div className="absolute left-5 top-5 rounded-full bg-slate-950/80 px-3 py-1 text-sm font-semibold text-teal-100">{item.typeLabel}</div>
            {item.generationMode ? <div className={clsx("absolute right-5 top-5 rounded-full border bg-slate-950/85 px-3 py-1 text-xs font-semibold uppercase", item.isDummyGeneration ? "border-amber-300/30 text-amber-100" : "border-teal-300/30 text-teal-100")}>{item.isDummyGeneration ? "NOT CONNECTED" : "REAL"}</div> : null}
            <div className="absolute bottom-5 left-5 right-5">
              <div className={clsx("mb-2 inline-flex rounded-full border px-3 py-1 text-xs font-semibold", statusBadgeClasses[item.workflowStatus])}>{item.workflowStatusLabel}</div>
              <h1 className="text-2xl font-semibold text-white">{form.title}</h1>
              <p className="mt-2 text-sm leading-6 text-slate-300">{form.caption || item.caption}</p>
            </div>
          </div>
          {item.isDummyGeneration ? <div className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100">Provider NOT CONNECTED. Output ini bukan response provider asli.{item.generationWarning ? ` ${item.generationWarning}` : ""}</div> : null}
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="mb-5">
            <h2 className="text-2xl font-semibold text-white">Detail Preview Content</h2>
            <p className="mt-2 text-sm text-slate-400">{item.project} - {item.socialAccount} - {item.platformLabel}</p>
          </div>

          <div className="grid gap-4">
            <Field label="Title">
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="premium-input px-4 py-3" />
            </Field>
            <Field label="Description">
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="premium-input px-4 py-3" />
            </Field>
            <Field label="Caption">
              <textarea value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} rows={4} className="premium-input px-4 py-3" />
            </Field>
            <Field label="Tags">
              <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="premium-input px-4 py-3" />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Status Workflow">
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ContentStatus })} className="premium-input px-4 py-3">
                  {workflowStatuses.map((status) => (
                    <option key={status} value={status}>{contentStatusLabels[status]}</option>
                  ))}
                </select>
              </Field>
              <Field label="Platform">
                <select value={form.platform ?? ""} onChange={(e) => setForm({ ...form, platform: e.target.value as SocialPlatform })} className="premium-input px-4 py-3">
                  {Object.entries(socialPlatformLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </Field>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Approval</h3>
                <p className="mt-1 text-sm text-slate-400">Konten harus Approved sebelum bisa masuk Scheduler.</p>
              </div>
              <span className={clsx("w-fit rounded-full border px-3 py-1 text-xs font-semibold", statusBadgeClasses[item.workflowStatus])}>
                {item.workflowStatusLabel}
              </span>
            </div>

            <div className="grid gap-3 text-sm md:grid-cols-2">
              <Info label="Review notes" value={item.reviewNotes || "Belum ada catatan review."} />
              <Info label="Reject reason" value={item.rejectReason || "Tidak ada alasan reject."} />
              <Info label="Updated by" value={item.approvedBy || "Admin"} />
              <Info label="Updated at" value={item.approvedAt ? new Date(item.approvedAt).toLocaleString("id-ID") : "Belum approved"} />
              <Info label="Asset status" value={item.assetStatusLabel} />
              <Info label="Version" value={`v${item.versionNumber}${item.isLatestVersion ? " latest" : ""}`} />
            </div>

            <div className="mt-4 grid gap-2 md:grid-cols-3">
              <button type="button" disabled={working || item.workflowStatus !== "DRAFT"} onClick={() => transitionWorkflow("review", "Ready for admin review.")} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.07] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45">
                <Send className="h-4 w-4" />
                Send to Review
              </button>
              <button type="button" disabled={working || item.workflowStatus !== "REVIEW"} onClick={() => setModal({ type: "approve", title: item.title })} className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-300 px-4 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-45">
                <CheckCircle2 className="h-4 w-4" />
                Approve
              </button>
              <button type="button" disabled={working || item.workflowStatus !== "REVIEW"} onClick={() => setModal({ type: "reject", title: item.title })} className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm font-semibold text-rose-100 disabled:cursor-not-allowed disabled:opacity-45">
                <ThumbsDown className="h-4 w-4" />
                Reject
              </button>
            </div>
            <button type="button" disabled={working || !["REVIEW", "APPROVED"].includes(item.workflowStatus)} onClick={sendTelegramApproval} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-teal-300/20 bg-teal-300/10 px-4 py-3 text-sm font-semibold text-teal-100 disabled:cursor-not-allowed disabled:opacity-45">
              <Send className="h-4 w-4" />
              Send to Telegram Approval
            </button>

            <div className="mt-5">
              <div className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-200">
                <History className="h-4 w-4 text-teal-200" />
                Approval History
              </div>
              {item.approvalHistory?.length ? (
                <div className="space-y-2">
                  {item.approvalHistory.map((history) => (
                    <div key={history.id} className="rounded-xl border border-white/10 bg-slate-950/50 p-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                        <span className={clsx("rounded-full border px-2 py-1", statusBadgeClasses[history.fromStatus])}>{contentStatusLabels[history.fromStatus]}</span>
                        <span className="text-slate-500">to</span>
                        <span className={clsx("rounded-full border px-2 py-1", statusBadgeClasses[history.toStatus])}>{contentStatusLabels[history.toStatus]}</span>
                        <span className="text-slate-500">by {history.actionBy}</span>
                        <span className="text-slate-500">{new Date(history.createdAt).toLocaleString("id-ID")}</span>
                      </div>
                      {history.note || history.reason ? <p className="mt-2 text-sm text-slate-300">{history.reason || history.note}</p> : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-slate-400">Belum ada approval history.</div>
              )}
            </div>

            <div className="mt-5">
              <div className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-200">
                <Send className="h-4 w-4 text-teal-200" />
                Telegram Approval Log
              </div>
              {item.telegramApprovalLogs?.length ? (
                <div className="space-y-2">
                  {item.telegramApprovalLogs.map((log) => (
                    <div key={log.id} className="rounded-xl border border-white/10 bg-slate-950/50 p-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                        <span className="rounded-full bg-teal-300/10 px-2 py-1 text-teal-100">{log.action.replaceAll("_", " ")}</span>
                        <span className="rounded-full bg-white/[0.06] px-2 py-1 text-white">{log.status}</span>
                        <span className="text-slate-500">{new Date(log.createdAt).toLocaleString("id-ID")}</span>
                      </div>
                      {log.errorMessage ? <p className="mt-2 text-sm text-rose-200">{log.errorMessage}</p> : null}
                      {log.responseBy ? <p className="mt-2 text-sm text-slate-300">Response by {log.responseBy}</p> : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-slate-400">Belum ada log Telegram. Jika Telegram belum connect, approval tetap bisa dari dashboard.</div>
              )}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Metadata & Versioning</h3>
                <p className="mt-1 text-sm text-slate-400">Kelola lifecycle asset, collection, dan versi konten.</p>
              </div>
              <span className={clsx("w-fit rounded-full border px-3 py-1 text-xs font-semibold", assetStatusBadgeClasses[item.assetStatus])}>{item.assetStatusLabel}</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Asset Status">
                <select value={form.assetStatus} onChange={(e) => setForm({ ...form, assetStatus: e.target.value as LibraryAssetStatus })} className="premium-input px-4 py-3">
                  {Object.entries(assetStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </Field>
              <Field label="Version Notes">
                <input value={form.versionNotes} onChange={(e) => setForm({ ...form, versionNotes: e.target.value })} className="premium-input px-4 py-3" />
              </Field>
            </div>
            <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
              <Info label="Content Type" value={item.typeLabel} />
              <Info label="Source Type" value={item.sourceType || "Manual"} />
              <Info label="Collections" value={item.collections?.map((collection) => collection.name).join(", ") || "Belum masuk folder."} />
              <Info label="Created Date" value={item.date} />
              <Info label="Project" value={item.project} />
              <Info label="Social Account" value={item.socialAccount} />
              <Info label="Generation Source" value={item.generationMode ? (item.isDummyGeneration ? "NOT CONNECTED" : "REAL") : "Manual or non-provider asset"} />
              <Info label="Provider" value={item.generationProvider?.replaceAll("_", " ") || "Not recorded"} />
              <Info label="Model" value={item.generationModel || "Not recorded"} />
              <Info label="Generation Type" value={item.generationType?.replaceAll("_", " ") || item.typeLabel} />
              <Info label="Generation Status" value={item.generationStatus || "Not recorded"} />
              <Info label="Output Source" value={item.generationOutputSource || "Not recorded"} />
              <Info label="Original Prompt" value={item.originalPrompt || "Not recorded"} />
              <Info label="Final Prompt" value={item.finalPrompt || "Not recorded"} />
            </div>
            <div className="mt-5">
              <div className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-200">
                <GitBranch className="h-4 w-4 text-teal-200" />
                Version History
              </div>
              <div className="space-y-2">
                {[{ id: item.id, title: item.title, versionNumber: item.versionNumber, isLatestVersion: item.isLatestVersion, versionNotes: item.versionNotes, assetStatus: item.assetStatus, createdAt: item.date }, ...(item.versionHistory ?? [])].map((version) => (
                  <Link key={`${version.id}-${version.versionNumber}`} href={`/library/${version.id}`} className="block rounded-xl border border-white/10 bg-slate-950/50 p-3 hover:border-teal-300/30">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                      <span className="rounded-full bg-teal-300/10 px-2 py-1 text-teal-100">v{version.versionNumber}</span>
                      <span className={clsx("rounded-full border px-2 py-1", assetStatusBadgeClasses[version.assetStatus])}>{assetStatusLabels[version.assetStatus]}</span>
                      {version.isLatestVersion ? <span className="rounded-full bg-white/[0.06] px-2 py-1 text-white">Latest</span> : null}
                    </div>
                    <div className="mt-2 text-sm font-semibold text-white">{version.title}</div>
                    <p className="mt-1 text-sm text-slate-400">{version.versionNotes || "No version notes."}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <h3 className="text-lg font-semibold text-white">Posting & Performance</h3>
            <p className="mt-1 text-sm text-slate-400">Ringkasan manual posting dan analytics untuk content ini.</p>
            <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
              <Info label="Schedule status" value={item.scheduleStatus || "Belum dijadwalkan"} />
              <Info label="Analytics status" value={item.analyticsStatus || "Pending"} />
              <Info label="Post URL" value={item.postUrl || "Belum ada URL posting."} />
              <Info label="Engagement rate" value={item.performanceSummary ? `${item.performanceSummary.engagementRate}%` : "Belum ada data."} />
              <Info label="Views" value={item.performanceSummary ? String(item.performanceSummary.views) : "0"} />
              <Info label="Likes / Comments / Shares" value={item.performanceSummary ? `${item.performanceSummary.likes} / ${item.performanceSummary.comments} / ${item.performanceSummary.shares}` : "0 / 0 / 0"} />
              <Info label="Saves / Followers" value={item.performanceSummary ? `${item.performanceSummary.saves} / ${item.performanceSummary.followersGained}` : "0 / 0"} />
              <Info label="Watch time" value={item.performanceSummary ? `${item.performanceSummary.watchTime}s` : "0s"} />
            </div>
            <div className="mt-5">
              <div className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-200">
                <History className="h-4 w-4 text-teal-200" />
                Publishing History
              </div>
              {item.publishingHistory?.length ? (
                <div className="space-y-2">
                  {item.publishingHistory.map((history) => (
                    <div key={history.id} className="rounded-xl border border-white/10 bg-slate-950/50 p-3 text-sm text-slate-300">
                      <span className="font-semibold text-white">{history.platform}</span> - {history.socialAccount} - {history.status} {history.scheduledAt ? `- ${new Date(history.scheduledAt).toLocaleString("id-ID")}` : ""}
                    </div>
                  ))}
                </div>
              ) : <div className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-slate-400">Belum ada publishing history.</div>}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <h3 className="text-lg font-semibold text-white">Agent Recommendations</h3>
            <p className="mt-1 text-sm text-slate-400">Rule-based AI Agent insight terkait asset ini.</p>
            <div className="mt-4 space-y-3">
              {item.agentRecommendations?.length ? item.agentRecommendations.map((recommendation) => (
                <div key={recommendation.id} className="rounded-xl border border-white/10 bg-slate-950/50 p-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-teal-300/10 px-2 py-1 text-teal-100">{recommendation.agentName ?? "AI Agent"}</span>
                    <span className="rounded-full bg-white/[0.06] px-2 py-1 text-white">{recommendation.priority}</span>
                    <span className="text-slate-500">Score {recommendation.score}</span>
                  </div>
                  <div className="mt-2 font-semibold text-white">{recommendation.title}</div>
                  <p className="mt-1 text-sm text-slate-400">{recommendation.description}</p>
                </div>
              )) : <div className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-slate-400">Belum ada rekomendasi agent. Jalankan agent dari menu AI Agents.</div>}
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <button type="button" disabled={working} onClick={saveChanges} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-300 px-5 py-3 font-semibold text-slate-950 shadow-glow disabled:opacity-60">
              <Save className="h-5 w-5" />
              Save Changes
            </button>
            <button type="button" disabled={working || item.workflowStatus !== "APPROVED"} onClick={sendToScheduler} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45">
              <Send className="h-5 w-5" />
              {item.workflowStatus === "APPROVED" ? "Send to Scheduler" : "Approved required"}
            </button>
            <button type="button" disabled={working} onClick={duplicateItem} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 font-semibold text-white disabled:opacity-60">
              <Copy className="h-5 w-5" />
              Duplicate
            </button>
            <button type="button" disabled={working} onClick={createVersion} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 font-semibold text-white disabled:opacity-60">
              <GitBranch className="h-5 w-5" />
              Create New Version
            </button>
            <button type="button" disabled={working || item.assetStatus === "ARCHIVED"} onClick={() => assetLifecycle("archive")} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-300/20 bg-amber-400/10 px-5 py-3 font-semibold text-amber-100 disabled:opacity-60">
              <Archive className="h-5 w-5" />
              Archive
            </button>
            <button type="button" disabled={working || item.assetStatus === "ACTIVE"} onClick={() => assetLifecycle("restore")} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 font-semibold text-white disabled:opacity-60">
              <RotateCcw className="h-5 w-5" />
              Restore
            </button>
            <button type="button" disabled={working || item.assetStatus === "TRASHED"} onClick={() => assetLifecycle("trash")} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-300/20 bg-rose-400/10 px-5 py-3 font-semibold text-rose-100 disabled:opacity-60">
              <Trash2 className="h-5 w-5" />
              Move to Trash
            </button>
            <button type="button" disabled={working} onClick={deleteItem} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-300/20 bg-rose-400/10 px-5 py-3 font-semibold text-rose-100 disabled:opacity-60">
              <Trash2 className="h-5 w-5" />
              Permanent Delete
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
      <div className="text-xs font-semibold uppercase text-slate-500">{label}</div>
      <div className="mt-1 text-slate-200">{value}</div>
    </div>
  );
}

function ConfirmModal({ type, title, value, onChange, onCancel, onConfirm }: { type: "approve" | "reject"; title: string; value: string; onChange: (value: string) => void; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <div className="glass w-full max-w-lg rounded-2xl p-5">
        <h2 className="text-xl font-semibold text-white">{type === "approve" ? "Approve Content" : "Reject Content"}</h2>
        <p className="mt-2 text-sm text-slate-400">{title}</p>
        <label className="mt-4 block">
          <span className="mb-2 block text-sm font-medium text-slate-300">{type === "approve" ? "Review notes" : "Reject reason"}</span>
          <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} className="premium-input px-4 py-3" />
        </label>
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white">Cancel</button>
          <button type="button" onClick={onConfirm} className={clsx("rounded-xl px-4 py-2 text-sm font-semibold", type === "approve" ? "bg-teal-300 text-slate-950" : "bg-rose-400 text-white")}>
            {type === "approve" ? "Approve" : "Reject"}
          </button>
        </div>
      </div>
    </div>
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
