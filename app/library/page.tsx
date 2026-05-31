"use client";

/* eslint-disable @next/next/no-img-element */

import clsx from "clsx";
import { Archive, CalendarClock, CheckCircle2, Copy, FileText, Film, FolderPlus, Grid2X2, ImageIcon, Layers3, Library, Lightbulb, List, PlaySquare, RotateCcw, Search, Send, ThumbsDown, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { assetStatusBadgeClasses, fallbackLibraryItems, statusBadgeClasses } from "@/lib/content-library";
import type { AssetCollectionDto, ContentStatus, LibraryAssetStatus, LibraryItemDto } from "@/lib/types";

const icons = {
  CLIP: Film,
  IMAGE: ImageIcon,
  MOTION_IMAGE: PlaySquare,
  AI_VIDEO: Layers3,
  SCHEDULED_POST: CalendarClock,
  IDEA: Lightbulb,
  SCRIPT: FileText,
  CLIP_PLAN: Film
};

export default function LibraryPage() {
  const [items, setItems] = useState<LibraryItemDto[]>(fallbackLibraryItems);
  const [collections, setCollections] = useState<AssetCollectionDto[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [modal, setModal] = useState<{ type: "approve" | "reject"; item: LibraryItemDto } | null>(null);
  const [approvalText, setApprovalText] = useState("");
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [collectionForm, setCollectionForm] = useState({ name: "", description: "", projectId: "" });
  const [filters, setFilters] = useState({
    search: "",
    project: "All",
    socialAccount: "All",
    type: "All",
    format: "All",
    generationSource: "All",
    workflowStatus: "All",
    assetStatus: "All",
    platform: "All",
    date: ""
  });

  useEffect(() => {
    loadLibrary();
    loadCollections();
  }, []);

  async function loadLibrary() {
    try {
      const response = await fetch("/api/library");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Gagal memuat Content Library.");
      setItems(data.items?.length ? data.items : fallbackLibraryItems);
      if (data.warning) setToast({ type: "error", message: data.warning });
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Gagal memuat Content Library." });
    }
  }

  async function loadCollections() {
    try {
      const response = await fetch("/api/assets/collections");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Gagal memuat collection.");
      setCollections(data.collections ?? []);
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Gagal memuat collection." });
    }
  }

  const options = useMemo(
    () => ({
      project: ["All", ...Array.from(new Set(items.map((item) => item.project)))],
      socialAccount: ["All", ...Array.from(new Set(items.map((item) => item.socialAccount)))],
      type: ["All", ...Array.from(new Set(items.map((item) => item.typeLabel)))],
      workflowStatus: ["All", ...Array.from(new Set(items.map((item) => item.workflowStatusLabel)))],
      assetStatus: ["All", ...Array.from(new Set(items.map((item) => item.assetStatusLabel)))],
      platform: ["All", ...Array.from(new Set(items.map((item) => item.platformLabel)))]
    }),
    [items]
  );

  const projectOptions = useMemo(
    () =>
      Array.from(
        new Map(items.filter((item) => item.projectId).map((item) => [item.projectId!, { id: item.projectId!, name: item.project }])).values()
      ),
    [items]
  );

  const visibleItems = useMemo(
    () =>
      items.filter((item) => {
        const query = filters.search.trim().toLowerCase();
        return (
          (!query || `${item.title} ${item.description} ${item.caption} ${item.originalPrompt ?? ""} ${item.tags.join(" ")}`.toLowerCase().includes(query)) &&
          (filters.project === "All" || item.project === filters.project) &&
          (filters.socialAccount === "All" || item.socialAccount === filters.socialAccount) &&
          (filters.type === "All" || item.typeLabel === filters.type) &&
          (filters.format === "All" || contentFormat(item) === filters.format) &&
          (filters.generationSource === "All" || generationSource(item) === filters.generationSource) &&
          (filters.workflowStatus === "All" || item.workflowStatusLabel === filters.workflowStatus) &&
          (filters.assetStatus === "All" || item.assetStatusLabel === filters.assetStatus) &&
          (filters.platform === "All" || item.platformLabel === filters.platform) &&
          (!filters.date || item.date === filters.date)
        );
      }),
    [filters, items]
  );

  const selectedItems = useMemo(() => items.filter((item) => selected.includes(item.id)), [items, selected]);

  return (
    <div className="space-y-6">
      {toast ? <Toast {...toast} onClose={() => setToast(null)} /> : null}
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1 text-sm text-teal-100">
            <Library className="h-4 w-4" />
            Asset Management System
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">Content Library</h1>
          <p className="mt-3 max-w-3xl text-slate-300">Manage clips, images, motion assets, AI videos, captions, scripts, drafts, versions, and archive lifecycle.</p>
        </div>
        <div className="inline-flex rounded-2xl border border-white/10 bg-white/[0.04] p-1">
          <button type="button" onClick={() => setView("grid")} className={clsx("inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold", view === "grid" ? "bg-teal-300 text-slate-950" : "text-slate-300")}>
            <Grid2X2 className="h-4 w-4" />
            Grid
          </button>
          <button type="button" onClick={() => setView("list")} className={clsx("inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold", view === "list" ? "bg-teal-300 text-slate-950" : "text-slate-300")}>
            <List className="h-4 w-4" />
            List
          </button>
        </div>
      </header>

      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="glass rounded-2xl p-4">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <FolderPlus className="h-4 w-4 text-teal-200" />
            Folders / Collections
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {collections.map((collection) => (
              <div key={collection.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="text-lg font-semibold text-white">{collection.name}</div>
                <p className="mt-1 line-clamp-2 text-sm text-slate-400">{collection.description || "No description."}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-300">
                  <span className="rounded-full bg-white/[0.06] px-2 py-1">{collection.project}</span>
                  <span className="rounded-full bg-teal-300/10 px-2 py-1 text-teal-100">{collection.contentCount} assets</span>
                </div>
              </div>
            ))}
            {!collections.length ? <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-400">Belum ada collection. Buat folder pertama untuk campaign asset.</div> : null}
          </div>
        </div>
        <form onSubmit={createCollection} className="glass rounded-2xl p-4">
          <div className="mb-4 text-sm font-semibold text-white">Create Collection</div>
          <div className="space-y-3">
            <input value={collectionForm.name} onChange={(event) => setCollectionForm({ ...collectionForm, name: event.target.value })} placeholder="Nama folder" className="premium-input px-4 py-3" />
            <textarea value={collectionForm.description} onChange={(event) => setCollectionForm({ ...collectionForm, description: event.target.value })} placeholder="Description" rows={3} className="premium-input px-4 py-3" />
            <select value={collectionForm.projectId} onChange={(event) => setCollectionForm({ ...collectionForm, projectId: event.target.value })} className="premium-input px-4 py-3">
              <option value="">Unassigned Project</option>
              {projectOptions.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
            <button type="submit" disabled={loading} className="w-full rounded-2xl bg-teal-300 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60">Create Folder</button>
          </div>
        </form>
      </section>

      <section className="glass rounded-2xl p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <label className="relative block xl:col-span-2">
            <span className="mb-2 block text-xs font-medium text-slate-300">Search Title</span>
            <Search className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 text-slate-500" />
            <input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Search asset..." className="premium-input py-2 pl-9 pr-3" />
          </label>
          <Filter label="Project" value={filters.project} options={options.project} onChange={(project) => setFilters({ ...filters, project })} />
          <Filter label="Social Account" value={filters.socialAccount} options={options.socialAccount} onChange={(socialAccount) => setFilters({ ...filters, socialAccount })} />
          <Filter label="Type" value={filters.type} options={options.type} onChange={(type) => setFilters({ ...filters, type })} />
          <Filter label="Format" value={filters.format} options={["All", "Image", "Video", "Text"]} onChange={(format) => setFilters({ ...filters, format })} />
          <Filter label="Generation Source" value={filters.generationSource} options={["All", "Real Provider", "Dummy Preview / Fallback", "Manual / Other"]} onChange={(generationSource) => setFilters({ ...filters, generationSource })} />
          <Filter label="Workflow" value={filters.workflowStatus} options={options.workflowStatus} onChange={(workflowStatus) => setFilters({ ...filters, workflowStatus })} />
          <Filter label="Asset Status" value={filters.assetStatus} options={options.assetStatus} onChange={(assetStatus) => setFilters({ ...filters, assetStatus })} />
          <Filter label="Platform" value={filters.platform} options={options.platform} onChange={(platform) => setFilters({ ...filters, platform })} />
          <label className="block">
            <span className="mb-2 block text-xs font-medium text-slate-300">Date</span>
            <input type="date" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} className="premium-input px-3 py-2" />
          </label>
        </div>
      </section>

      {selected.length ? (
        <section className="sticky top-4 z-20 rounded-xl border border-teal-300/20 bg-[#0E1728] p-3 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-semibold text-white">{selected.length} assets selected</span>
            <div className="flex flex-wrap gap-2">
              <BulkButton label="Archive" icon={Archive} onClick={() => bulkAction("ARCHIVE")} />
              <BulkButton label="Trash" icon={Trash2} onClick={() => bulkAction("TRASH")} danger />
              <BulkButton label="Restore" icon={RotateCcw} onClick={() => bulkAction("RESTORE")} />
              <select onChange={(event) => event.target.value && bulkAction("CHANGE_STATUS", { workflowStatus: event.target.value as ContentStatus })} defaultValue="" className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-white">
                <option value="">Change status</option>
                {["DRAFT", "REVIEW", "APPROVED", "SCHEDULED", "POSTED", "REJECTED", "FAILED"].map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <select onChange={(event) => event.target.value && bulkAction("ASSIGN_PROJECT", { projectId: event.target.value })} defaultValue="" className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-white">
                <option value="">Assign project</option>
                {projectOptions.map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
              <BulkButton label="Send to Scheduler" icon={CalendarClock} onClick={() => bulkAction("SEND_TO_SCHEDULER")} />
              <BulkButton label="Permanent Delete" icon={Trash2} onClick={() => bulkAction("DELETE", {}, true)} danger />
            </div>
          </div>
        </section>
      ) : null}

      {view === "grid" ? (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {visibleItems.map((item) => (
            <AssetCard key={item.id} item={item} selected={selected.includes(item.id)} onSelect={(checked) => toggleSelect(item.id, checked)} onAction={assetAction} onWorkflow={transition} onApprove={openModal} onScheduler={sendToScheduler} />
          ))}
        </section>
      ) : (
        <section className="glass overflow-hidden rounded-2xl">
          <div className="min-w-full overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3"></th>
                  <th className="px-4 py-3">Asset</th>
                  <th className="px-4 py-3">Project</th>
                  <th className="px-4 py-3">Workflow</th>
                  <th className="px-4 py-3">Asset Status</th>
                  <th className="px-4 py-3">Version</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((item) => (
                  <tr key={item.id} className="border-b border-white/5">
                    <td className="px-4 py-3"><input type="checkbox" checked={selected.includes(item.id)} onChange={(event) => toggleSelect(item.id, event.target.checked)} className="h-4 w-4 accent-teal-300" /></td>
                    <td className="px-4 py-3"><Link href={`/library/${item.id}`} className="font-semibold text-white hover:text-teal-100">{item.title}</Link><div className="text-xs text-slate-500">{item.typeLabel} - {item.platformLabel}</div>{item.originalPrompt ? <div className="mt-1 max-w-md truncate text-xs text-slate-400">Prompt: {item.originalPrompt}</div> : null}{item.generationMode ? <GenerationBadge item={item} className="mt-2" /> : item.isDemoData ? <DemoBadge className="mt-2" /> : null}</td>
                    <td className="px-4 py-3 text-slate-300">{item.project}</td>
                    <td className="px-4 py-3"><Badge className={statusBadgeClasses[item.workflowStatus]}>{item.workflowStatusLabel}</Badge></td>
                    <td className="px-4 py-3"><Badge className={assetStatusBadgeClasses[item.assetStatus]}>{item.assetStatusLabel}</Badge></td>
                    <td className="px-4 py-3 text-slate-300">v{item.versionNumber}{item.isLatestVersion ? " latest" : ""}</td>
                    <td className="px-4 py-3"><AssetInlineActions item={item} onAction={assetAction} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {!visibleItems.length ? (
        <div className="glass grid min-h-72 place-items-center rounded-2xl p-8 text-center">
          <div>
            <Library className="mx-auto mb-4 h-10 w-10 text-teal-300" />
            <h2 className="text-xl font-semibold text-white">Belum ada asset</h2>
            <p className="mt-2 max-w-md text-sm text-slate-400">Mulai dari Trending Center, Clipper Workflow, atau Creative Studio untuk membuat asset Draft.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link href="/trending-center" className="rounded-xl bg-teal-300 px-4 py-2 text-sm font-semibold text-slate-950">Open Trending Center</Link>
              <Link href="/clipper" className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white">Generate Clip</Link>
            </div>
          </div>
        </div>
      ) : null}

      {modal ? <ConfirmModal type={modal.type} item={modal.item} value={approvalText} onChange={setApprovalText} onCancel={() => setModal(null)} onConfirm={confirmApproval} /> : null}
    </div>
  );

  function toggleSelect(id: string, checked: boolean) {
    setSelected((current) => (checked ? [...new Set([...current, id])] : current.filter((itemId) => itemId !== id)));
  }

  function openModal(type: "approve" | "reject", item: LibraryItemDto) {
    setModal({ type, item });
    setApprovalText("");
  }

  async function createCollection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!collectionForm.name.trim()) return setToast({ type: "error", message: "Nama folder wajib diisi." });
    setLoading(true);
    try {
      const response = await fetch("/api/assets/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(collectionForm)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Folder gagal dibuat.");
      setCollections((current) => [data.collection, ...current]);
      setCollectionForm({ name: "", description: "", projectId: "" });
      setToast({ type: "success", message: "Folder berhasil dibuat." });
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Folder gagal dibuat." });
    } finally {
      setLoading(false);
    }
  }

  async function transition(item: LibraryItemDto, action: "review" | "approve" | "reject") {
    const response = await fetch(`/api/content/${item.id}/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: approvalText, reason: action === "reject" ? approvalText : undefined, actionBy: "Admin" })
    });
    const data = await response.json();
    if (!response.ok) return setToast({ type: "error", message: data.error ?? "Workflow action failed." });
    setItems((current) => current.map((currentItem) => (currentItem.id === item.id ? data.item : currentItem)));
    setToast({ type: "success", message: `${data.item.title} updated to ${data.item.workflowStatusLabel}.` });
  }

  async function confirmApproval() {
    if (!modal) return;
    if (modal.type === "reject" && !approvalText.trim()) return setToast({ type: "error", message: "Reject reason wajib diisi." });
    await transition(modal.item, modal.type);
    setModal(null);
    setApprovalText("");
  }

  async function sendToScheduler(item: LibraryItemDto) {
    const response = await fetch(`/api/library/${item.id}/send-to-scheduler`, { method: "POST" });
    const data = await response.json();
    if (!response.ok) return setToast({ type: "error", message: data.error ?? "Content gagal dikirim ke Scheduler." });
    setItems((current) => current.map((currentItem) => (currentItem.id === item.id ? { ...currentItem, workflowStatus: "SCHEDULED", workflowStatusLabel: "Scheduled", status: "SCHEDULED", statusLabel: "Scheduled" } : currentItem)));
    setToast({ type: "success", message: `Content dikirim ke Scheduler (${data.scheduleId}).` });
  }

  async function assetAction(item: LibraryItemDto, action: "archive" | "trash" | "restore" | "duplicate") {
    const response = await fetch(`/api/assets/${item.id}/${action}`, { method: "POST" });
    const data = await response.json();
    if (!response.ok) return setToast({ type: "error", message: data.error ?? "Asset action failed." });
    if (action === "duplicate") setItems((current) => [data.item, ...current]);
    else setItems((current) => current.map((currentItem) => (currentItem.id === item.id ? data.item : currentItem)));
    setToast({ type: "success", message: `Asset ${action} berhasil.` });
  }

  async function bulkAction(action: string, extra: Record<string, string> = {}, confirmDelete = false) {
    if (confirmDelete && !window.confirm("Permanent delete selected assets? Action ini tidak bisa dibatalkan.")) return;
    const response = await fetch("/api/assets/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selected, action, ...extra })
    });
    const data = await response.json();
    if (!response.ok) return setToast({ type: "error", message: data.error ?? "Bulk action gagal." });
    setSelected([]);
    await loadLibrary();
    setToast({ type: "success", message: `Bulk action selesai untuk ${data.count ?? selected.length} asset.` });
  }
}

function AssetCard({ item, selected, onSelect, onAction, onWorkflow, onApprove, onScheduler }: { item: LibraryItemDto; selected: boolean; onSelect: (checked: boolean) => void; onAction: (item: LibraryItemDto, action: "archive" | "trash" | "restore" | "duplicate") => void; onWorkflow: (item: LibraryItemDto, action: "review" | "approve" | "reject") => void; onApprove: (type: "approve" | "reject", item: LibraryItemDto) => void; onScheduler: (item: LibraryItemDto) => void }) {
  const Icon = icons[item.type];
  return (
    <article className="glass group overflow-hidden rounded-2xl transition hover:-translate-y-1 hover:border-teal-300/40">
      <div className="relative aspect-[4/5] bg-slate-900">
        <img src={item.thumbnail} alt="" className="h-full w-full object-cover opacity-55 mix-blend-luminosity transition group-hover:opacity-70" />
        <input type="checkbox" checked={selected} onChange={(event) => onSelect(event.target.checked)} className="absolute left-4 top-4 h-4 w-4 accent-teal-300" />
        <div className="absolute left-4 top-11 inline-flex items-center gap-2 rounded-full bg-slate-950/80 px-3 py-1 text-xs font-semibold text-teal-100"><Icon className="h-3.5 w-3.5" />{item.typeLabel}</div>
        <div className={clsx("absolute right-4 top-4 rounded-full border px-3 py-1 text-xs font-semibold", statusBadgeClasses[item.workflowStatus])}>{item.workflowStatusLabel}</div>
        <div className={clsx("absolute bottom-4 left-4 rounded-full border px-3 py-1 text-xs font-semibold", assetStatusBadgeClasses[item.assetStatus])}>{item.assetStatusLabel}</div>
        {item.generationMode ? <GenerationBadge item={item} className="absolute bottom-4 right-4" /> : item.isDemoData ? <DemoBadge className="absolute bottom-4 right-4" /> : null}
      </div>
      <div className="p-4">
        <div className="text-xs font-semibold uppercase text-teal-200">v{item.versionNumber} {item.isLatestVersion ? "- latest" : ""}</div>
        <Link href={`/library/${item.id}`} className="mt-2 block text-lg font-semibold text-white hover:text-teal-100">{item.title}</Link>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-400">{item.description}</p>
        {item.originalPrompt ? <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-300">Prompt: {item.originalPrompt}</p> : null}
        {item.generationWarning ? <p className="mt-3 line-clamp-2 text-xs leading-5 text-amber-200">{item.generationWarning}</p> : null}
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
          <span className="rounded-full bg-white/[0.06] px-2 py-1">{item.project}</span>
          <span className="rounded-full bg-white/[0.06] px-2 py-1">{item.socialAccount}</span>
          <span className="rounded-full bg-white/[0.06] px-2 py-1">{item.platformLabel}</span>
          {item.generationProvider ? <span className="rounded-full bg-white/[0.06] px-2 py-1">{item.generationProvider.replaceAll("_", " ")}</span> : null}
          {item.generationModel ? <span className="rounded-full bg-white/[0.06] px-2 py-1">{item.generationModel}</span> : null}
          {item.isDemoData ? <DemoBadge /> : null}
        </div>
        <div className="mt-4 grid gap-2">
          {item.workflowStatus === "DRAFT" ? <ActionButton label="Send to Review" icon={Send} onClick={() => onWorkflow(item, "review")} /> : null}
          {item.workflowStatus === "REVIEW" ? <div className="grid grid-cols-2 gap-2"><ActionButton label="Approve" icon={CheckCircle2} onClick={() => onApprove("approve", item)} /><ActionButton label="Reject" icon={ThumbsDown} onClick={() => onApprove("reject", item)} danger /></div> : null}
          <ActionButton label={item.workflowStatus === "APPROVED" ? "Send to Scheduler" : "Approved required"} icon={CalendarClock} disabled={item.workflowStatus !== "APPROVED"} onClick={() => onScheduler(item)} />
          <AssetInlineActions item={item} onAction={onAction} />
        </div>
      </div>
    </article>
  );
}

function AssetInlineActions({ item, onAction }: { item: LibraryItemDto; onAction: (item: LibraryItemDto, action: "archive" | "trash" | "restore" | "duplicate") => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <ActionButton label="Duplicate" icon={Copy} onClick={() => onAction(item, "duplicate")} />
      {item.assetStatus === "ACTIVE" ? <ActionButton label="Archive" icon={Archive} onClick={() => onAction(item, "archive")} /> : <ActionButton label="Restore" icon={RotateCcw} onClick={() => onAction(item, "restore")} />}
      <ActionButton label="Trash" icon={Trash2} onClick={() => onAction(item, "trash")} danger />
    </div>
  );
}

function Filter({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium text-slate-300">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="premium-input px-3 py-2">
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function Badge({ children, className }: { children: React.ReactNode; className: string }) {
  return <span className={clsx("rounded-full border px-2 py-1 text-xs font-semibold", className)}>{children}</span>;
}

function GenerationBadge({ item, className }: { item: LibraryItemDto; className?: string }) {
  const dummy = item.isDummyGeneration || item.generationMode === "DUMMY";
  const label = dummy ? (item.generationWarning ? "Dummy Fallback" : "Dummy Preview") : "Real Provider";
  return <span className={clsx("inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold uppercase", dummy ? "border-amber-300/30 bg-slate-950/85 text-amber-100" : "border-teal-300/30 bg-slate-950/85 text-teal-100", className)}>{label}</span>;
}

function DemoBadge({ className }: { className?: string }) {
  return <span className={clsx("inline-flex rounded-full border border-amber-300/30 bg-amber-300/10 px-2 py-1 text-[10px] font-semibold uppercase text-amber-100", className)}>Demo sample</span>;
}

function contentFormat(item: LibraryItemDto) {
  if (["IMAGE", "MOTION_IMAGE"].includes(item.type)) return "Image";
  if (["CLIP", "AI_VIDEO", "SCHEDULED_POST"].includes(item.type)) return "Video";
  return "Text";
}

function generationSource(item: LibraryItemDto) {
  if (item.generationOutputSource === "provider" || item.generationMode === "REAL") return "Real Provider";
  if (item.isDummyGeneration || item.generationOutputSource === "dummy" || item.generationMode === "DUMMY") return "Dummy Preview / Fallback";
  return "Manual / Other";
}

function BulkButton({ label, icon: Icon, onClick, danger = false }: { label: string; icon: typeof Archive; onClick: () => void; danger?: boolean }) {
  return <button type="button" onClick={onClick} className={clsx("inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold", danger ? "bg-rose-400/10 text-rose-100" : "bg-white/[0.06] text-white")}><Icon className="h-4 w-4" />{label}</button>;
}

function ActionButton({ label, icon: Icon, onClick, disabled = false, danger = false }: { label: string; icon: typeof Send; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={clsx("inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-45", danger ? "bg-rose-400/10 text-rose-100 hover:bg-rose-400/20" : "bg-white/[0.07] text-white hover:bg-white/[0.12]")}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function ConfirmModal({ type, item, value, onChange, onCancel, onConfirm }: { type: "approve" | "reject"; item: LibraryItemDto; value: string; onChange: (value: string) => void; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <div className="glass w-full max-w-lg rounded-2xl p-5">
        <h2 className="text-xl font-semibold text-white">{type === "approve" ? "Approve Content" : "Reject Content"}</h2>
        <p className="mt-2 text-sm text-slate-400">{item.title}</p>
        <label className="mt-4 block">
          <span className="mb-2 block text-sm font-medium text-slate-300">{type === "approve" ? "Review notes" : "Reject reason"}</span>
          <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} className="premium-input px-4 py-3" />
        </label>
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white">Cancel</button>
          <button type="button" onClick={onConfirm} className={clsx("rounded-xl px-4 py-2 text-sm font-semibold", type === "approve" ? "bg-teal-300 text-slate-950" : "bg-rose-400 text-white")}>{type === "approve" ? "Approve" : "Reject"}</button>
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
