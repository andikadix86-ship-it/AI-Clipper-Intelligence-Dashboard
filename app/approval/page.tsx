"use client";

/* eslint-disable @next/next/no-img-element */

import { AlertCircle, CheckCircle2, ClipboardCheck, Loader2, RotateCcw, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import type { LibraryItemDto } from "@/lib/types";

export default function ApprovalQueuePage() {
  const [items, setItems] = useState<LibraryItemDto[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [telegramStatus, setTelegramStatus] = useState("NOT_CONNECTED");

  useEffect(() => {
    loadQueue();
    fetch("/api/telegram/settings").then((response) => response.json()).then((data) => setTelegramStatus(data.setting?.status ?? "NOT_CONNECTED")).catch(() => setTelegramStatus("NOT_CONNECTED"));
  }, []);

  async function loadQueue() {
    setLoading(true);
    try {
      const response = await fetch("/api/approval");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Approval queue gagal dimuat.");
      setItems(data.items ?? []);
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Approval queue gagal dimuat." });
    } finally {
      setLoading(false);
    }
  }

  async function runAction(item: LibraryItemDto, action: "approve" | "reject" | "send-back-review") {
    const note = notes[item.id]?.trim() ?? "";
    if (action === "reject" && !note) {
      setToast({ type: "error", message: "Alasan reject wajib diisi." });
      return;
    }
    setWorkingId(item.id);
    try {
      const response = await fetch(`/api/content/${item.id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action === "reject" ? { reason: note, note, actionBy: "Admin" } : { note, actionBy: "Admin" })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Status content gagal diperbarui.");
      setToast({ type: "success", message: action === "approve" ? "Content disetujui dan siap dijadwalkan." : action === "reject" ? "Content ditolak." : "Content dikembalikan ke review." });
      await loadQueue();
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Status content gagal diperbarui." });
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {toast ? <Toast {...toast} onClose={() => setToast(null)} /> : null}
      <header>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-sm text-sky-100">
          <ClipboardCheck className="h-4 w-4" />
          Approval Queue
        </div>
        <h1 className="text-3xl font-semibold text-white md:text-5xl">Content Approval</h1>
        <p className="mt-3 max-w-3xl text-slate-300">Review asset yang menunggu keputusan admin sebelum dikirim ke Scheduler.</p>
      </header>
      {telegramStatus !== "CONNECTED" ? <div className="rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">Telegram approval setup required. Approval dashboard tetap aktif. Konfigurasikan Bot Token dan Chat ID lalu jalankan Test Connection di Settings.</div> : null}

      {loading ? <div className="rounded-xl border border-white/10 bg-white/[0.04] p-6 text-slate-300">Loading approval queue...</div> : null}
      {!loading && !items.length ? (
        <div className="grid min-h-64 place-items-center rounded-xl border border-dashed border-white/10 bg-white/[0.03] p-8 text-center">
          <div>
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-300" />
            <h2 className="mt-4 text-xl font-semibold text-white">Tidak ada content menunggu approval</h2>
            <p className="mt-2 text-sm text-slate-400">Kirim draft ke Review dari Content Library saat asset sudah siap diperiksa.</p>
            <a href="/library" className="mt-5 inline-flex rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white">Open Content Library</a>
          </div>
        </div>
      ) : null}

      <section className="grid gap-4">
        {items.map((item) => (
          <article key={item.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
            <div className="grid gap-5 lg:grid-cols-[132px_1fr_300px]">
              <img src={item.thumbnail} alt="" className="aspect-[4/5] w-full rounded-lg object-cover" />
              <div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge>{item.workflowStatusLabel}</Badge>
                  <Badge>{item.typeLabel}</Badge>
                  <Badge>{item.platformLabel}</Badge>
                </div>
                <h2 className="mt-3 text-xl font-semibold text-white">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">{item.originalPrompt || item.description || "Prompt belum tersedia."}</p>
                <dl className="mt-4 grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
                  <div><dt className="text-slate-500">Source</dt><dd>{item.sourceType || "Content Library"}</dd></div>
                  <div><dt className="text-slate-500">Campaign / Project</dt><dd>{item.project}</dd></div>
                  <div><dt className="text-slate-500">Provider</dt><dd>{item.generationProvider || "Manual"}</dd></div>
                  <div><dt className="text-slate-500">Model</dt><dd>{item.generationModel || "Not applicable"}</dd></div>
                </dl>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Reviewer note</label>
                <textarea value={notes[item.id] ?? ""} onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))} rows={4} className="mt-2 w-full rounded-lg border border-white/10 bg-[#0B1220] px-3 py-2 text-sm text-white outline-none focus:border-sky-400" placeholder="Tambahkan catatan keputusan..." />
                <div className="mt-3 grid gap-2">
                  <button type="button" disabled={workingId === item.id} onClick={() => runAction(item, "approve")} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">{workingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}Approve</button>
                  <button type="button" disabled={workingId === item.id} onClick={() => runAction(item, "reject")} className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-300/20 bg-rose-300/10 px-3 py-2 text-sm font-semibold text-rose-100 disabled:opacity-50"><XCircle className="h-4 w-4" />Reject</button>
                  <button type="button" disabled={workingId === item.id} onClick={() => runAction(item, "send-back-review")} className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-slate-200 disabled:opacity-50"><RotateCcw className="h-4 w-4" />Send Back To Review</button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-slate-300">{children}</span>;
}

function Toast({ type, message, onClose }: { type: "success" | "error"; message: string; onClose: () => void }) {
  return <button type="button" onClick={onClose} className={`fixed right-5 top-5 z-[90] flex max-w-md items-center gap-2 rounded-lg border px-4 py-3 text-left text-sm shadow-xl ${type === "success" ? "border-emerald-300/30 bg-emerald-950 text-emerald-100" : "border-rose-300/30 bg-rose-950 text-rose-100"}`}><AlertCircle className="h-4 w-4" />{message}</button>;
}
