"use client";

import clsx from "clsx";
import { BarChart3, CalendarClock, Edit3, Eye, Loader2, Plus, Power, Save, Share2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { authStatusLabels, publishModeLabels, socialPlatformLabels, statusLabels, uploadMethodLabels, type SocialAccountDto } from "@/lib/social-account-service";
import type { AuthStatus, ProjectDto, PublishMode, SocialConnectionStatus, SocialPlatform, UploadMethod } from "@/lib/types";
import { EmptyCard, ErrorCard } from "@/components/state-cards";

type FormState = {
  platform: SocialPlatform;
  name: string;
  handle: string;
  niche: string;
  projectId: string;
  uploadMethod: UploadMethod;
  uploadMode: PublishMode;
  authStatus: AuthStatus;
  connectionNotes: string;
  status: SocialConnectionStatus;
  loginNotes: string;
  notes: string;
  isActive: boolean;
};

const emptyForm: FormState = {
  platform: "TIKTOK",
  name: "",
  handle: "",
  niche: "",
  projectId: "",
  uploadMethod: "MANUAL",
  uploadMode: "MANUAL",
  authStatus: "NOT_CONNECTED",
  connectionNotes: "",
  status: "MANUAL",
  loginNotes: "",
  notes: "",
  isActive: true
};

export default function SocialAccountsPage() {
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [accounts, setAccounts] = useState<SocialAccountDto[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/projects").then((response) => response.json()),
      fetch("/api/social-accounts").then((response) => response.json())
    ])
      .then(([projectData, accountData]) => {
        const loadedProjects = projectData.projects ?? [];
        setProjects(loadedProjects);
        setAccounts(Array.isArray(accountData.accounts) ? accountData.accounts : []);
        if (accountData.source === "fallback") setLoadError(accountData.message ?? "Social Accounts memakai empty fallback karena database belum tersedia.");
        setForm((current) => ({ ...current, projectId: loadedProjects[0]?.id ?? "" }));
      })
      .catch((error) => setLoadError(error instanceof Error ? error.message : "Gagal memuat Social Accounts."))
      .finally(() => setLoading(false));
  }, []);

  const summary = useMemo(
    () => ({
      total: accounts.length,
      active: accounts.filter((account) => account.isActive && account.status !== "DISABLED").length,
      scheduled: accounts.reduce((sum, account) => sum + account.scheduledPosts, 0),
      action: accounts.filter((account) => account.status === "NOT_CONNECTED" || account.status === "DISABLED" || !account.isActive).length
    }),
    [accounts]
  );

  async function saveAccount() {
    if (!form.name || !form.handle) {
      setToast({ type: "error", message: "Account Name dan Handle wajib diisi." });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(editingId ? `/api/social-accounts/${editingId}` : "/api/social-accounts", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Akun gagal disimpan ke Supabase.");

      setAccounts((current) => (editingId ? current.map((account) => (account.id === editingId ? data.account : account)) : [data.account, ...current]));
      setEditingId(null);
      setForm({ ...emptyForm, projectId: projects[0]?.id ?? "" });
      setToast({ type: "success", message: "Akun sosial berhasil disimpan ke Supabase." });
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Akun gagal disimpan ke Supabase." });
    } finally {
      setSaving(false);
    }
  }

  function editAccount(account: SocialAccountDto) {
    setEditingId(account.id);
    setForm({
      platform: account.platform,
      name: account.name,
      handle: account.handle,
      niche: account.niche,
      projectId: account.projectId,
      uploadMethod: account.uploadMethod,
      uploadMode: account.uploadMode,
      authStatus: account.authStatus,
      connectionNotes: account.connectionNotes,
      status: account.status,
      loginNotes: account.loginNotes,
      notes: account.notes,
      isActive: account.isActive
    });
  }

  async function disableAccount(account: SocialAccountDto) {
    try {
      const response = await fetch(`/api/social-accounts/${account.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: false, status: "DISABLED" })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Akun gagal dinonaktifkan.");
      setAccounts((current) => current.map((item) => (item.id === account.id ? data.account : item)));
      setToast({ type: "success", message: "Akun berhasil dinonaktifkan tanpa menghapus data." });
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Akun gagal dinonaktifkan." });
    }
  }

  async function deleteAccount(account: SocialAccountDto) {
    if (!window.confirm(`Hapus akun "${account.name}"? Data schedule terkait bisa ikut terdampak.`)) return;
    try {
      const response = await fetch(`/api/social-accounts/${account.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Akun gagal dihapus dari Supabase.");
      setAccounts((current) => current.filter((item) => item.id !== account.id));
      if (editingId === account.id) setEditingId(null);
      setToast({ type: "success", message: "Akun sosial berhasil dihapus dari Supabase." });
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Akun gagal dihapus dari Supabase." });
    }
  }

  return (
    <div className="space-y-6">
      {toast ? <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} /> : null}
      <header>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1 text-sm text-teal-100">
          <Share2 className="h-4 w-4" />
          Social Accounts
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">Social Account Manager</h1>
        <p className="mt-3 max-w-3xl text-slate-300">Kelola banyak akun sosial media per Project dan niche tanpa menyimpan password sosial media.</p>
      </header>
      {loadError ? <ErrorCard title="Social Accounts fallback aktif" description={loadError} /> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total Accounts" value={summary.total} icon={Share2} />
        <SummaryCard label="Active Accounts" value={summary.active} icon={Power} />
        <SummaryCard label="Scheduled Posts" value={summary.scheduled} icon={CalendarClock} />
        <SummaryCard label="Need Action" value={summary.action} icon={BarChart3} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <div id="add-social-account" className="glass rounded-2xl p-5">
          <h2 className="mb-4 text-xl font-semibold text-white">{editingId ? "Edit Social Account" : "Add Social Account"}</h2>
          <div className="space-y-4">
            <Field label="Account Name"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="premium-input px-4 py-3" /></Field>
            <Field label="Platform">
              <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value as SocialPlatform })} className="premium-input px-4 py-3">
                {Object.entries(socialPlatformLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </Field>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Handle"><input value={form.handle} onChange={(e) => setForm({ ...form, handle: e.target.value })} className="premium-input px-4 py-3" /></Field>
              <Field label="Niche"><input value={form.niche} onChange={(e) => setForm({ ...form, niche: e.target.value })} className="premium-input px-4 py-3" /></Field>
            </div>
            <Field label="Project terkait">
              <select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} className="premium-input px-4 py-3">
                <option value="">Unassigned</option>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
              </select>
            </Field>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Upload Method">
                <select value={form.uploadMethod} onChange={(e) => setForm({ ...form, uploadMethod: e.target.value as UploadMethod })} className="premium-input px-4 py-3">
                  {Object.entries(uploadMethodLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </Field>
              <Field label="Upload Mode">
                <select value={form.uploadMode} onChange={(e) => setForm({ ...form, uploadMode: e.target.value as PublishMode })} className="premium-input px-4 py-3">
                  {Object.entries(publishModeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </Field>
              <Field label="Auth Status">
                <select value={form.authStatus} onChange={(e) => setForm({ ...form, authStatus: e.target.value as AuthStatus })} className="premium-input px-4 py-3">
                  {Object.entries(authStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as SocialConnectionStatus, isActive: e.target.value !== "DISABLED" })} className="premium-input px-4 py-3">
                  {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Notes"><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="premium-input px-4 py-3" /></Field>
            <Field label="Connection Notes"><textarea value={form.connectionNotes} onChange={(e) => setForm({ ...form, connectionNotes: e.target.value })} rows={3} className="premium-input px-4 py-3" /></Field>
            <Field label="Catatan login/manual upload"><textarea value={form.loginNotes} onChange={(e) => setForm({ ...form, loginNotes: e.target.value })} rows={3} className="premium-input px-4 py-3" /></Field>
            <button type="button" onClick={saveAccount} disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-300 px-5 py-4 font-semibold text-slate-950 shadow-glow disabled:opacity-60">
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : editingId ? <Save className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              {saving ? "Saving..." : editingId ? "Save Changes" : "Add Account"}
            </button>
          </div>
        </div>

        <div className="grid gap-4">
          {loading ? <div className="glass rounded-2xl p-5 text-sm text-slate-300">Memuat social accounts...</div> : null}
          {!loading && accounts.length ? accounts.map((account) => (
            <article key={account.id} className="glass rounded-2xl p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <div className="mb-3 flex flex-wrap gap-2">
                    <Badge>{socialPlatformLabels[account.platform]}</Badge>
                    <Badge tone={account.status === "CONNECTED" ? "good" : account.status === "DISABLED" ? "danger" : "neutral"}>{statusLabels[account.status]}</Badge>
                    <Badge>{uploadMethodLabels[account.uploadMethod]}</Badge>
                    <Badge>{publishModeLabels[account.uploadMode]}</Badge>
                    <Badge tone={account.authStatus === "CONNECTED" ? "good" : account.authStatus === "ERROR" ? "danger" : "neutral"}>{authStatusLabels[account.authStatus]}</Badge>
                  </div>
                  <Link href={`/social-accounts/${account.id}`} className="text-xl font-semibold text-white hover:text-teal-100">{account.name}</Link>
                  <p className="mt-1 text-sm text-slate-400">{account.handle} - {account.niche || "No niche"}</p>
                  <p className="mt-2 text-sm text-slate-300">Project: {account.projectName}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{account.notes || account.loginNotes || "No notes."}</p>
                </div>
                <div className="grid min-w-72 gap-3 sm:grid-cols-3">
                  <MiniMetric label="Content" value={account.totalContent} />
                  <MiniMetric label="Scheduled" value={account.scheduledPosts} />
                  <MiniMetric label="Posted" value={account.postedPosts} />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                <div className="text-xs text-slate-500">Last Activity: {account.lastActivityAt ? new Date(account.lastActivityAt).toLocaleString("id-ID") : "No activity yet"}</div>
                <div className="flex gap-2">
                  <Link href={`/social-accounts/${account.id}`} className="rounded-xl border border-white/10 bg-white/[0.06] p-3 text-slate-200"><Eye className="h-4 w-4" /></Link>
                  <button type="button" onClick={() => editAccount(account)} className="rounded-xl border border-white/10 bg-white/[0.06] p-3 text-slate-200"><Edit3 className="h-4 w-4" /></button>
                  <button type="button" disabled={account.status === "DISABLED"} onClick={() => disableAccount(account)} className="rounded-xl border border-white/10 bg-white/[0.06] p-3 text-amber-100 disabled:opacity-40"><Power className="h-4 w-4" /></button>
                  <button type="button" onClick={() => deleteAccount(account)} className="rounded-xl border border-rose-300/20 bg-rose-400/10 p-3 text-rose-200"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </article>
          )) : (
            <EmptyCard title="Belum ada akun sosial" description="Tambahkan akun manual terlebih dahulu agar content dapat dijadwalkan." action={{ label: "Add Social Account", href: "#add-social-account" }} />
          )}
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Share2 }) {
  return (
    <div className="glass rounded-2xl p-5">
      <Icon className="mb-4 h-5 w-5 text-teal-300" />
      <div className="text-3xl font-semibold text-white">{value}</div>
      <div className="mt-1 text-sm text-slate-400">{label}</div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
      <div className="text-xl font-semibold text-white">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "good" | "danger" }) {
  return (
    <span className={clsx("rounded-full border px-3 py-1 text-xs font-semibold", tone === "good" && "border-teal-200 bg-teal-300 text-slate-950", tone === "danger" && "border-rose-300/20 bg-rose-400/10 text-rose-100", tone === "neutral" && "border-white/10 bg-white/[0.07] text-slate-200")}>{children}</span>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">{label}</span>
      {children}
    </label>
  );
}
