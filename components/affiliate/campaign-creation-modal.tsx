"use client";

import { LoaderCircle, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { AffiliateAccountDto, AffiliateCampaignDraft } from "@/lib/intelligence/action-flow";
import { persistCampaign } from "@/lib/intelligence/affiliate-persistence";

export type CampaignProductSeed = Partial<Pick<AffiliateCampaignDraft, "productId" | "productName" | "platform" | "category" | "trendScore" | "competitionLevel" | "commissionEstimate" | "priceRange" | "contentPotentialScore" | "source" | "sourceUrl" | "notes" | "isDemo" | "dataMode" | "missingProductFields">>;

type CampaignCreationModalProps = {
  open: boolean;
  seed?: CampaignProductSeed;
  onClose: () => void;
  onSaved: (campaign: AffiliateCampaignDraft, message: string) => void;
};

const emptyForm = {
  campaignName: "",
  productName: "",
  targetAudience: "",
  platform: "tiktok",
  contentObjective: "sales conversion",
  budget: "",
  status: "draft" as AffiliateCampaignDraft["status"],
  affiliateAccountIds: [] as string[],
  targetPlatforms: [] as string[]
};

export function CampaignCreationModal({ open, seed, onClose, onSaved }: CampaignCreationModalProps) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [accounts, setAccounts] = useState<AffiliateAccountDto[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError("");
    setForm({
      campaignName: `${seed?.productName ?? ""} Campaign`,
      productName: seed?.productName ?? "",
      targetAudience: "",
      platform: normalizePlatform(seed?.platform),
      contentObjective: "sales conversion",
      budget: "",
      status: "draft",
      affiliateAccountIds: [],
      targetPlatforms: []
    });
    setLoadingAccounts(true);
    fetch("/api/affiliate/accounts", { cache: "no-store" }).then((response) => response.json()).then((payload) => setAccounts(Array.isArray(payload.accounts) ? payload.accounts : [])).catch(() => setError("Affiliate accounts gagal dimuat. Tambahkan akun terlebih dahulu.")).finally(() => setLoadingAccounts(false));
  }, [open, seed]);

  if (!open) return null;

  async function save() {
    if (!form.campaignName.trim() || !form.productName.trim() || !form.targetAudience.trim() || !form.contentObjective.trim()) {
      setError("Campaign name, product, audience, dan goal wajib diisi.");
      return;
    }
    if (!form.affiliateAccountIds.length) {
      setError("Pilih minimal satu affiliate account sebelum menyimpan campaign.");
      return;
    }
    if (seed?.missingProductFields?.length) {
      setError(`Product data belum lengkap: ${seed.missingProductFields.join(", ")}. Lengkapi data real/manual sebelum membuat campaign.`);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const result = await persistCampaign({
        campaignName: form.campaignName.trim(),
        productName: form.productName.trim(),
        targetAudience: form.targetAudience.trim(),
        contentObjective: form.contentObjective.trim(),
        affiliateAccountIds: form.affiliateAccountIds,
        targetPlatforms: form.targetPlatforms,
        budget: form.budget.trim(),
        status: form.status,
        platform: form.platform,
        category: seed?.category ?? "Affiliate Product",
        trendScore: seed?.trendScore ?? 0,
        competitionLevel: seed?.competitionLevel ?? "Validate manually",
        commissionEstimate: seed?.commissionEstimate ?? "",
        priceRange: seed?.priceRange ?? "",
        contentPotentialScore: seed?.contentPotentialScore ?? 0,
        source: seed?.source ?? "Affiliate Center",
        sourceUrl: seed?.sourceUrl,
        productId: seed?.productId,
        dataMode: seed?.dataMode,
        missingProductFields: seed?.missingProductFields,
        notes: seed?.notes ?? "",
        isDemo: seed?.dataMode === "DEMO DATA" || Boolean(seed?.isDemo)
      });
      if (result.source !== "database") {
        setError("Campaign belum tersimpan ke Supabase. Periksa koneksi database lalu coba lagi.");
        return;
      }
      onSaved(result.item, result.message);
      onClose();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Campaign gagal disimpan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#020617]/80 p-4 backdrop-blur-sm">
      <section role="dialog" aria-modal="true" aria-labelledby="campaign-modal-title" className="premium-panel max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl p-5 shadow-2xl md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-200">Affiliate Workflow</p>
            <h2 id="campaign-modal-title" className="mt-2 text-xl font-semibold text-white">Create Campaign</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">Save campaign context before running Affiliate Engine.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close campaign modal" className="rounded-lg border border-white/10 p-2 text-slate-400 transition hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Campaign Name" value={form.campaignName} onChange={(campaignName) => setForm({ ...form, campaignName })} />
          <Field label="Product" value={form.productName} onChange={(productName) => setForm({ ...form, productName })} />
          <Field label="Product Source" value={seed?.source ?? "Affiliate Center"} onChange={() => {}} disabled />
          <Field label="Data Mode" value={seed?.dataMode ?? (seed?.isDemo ? "DEMO DATA" : "MANUAL DATA")} onChange={() => {}} disabled />
          <Field label="Category" value={seed?.category ?? "Affiliate Product"} onChange={() => {}} disabled />
          <div className="md:col-span-2"><Field label="Audience" value={form.targetAudience} onChange={(targetAudience) => setForm({ ...form, targetAudience })} /></div>
          <div className="md:col-span-2"><Field label="Goal" value={form.contentObjective} onChange={(contentObjective) => setForm({ ...form, contentObjective })} /></div>
          <Field label="Budget Optional" value={form.budget} onChange={(budget) => setForm({ ...form, budget })} />
          <Select label="Status" value={form.status} options={["draft", "testing", "active", "winner", "paused"]} onChange={(status) => setForm({ ...form, status: status as AffiliateCampaignDraft["status"] })} />
        </div>
        <div className="mt-5 rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Selected Affiliate Accounts</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">Pilih satu atau beberapa account target. Platform target mengikuti akun yang dipilih.</p>
          {loadingAccounts ? <p className="mt-3 inline-flex items-center gap-2 text-xs text-slate-500"><LoaderCircle className="h-3.5 w-3.5 animate-spin" />Loading affiliate accounts...</p> : accounts.length ? <div className="mt-3 grid gap-2 md:grid-cols-2">{accounts.map((account) => <label key={account.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-white/[0.07] bg-white/[0.025] p-3"><input type="checkbox" checked={form.affiliateAccountIds.includes(account.id)} onChange={() => toggleAccount(account)} className="mt-0.5 accent-cyan-400" /><span><span className="block text-xs font-semibold text-slate-200">{account.platform} - {account.accountName}</span><span className="mt-1 block text-[11px] text-slate-500">{account.handle} | {account.role} | {account.status}</span></span></label>)}</div> : <p className="mt-3 rounded-lg border border-dashed border-white/10 p-3 text-xs text-amber-100">Belum ada affiliate account. Tambahkan akun pada section Affiliate Accounts terlebih dahulu.</p>}
        </div>
        {error ? <p className="mt-4 rounded-xl border border-rose-300/20 bg-rose-300/[0.06] p-3 text-xs leading-5 text-rose-100">{error}</p> : null}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-slate-300">Cancel</button>
          <button type="button" onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}Save Campaign</button>
        </div>
      </section>
    </div>
  );

  function toggleAccount(account: AffiliateAccountDto) {
    const selected = form.affiliateAccountIds.includes(account.id);
    const affiliateAccountIds = selected ? form.affiliateAccountIds.filter((id) => id !== account.id) : [...form.affiliateAccountIds, account.id];
    const selectedAccounts = accounts.filter((item) => affiliateAccountIds.includes(item.id));
    setForm({ ...form, affiliateAccountIds, targetPlatforms: [...new Set(selectedAccounts.map((item) => item.platform))], platform: normalizePlatform(selectedAccounts[0]?.platform ?? seed?.platform) });
  }
}

function Field({ label, value, onChange, disabled = false }: { label: string; value: string; onChange: (value: string) => void; disabled?: boolean }) {
  return <label><span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</span><input value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className="premium-input mt-1.5 px-3 py-2.5 text-sm disabled:opacity-60" /></label>;
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label><span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="premium-input mt-1.5 px-3 py-2.5 text-sm">{options.map((option) => <option key={option}>{option}</option>)}</select></label>;
}

function normalizePlatform(platform?: string) {
  const value = platform?.toLowerCase() ?? "";
  if (value.includes("tiktok")) return "tiktok";
  if (value.includes("youtube")) return "youtube";
  if (value.includes("instagram")) return "instagram";
  if (value.includes("facebook")) return "facebook";
  return "shopee";
}
