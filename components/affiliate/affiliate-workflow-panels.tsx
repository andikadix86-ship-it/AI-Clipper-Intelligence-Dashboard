"use client";

import { BarChart3, CalendarClock, Edit3, LoaderCircle, Plus, Save, Send, Store, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CampaignCreationModal } from "@/components/affiliate/campaign-creation-modal";
import { DashboardPanel } from "@/components/dashboard/ui";
import { EmptyCard, ErrorCard } from "@/components/state-cards";
import type { AffiliateAccountDto, AffiliateCampaignDraft } from "@/lib/intelligence/action-flow";
import { listCampaigns } from "@/lib/intelligence/affiliate-persistence";

type AffiliateProgramDto = { id: string; name: string; website: string; dashboardUrl: string; affiliateLink: string; commissionInfo: string; products?: string[]; notes: string; status: string };
type GeneratedContentDto = { id: string; campaignId?: string; contentType: string; title: string; body: string; platform: string; createdAt: string };
type ScheduleDto = { id: string; status: string; scheduledAt?: string; postingTime: string; socialAccount?: { name: string; handle?: string | null } };
type AnalyticsSummary = { views: number; engagement: number; clicks: number; sales: number; commission: number; engagementRate: number; conversionRate: number };

const accountPlatforms = ["TikTok", "Instagram", "Facebook", "YouTube", "TikTok Shop Affiliate", "Shopee Affiliate", "Tokopedia Affiliate", "Lazada Affiliate", "Custom Affiliate"];
const accountRoles = ["Testing", "Growth", "Sales", "Backup", "Research"];
const accountStatuses = ["ACTIVE", "TESTING", "PAUSED", "ARCHIVED"];

export function AffiliateAccountsPanel() {
  const [accounts, setAccounts] = useState<AffiliateAccountDto[]>([]);
  const [programs, setPrograms] = useState<AffiliateProgramDto[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [showProgramForm, setShowProgramForm] = useState(false);
  const [editingId, setEditingId] = useState("");
  const emptyAccount = { platform: "TikTok", accountName: "", handle: "", niche: "", role: "Testing", affiliateDashboardUrl: "", affiliateLink: "", commissionInfo: "", notes: "", status: "ACTIVE", programId: "" };
  const [account, setAccount] = useState(emptyAccount);
  const [program, setProgram] = useState({ name: "", website: "", dashboardUrl: "", affiliateLink: "", commissionInfo: "", products: "", notes: "" });

  async function load() {
    setLoading(true); setError("");
    try {
      const [accountsResponse, programsResponse] = await Promise.all([fetch("/api/affiliate/accounts", { cache: "no-store" }), fetch("/api/affiliate/programs", { cache: "no-store" })]);
      const [accountsPayload, programsPayload] = await Promise.all([accountsResponse.json(), programsResponse.json()]);
      if (!accountsResponse.ok || !programsResponse.ok) throw new Error(accountsPayload.message ?? programsPayload.message ?? "Affiliate account data gagal dimuat.");
      setAccounts(Array.isArray(accountsPayload.accounts) ? accountsPayload.accounts : []);
      setPrograms(Array.isArray(programsPayload.programs) ? programsPayload.programs : []);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Affiliate account data gagal dimuat."); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function startEdit(item: AffiliateAccountDto) {
    setEditingId(item.id);
    setShowAccountForm(true);
    setAccount({ platform: item.platform, accountName: item.accountName, handle: item.handle, niche: item.niche, role: item.role, affiliateDashboardUrl: item.affiliateDashboardUrl ?? "", affiliateLink: item.affiliateLink ?? "", commissionInfo: item.commissionInfo, notes: item.notes, status: item.status, programId: item.programId ?? "" });
  }

  async function saveAccount() {
    if (!account.accountName.trim() || !account.handle.trim() || !account.niche.trim()) { setError("Account name, username/page/channel, dan niche wajib diisi."); return; }
    setSaving("account"); setError("");
    try {
      const response = await fetch(editingId ? `/api/affiliate/accounts/${editingId}` : "/api/affiliate/accounts", { method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(account) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "Affiliate account gagal disimpan.");
      setNotice(payload.message); setShowAccountForm(false); setEditingId(""); setAccount(emptyAccount); await load();
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Affiliate account gagal disimpan."); }
    finally { setSaving(""); }
  }

  async function archiveAccount(id: string) {
    setSaving(`archive-${id}`); setError("");
    try {
      const response = await fetch(`/api/affiliate/accounts/${id}`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "Affiliate account gagal diarsipkan.");
      setNotice(payload.message); await load();
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Affiliate account gagal diarsipkan."); }
    finally { setSaving(""); }
  }

  async function saveProgram() {
    if (!program.name.trim() || !program.website.trim() || !program.dashboardUrl.trim() || !program.affiliateLink.trim()) { setError("Program name, website, dashboard URL, dan affiliate link wajib diisi."); return; }
    setSaving("program"); setError("");
    try {
      const response = await fetch("/api/affiliate/programs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...program, products: program.products.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean) }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "Affiliate program gagal disimpan.");
      setNotice(payload.message); setShowProgramForm(false); setProgram({ name: "", website: "", dashboardUrl: "", affiliateLink: "", commissionInfo: "", products: "", notes: "" }); await load();
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Affiliate program gagal disimpan."); }
    finally { setSaving(""); }
  }

  return <DashboardPanel title="Affiliate Accounts" description="Kelola multi-account per platform dan program affiliate custom sebelum membuat campaign.">
    <div className="flex flex-wrap gap-2"><button type="button" onClick={() => { setShowAccountForm((value) => !value); setEditingId(""); setAccount(emptyAccount); }} className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white"><Plus className="h-3.5 w-3.5" />Add Affiliate Account</button><button type="button" onClick={() => setShowProgramForm((value) => !value)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-semibold text-slate-200"><Plus className="h-3.5 w-3.5" />Add Custom Program</button></div>
    {notice ? <p className="mt-4 rounded-xl border border-emerald-300/20 bg-emerald-300/[0.06] p-3 text-xs text-emerald-100">{notice}</p> : null}
    {error ? <div className="mt-4"><ErrorCard compact title="Affiliate account action failed" description={error} /></div> : null}
    {showAccountForm ? <div className="mt-4 grid gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-4 md:grid-cols-2 xl:grid-cols-3"><Select label="Platform" value={account.platform} options={accountPlatforms} onChange={(platform) => setAccount({ ...account, platform })} /><Field label="Account Name" value={account.accountName} onChange={(accountName) => setAccount({ ...account, accountName })} /><Field label="Username / Page / Channel" value={account.handle} onChange={(handle) => setAccount({ ...account, handle })} /><Field label="Niche" value={account.niche} onChange={(niche) => setAccount({ ...account, niche })} /><Select label="Role" value={account.role} options={accountRoles} onChange={(role) => setAccount({ ...account, role })} /><Select label="Status" value={account.status} options={accountStatuses} onChange={(status) => setAccount({ ...account, status })} /><Field label="Affiliate Dashboard URL" value={account.affiliateDashboardUrl} onChange={(affiliateDashboardUrl) => setAccount({ ...account, affiliateDashboardUrl })} /><Field label="Affiliate Link" value={account.affiliateLink} onChange={(affiliateLink) => setAccount({ ...account, affiliateLink })} /><Field label="Commission Info" value={account.commissionInfo} onChange={(commissionInfo) => setAccount({ ...account, commissionInfo })} /><Select label="Custom Program Optional" value={account.programId} options={["", ...programs.map((item) => item.id)]} labels={["No linked program", ...programs.map((item) => item.name)]} onChange={(programId) => setAccount({ ...account, programId })} /><div className="md:col-span-2"><Field label="Notes" value={account.notes} onChange={(notes) => setAccount({ ...account, notes })} /></div><button type="button" onClick={saveAccount} disabled={saving === "account"} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-60">{saving === "account" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{editingId ? "Update Account" : "Save Account"}</button></div> : null}
    {showProgramForm ? <div className="mt-4 grid gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-4 md:grid-cols-2"><Field label="Program Name" value={program.name} onChange={(name) => setProgram({ ...program, name })} /><Field label="Website" value={program.website} onChange={(website) => setProgram({ ...program, website })} /><Field label="Dashboard URL" value={program.dashboardUrl} onChange={(dashboardUrl) => setProgram({ ...program, dashboardUrl })} /><Field label="Affiliate Link" value={program.affiliateLink} onChange={(affiliateLink) => setProgram({ ...program, affiliateLink })} /><Field label="Commission" value={program.commissionInfo} onChange={(commissionInfo) => setProgram({ ...program, commissionInfo })} /><Field label="Notes" value={program.notes} onChange={(notes) => setProgram({ ...program, notes })} /><div className="md:col-span-2"><label><Label>Add Product / Service Manually</Label><textarea value={program.products} onChange={(event) => setProgram({ ...program, products: event.target.value })} rows={3} placeholder="Slendro AI Pro, Canva Template Kit" className="premium-input mt-1.5 px-3 py-2.5 text-sm" /></label></div><button type="button" onClick={saveProgram} disabled={saving === "program"} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-60">{saving === "program" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}Save Custom Program</button></div> : null}
    {loading ? <p className="mt-5 inline-flex items-center gap-2 text-xs text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin" />Loading affiliate accounts...</p> : accounts.length ? <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{accounts.map((item) => <article key={item.id} className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4"><div className="flex items-center justify-between gap-2"><Badge>{item.platform}</Badge><Badge>{item.status}</Badge></div><h3 className="mt-3 text-sm font-semibold text-white">{item.accountName}</h3><p className="mt-1 text-xs text-cyan-100">{item.handle}</p><p className="mt-2 text-xs text-slate-500">{item.niche} | {item.role}</p><p className="mt-2 text-xs text-slate-500">{item.commissionInfo || "Commission info belum diisi"}</p><div className="mt-4 flex gap-2"><button type="button" onClick={() => startEdit(item)} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-2 text-xs font-semibold text-slate-200"><Edit3 className="h-3.5 w-3.5" />Edit</button><button type="button" onClick={() => archiveAccount(item.id)} disabled={saving === `archive-${item.id}` || item.status === "ARCHIVED"} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300/15 bg-rose-300/[0.04] px-2.5 py-2 text-xs font-semibold text-rose-100 disabled:opacity-50">{saving === `archive-${item.id}` ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}Archive</button></div></article>)}</div> : <div className="mt-5"><EmptyCard title="Belum ada affiliate account" description="Tambahkan minimal satu account sebelum membuat campaign multi-account." /></div>}
    {programs.length ? <div className="mt-5"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Custom Programs</p><div className="mt-3 flex flex-wrap gap-2">{programs.map((item) => <Badge key={item.id}>{item.name}</Badge>)}</div></div> : null}
  </DashboardPanel>;
}

export function CampaignManagerPanel() {
  const [campaigns, setCampaigns] = useState<AffiliateCampaignDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  function load() { setLoading(true); listCampaigns().then((result) => { setCampaigns(result.items.filter((item) => item.dataSource === "database")); setError(result.message ?? ""); }).finally(() => setLoading(false)); }
  useEffect(() => { load(); window.addEventListener("affiliate:campaign-saved", load); return () => window.removeEventListener("affiliate:campaign-saved", load); }, []);
  return <><DashboardPanel title="Campaign Manager" description="Campaign dibuat setelah memilih product intelligence dan menargetkan satu atau beberapa affiliate accounts."><button type="button" onClick={() => setModalOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white"><Plus className="h-3.5 w-3.5" />Create Manual Campaign</button>{error ? <p className="mt-4 text-xs text-amber-100">{error}</p> : null}{loading ? <p className="mt-5 inline-flex items-center gap-2 text-xs text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin" />Loading campaigns...</p> : campaigns.length ? <div className="mt-5 grid gap-3 md:grid-cols-2">{campaigns.map((campaign) => <article key={campaign.id} className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4"><div className="flex flex-wrap gap-2"><Badge>{campaign.status}</Badge><Badge>{campaign.category}</Badge><Badge>{campaign.affiliateAccounts?.length ?? 0} accounts</Badge></div><h3 className="mt-3 text-sm font-semibold text-white">{campaign.campaignName}</h3><p className="mt-1 text-xs text-slate-400">{campaign.productName}</p><p className="mt-2 text-xs leading-5 text-slate-500">{campaign.targetAudience || "Audience belum diisi"} | {campaign.contentObjective || "Goal belum diisi"}</p><div className="mt-3 flex flex-wrap gap-1.5">{campaign.affiliateAccounts?.map((account) => <Badge key={account.id}>{account.platform}: {account.handle}</Badge>)}</div></article>)}</div> : <div className="mt-5"><EmptyCard title="Belum ada campaign" description="Pilih produk dari Product Intelligence Center lalu buat campaign terlebih dahulu." /></div>}</DashboardPanel><CampaignCreationModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={() => load()} /></>;
}

export function AffiliateDownstreamPanel() {
  return <DashboardPanel title="Content Factory" description="Generate script, hook, caption, hashtag, CTA, voice over, dan scene plan dari campaign yang sudah punya affiliate plan."><div className="grid gap-3 md:grid-cols-3"><Action href="/content-factory" icon={Store} title="Open Content Factory" detail="Generate dan simpan content kit ke GeneratedContent." /><Action href="/publishing-center" icon={CalendarClock} title="Publishing Center" detail="Review package dan export manual." /><Action href="/analytics/dashboard" icon={BarChart3} title="Analytics Dashboard" detail="Pantau performa umum dan insight growth." /></div></DashboardPanel>;
}

export function AffiliateSchedulerPanel() {
  const [campaigns, setCampaigns] = useState<AffiliateCampaignDraft[]>([]);
  const [contents, setContents] = useState<GeneratedContentDto[]>([]);
  const [schedules, setSchedules] = useState<ScheduleDto[]>([]);
  const [form, setForm] = useState({ campaignId: "", generatedContentId: "", affiliateAccountId: "", date: "", time: "", status: "SCHEDULED" });
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const campaign = campaigns.find((item) => item.id === form.campaignId);
  useEffect(() => { listCampaigns().then((result) => { const items = result.items.filter((item) => item.dataSource === "database"); setCampaigns(items); setForm((current) => ({ ...current, campaignId: current.campaignId || items[0]?.id || "" })); }); loadSchedules().finally(() => setLoading(false)); }, []);
  useEffect(() => { if (!form.campaignId) return; fetch(`/api/affiliate/generated-content?campaignId=${form.campaignId}`, { cache: "no-store" }).then((response) => response.json()).then((payload) => { const rows = Array.isArray(payload.generatedContent) ? payload.generatedContent : []; setContents(rows); setForm((current) => ({ ...current, generatedContentId: rows[0]?.id ?? "" })); }).catch(() => setContents([])); }, [form.campaignId]);
  async function loadSchedules() { const response = await fetch("/api/affiliate/schedules", { cache: "no-store" }); const payload = await response.json(); if (response.ok) setSchedules(Array.isArray(payload.schedules) ? payload.schedules : []); }
  async function saveSchedule() {
    if (!form.generatedContentId || !form.affiliateAccountId || !form.date || !form.time) { setError("Pilih generated content, account, platform/date/time sebelum schedule."); return; }
    setSaving(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/affiliate/schedules", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "Schedule gagal disimpan.");
      setNotice(payload.message); await loadSchedules();
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Schedule gagal disimpan."); }
    finally { setSaving(false); }
  }
  return <DashboardPanel title="Publishing / Scheduler" description="MVP manual posting planner. Belum auto-post API, hanya simpan jadwal dan status.">{notice ? <p className="rounded-xl border border-emerald-300/20 bg-emerald-300/[0.06] p-3 text-xs text-emerald-100">{notice}</p> : null}{error ? <div className="mt-3"><ErrorCard compact title="Schedule failed" description={error} /></div> : null}<div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5"><Select label="Campaign" value={form.campaignId} options={campaigns.map((item) => item.id)} labels={campaigns.map((item) => item.campaignName)} onChange={(campaignId) => setForm({ ...form, campaignId, generatedContentId: "", affiliateAccountId: "" })} /><Select label="Generated Content" value={form.generatedContentId} options={contents.map((item) => item.id)} labels={contents.map((item) => `${item.contentType}: ${item.title}`)} onChange={(generatedContentId) => setForm({ ...form, generatedContentId })} /><Select label="Affiliate Account" value={form.affiliateAccountId} options={campaign?.affiliateAccountIds ?? []} labels={campaign?.affiliateAccounts?.map((item) => `${item.platform} ${item.handle}`) ?? []} onChange={(affiliateAccountId) => setForm({ ...form, affiliateAccountId })} /><Field label="Date" type="date" value={form.date} onChange={(date) => setForm({ ...form, date })} /><Field label="Time" type="time" value={form.time} onChange={(time) => setForm({ ...form, time })} /><Select label="Status" value={form.status} options={["DRAFT", "SCHEDULED", "POSTED", "FAILED"]} onChange={(status) => setForm({ ...form, status })} /><button type="button" onClick={saveSchedule} disabled={saving || !contents.length} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CalendarClock className="h-4 w-4" />}Save Schedule</button></div>{loading ? <p className="mt-5 text-xs text-slate-500">Loading schedules...</p> : schedules.length ? <div className="mt-5 grid gap-3 md:grid-cols-3">{schedules.slice(0, 6).map((item) => <article key={item.id} className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4"><Badge>{item.status}</Badge><p className="mt-3 text-sm font-semibold text-white">{item.socialAccount?.name ?? "Manual Account"}</p><p className="mt-1 text-xs text-slate-500">{item.scheduledAt ? new Date(item.scheduledAt).toLocaleString("id-ID") : item.postingTime}</p></article>)}</div> : <div className="mt-5"><EmptyCard title="Belum ada schedule" description="Generate content dulu, lalu pilih account dan jadwal posting manual." /></div>}</DashboardPanel>;
}

export function AffiliateAnalyticsPanel() {
  const [campaigns, setCampaigns] = useState<AffiliateCampaignDraft[]>([]);
  const [contents, setContents] = useState<GeneratedContentDto[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [form, setForm] = useState({ campaignId: "", generatedContentId: "", affiliateAccountId: "", views: "", likes: "", comments: "", shares: "", saves: "", clicks: "", sales: "", commission: "" });
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const campaign = campaigns.find((item) => item.id === form.campaignId);
  useEffect(() => { listCampaigns().then((result) => { const items = result.items.filter((item) => item.dataSource === "database"); setCampaigns(items); setForm((current) => ({ ...current, campaignId: current.campaignId || items[0]?.id || "" })); }); loadAnalytics(); }, []);
  useEffect(() => { if (!form.campaignId) return; fetch(`/api/affiliate/generated-content?campaignId=${form.campaignId}`, { cache: "no-store" }).then((response) => response.json()).then((payload) => { const rows = Array.isArray(payload.generatedContent) ? payload.generatedContent : []; setContents(rows); setForm((current) => ({ ...current, generatedContentId: rows[0]?.id ?? "" })); }).catch(() => setContents([])); }, [form.campaignId]);
  async function loadAnalytics() { const response = await fetch("/api/affiliate/analytics", { cache: "no-store" }); const payload = await response.json(); if (response.ok) setSummary(payload.summary); }
  async function saveAnalytics() {
    if (!form.campaignId || !form.affiliateAccountId) { setError("Pilih campaign dan affiliate account terlebih dahulu."); return; }
    setSaving(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/affiliate/analytics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "Analytics gagal disimpan.");
      setNotice(payload.message); await loadAnalytics();
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Analytics gagal disimpan."); }
    finally { setSaving(false); }
  }
  const fields = ["views", "likes", "comments", "shares", "saves", "clicks", "sales", "commission"] as const;
  return <DashboardPanel title="Analytics & Profit Center" description="Input manual performance untuk campaign/content affiliate dan lihat summary conversion.">{notice ? <p className="rounded-xl border border-emerald-300/20 bg-emerald-300/[0.06] p-3 text-xs text-emerald-100">{notice}</p> : null}{error ? <div className="mt-3"><ErrorCard compact title="Analytics failed" description={error} /></div> : null}<div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4"><Select label="Campaign" value={form.campaignId} options={campaigns.map((item) => item.id)} labels={campaigns.map((item) => item.campaignName)} onChange={(campaignId) => setForm({ ...form, campaignId, generatedContentId: "", affiliateAccountId: "" })} /><Select label="Generated Content" value={form.generatedContentId} options={contents.map((item) => item.id)} labels={contents.map((item) => `${item.contentType}: ${item.title}`)} onChange={(generatedContentId) => setForm({ ...form, generatedContentId })} /><Select label="Affiliate Account" value={form.affiliateAccountId} options={campaign?.affiliateAccountIds ?? []} labels={campaign?.affiliateAccounts?.map((item) => `${item.platform} ${item.handle}`) ?? []} onChange={(affiliateAccountId) => setForm({ ...form, affiliateAccountId })} />{fields.map((field) => <Field key={field} label={field} type="number" value={form[field]} onChange={(value) => setForm({ ...form, [field]: value })} />)}<button type="button" onClick={saveAnalytics} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}Save Analytics</button></div>{summary ? <div className="mt-5 grid gap-3 md:grid-cols-5"><Metric label="Views" value={summary.views.toLocaleString("id-ID")} /><Metric label="Engagement" value={`${summary.engagementRate}%`} /><Metric label="Clicks" value={summary.clicks.toLocaleString("id-ID")} /><Metric label="Conversion" value={`${summary.conversionRate}%`} /><Metric label="Earning" value={`Rp${Math.round(summary.commission).toLocaleString("id-ID")}`} /></div> : <div className="mt-5"><EmptyCard title="Belum ada analytics" description="Input performa manual setelah konten diposting." /></div>}</DashboardPanel>;
}

function Action({ href, icon: Icon, title, detail }: { href: string; icon: typeof Send; title: string; detail: string }) { return <Link href={href} className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4 transition hover:border-cyan-300/20 hover:bg-cyan-300/[0.035]"><Icon className="h-4 w-4 text-cyan-200" /><h3 className="mt-3 text-sm font-semibold text-white">{title}</h3><p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p></Link>; }
function Field({ label, value, type = "text", onChange }: { label: string; value: string; type?: string; onChange: (value: string) => void }) { return <label><Label>{label}</Label><input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="premium-input mt-1.5 px-3 py-2.5 text-sm" /></label>; }
function Select({ label, value, options, labels = options, onChange }: { label: string; value: string; options: string[]; labels?: string[]; onChange: (value: string) => void }) { return <label><Label>{label}</Label><select value={value} onChange={(event) => onChange(event.target.value)} className="premium-input mt-1.5 px-3 py-2.5 text-sm"><option value="">Select...</option>{options.map((option, index) => <option key={option || `empty-${index}`} value={option}>{labels[index] ?? option}</option>)}</select></label>; }
function Label({ children }: { children: React.ReactNode }) { return <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">{children}</span>; }
function Badge({ children }: { children: React.ReactNode }) { return <span className="rounded-full border border-cyan-300/15 bg-cyan-300/[0.05] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-cyan-100">{children}</span>; }
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-600">{label}</p><p className="mt-2 text-lg font-bold text-white">{value}</p></div>; }
