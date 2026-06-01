"use client";

import {
  Bell,
  Bot,
  CheckCircle2,
  CreditCard,
  FolderArchive,
  Image as ImageIcon,
  Save,
  Settings,
  Upload,
  UsersRound
} from "lucide-react";
import type { ChangeEvent, ReactNode } from "react";
import { useState } from "react";
import { BrandLogo, useBranding } from "@/components/branding-engine";
import { DashboardPanel } from "@/components/dashboard/ui";
import { PageHeader, StatCard } from "@/components/studio-ui";

const tabs = ["General", "Branding", "Workspace", "AI Defaults", "Notifications", "Storage", "Billing / Credits"] as const;
type SettingsTab = (typeof tabs)[number];

export function SettingsBrandingWorkspace() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("General");
  const [saved, setSaved] = useState(false);
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace Configuration"
        title="Settings & Branding Engine"
        subtitle="Manage workspace preferences, FVN identity, AI defaults, notifications, storage, and dummy credits."
        description="Settings pada halaman ini bersifat frontend-only. Existing provider, OAuth, dan Telegram configuration lama tetap tersedia melalui provider settings."
        action={{ label: "Open Provider Settings", href: "/settings/providers" }}
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Product Name" value="FVN AI Studio" detail="Primary studio identity" />
        <StatCard label="Company" value="FVN" detail="Fatih Vistara Niaga" />
        <StatCard label="Settings Groups" value="07" detail="Frontend configuration tabs" />
        <StatCard label="Preview Status" value={saved ? "Saved" : "Draft"} detail="Local browser preview only" />
      </div>

      <div className="premium-panel overflow-x-auto rounded-2xl p-2">
        <div className="flex min-w-max gap-1">
          {tabs.map((tab) => (
            <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`rounded-xl px-4 py-2.5 text-xs font-semibold transition ${activeTab === tab ? "bg-gradient-to-r from-blue-500/30 to-cyan-300/10 text-cyan-100" : "text-slate-500 hover:bg-white/[0.035] hover:text-slate-300"}`}>{tab}</button>
          ))}
        </div>
      </div>

      {activeTab === "General" ? <GeneralSettings /> : null}
      {activeTab === "Branding" ? <BrandingSettings onChange={() => setSaved(false)} /> : null}
      {activeTab === "Workspace" ? <WorkspaceSettings /> : null}
      {activeTab === "AI Defaults" ? <AIDefaultSettings /> : null}
      {activeTab === "Notifications" ? <NotificationSettings /> : null}
      {activeTab === "Storage" ? <StorageSettings /> : null}
      {activeTab === "Billing / Credits" ? <BillingSettings /> : null}

      <div className="flex flex-col gap-3 rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.04] p-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <div className="text-sm font-semibold text-slate-200">Frontend preview mode</div>
          <p className="mt-1 text-xs leading-5 text-slate-500">Save menyimpan preview branding ke browser lokal. Provider secrets tetap dikelola melalui halaman provider settings yang sudah ada.</p>
        </div>
        <button type="button" onClick={() => setSaved(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white"><Save className="h-4 w-4" />Save Preview Settings</button>
      </div>
    </div>
  );
}

function GeneralSettings() {
  return (
    <SettingsPanel title="General Settings" description="Default studio preferences for new workspaces.">
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="App Name" defaultValue="FVN AI Studio" />
        <SelectField label="Default Language" options={["Bahasa Indonesia", "English", "Multilingual"]} />
        <SelectField label="Default Platform" options={["YouTube Shorts", "TikTok", "Instagram Reels", "Facebook Reels"]} />
        <SelectField label="Default Content Type" options={["Short-form Video", "Long-form Video", "Carousel", "Affiliate Content"]} />
      </div>
    </SettingsPanel>
  );
}

function BrandingSettings({ onChange }: { onChange: () => void }) {
  const { branding, updateBranding } = useBranding();

  function update(patch: Parameters<typeof updateBranding>[0]) {
    updateBranding(patch);
    onChange();
  }

  function readPreview(event: ChangeEvent<HTMLInputElement>, key: "logoDataUrl" | "faviconDataUrl") {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => update({ [key]: typeof reader.result === "string" ? reader.result : "" });
    reader.readAsDataURL(file);
  }

  return (
    <div className="grid gap-6 2xl:grid-cols-[1.35fr_0.65fr]">
      <SettingsPanel title="Branding Engine FVN" description="Upload local visual previews and update the studio identity.">
        <div className="grid gap-4 md:grid-cols-2">
          <UploadBox title="Upload Logo" detail="PNG, JPG, WEBP, or SVG local preview." icon={<Upload className="h-5 w-5" />} onChange={(event) => readPreview(event, "logoDataUrl")} />
          <UploadBox title="Upload Favicon" detail="Square ICO, PNG, or SVG local preview." icon={<ImageIcon className="h-5 w-5" />} onChange={(event) => readPreview(event, "faviconDataUrl")} />
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <ControlledField label="Company Name" value={branding.companyName} onChange={(value) => update({ companyName: value })} />
          <ControlledField label="Brand Short Name" value={branding.shortName} onChange={(value) => update({ shortName: value })} />
          <ControlledField label="Product Name" value={branding.productName} onChange={(value) => update({ productName: value, appName: value })} />
          <ControlledField label="Brand Color" value={branding.brandColor} onChange={(value) => update({ brandColor: value })} />
          <ControlledField label="Tagline" value={branding.tagline} onChange={(value) => update({ tagline: value })} />
          <ControlledField label="Footer Text" value={branding.footerText} onChange={(value) => update({ footerText: value })} />
        </div>
      </SettingsPanel>
      <DashboardPanel title="Brand Preview" description="Live local preview used by the sidebar and footer.">
        <div className="rounded-xl border border-cyan-300/10 bg-cyan-300/[0.04] p-5">
          <BrandLogo size="lg" />
          <div className="mt-5 text-lg font-bold text-white">{branding.productName}</div>
          <div className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{branding.companyName}</div>
          <p className="mt-4 text-sm leading-6 text-slate-400">{branding.tagline}</p>
        </div>
        <div className="mt-3 space-y-2">
          <PreviewStatus label="Logo" ready={Boolean(branding.logoDataUrl)} />
          <PreviewStatus label="Favicon" ready={Boolean(branding.faviconDataUrl)} />
        </div>
      </DashboardPanel>
    </div>
  );
}

function WorkspaceSettings() {
  return (
    <SettingsPanel title="Workspace" description="Dummy collaboration and approval configuration.">
      <div className="grid gap-4 lg:grid-cols-3">
        <InfoCard icon={<UsersRound className="h-4 w-4" />} title="Team Members" value="04 members" detail="Admin, Creator, Reviewer, Analyst" />
        <InfoCard icon={<Settings className="h-4 w-4" />} title="Role Access" value="Role-based dummy" detail="Configure module access in a future sprint" />
        <InfoCard icon={<CheckCircle2 className="h-4 w-4" />} title="Approval Flow" value="Reviewer required" detail="Creator → Reviewer → Manual Export" />
      </div>
    </SettingsPanel>
  );
}

function AIDefaultSettings() {
  return (
    <SettingsPanel title="AI Defaults" description="Dummy defaults for future generation workflows.">
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField label="Default AI Provider" options={["Gemini", "OpenAI", "Claude / Optional", "Local Model / Future"]} />
        <SelectField label="Default Script Tone" options={["Professional", "Conversational", "Educational", "Affiliate Conversion"]} />
        <SelectField label="Default Video Duration" options={["30 seconds", "45 seconds", "60 seconds", "90 seconds"]} />
        <SelectField label="Default Voice Style" options={["Natural", "Energetic", "Calm", "Manual Voice Upload"]} />
        <SelectField label="Safety Level" options={["Strict", "Balanced", "Manual Review Required"]} />
      </div>
    </SettingsPanel>
  );
}

function NotificationSettings() {
  return (
    <SettingsPanel title="Notifications" description="Dummy notification preferences. Existing Telegram configuration is unchanged.">
      <div className="grid gap-3 md:grid-cols-2">
        <ToggleSetting label="Telegram Approval" detail="Send approval requests to the configured bot." enabled />
        <ToggleSetting label="Email Notification" detail="Send operational summaries by email." />
        <ToggleSetting label="Dashboard Notification" detail="Show safe notifications inside the workspace." enabled />
        <ToggleSetting label="Weekly Report" detail="Prepare a weekly analytics digest." enabled />
      </div>
    </SettingsPanel>
  );
}

function StorageSettings() {
  return (
    <SettingsPanel title="Storage" description="Dummy storage readiness overview.">
      <div className="grid gap-4 lg:grid-cols-4">
        <InfoCard icon={<FolderArchive className="h-4 w-4" />} title="Local Video Storage" value="Enabled" detail="Local upload and export workspace" />
        <InfoCard icon={<FolderArchive className="h-4 w-4" />} title="Supabase Metadata" value="Fallback active" detail="UI remains available while DB is offline" />
        <InfoCard icon={<FolderArchive className="h-4 w-4" />} title="GitHub Backup" value="Not configured" detail="Optional future backup integration" />
        <InfoCard icon={<FolderArchive className="h-4 w-4" />} title="Export Folder" value="/exports" detail="Manual posting bundle destination" />
      </div>
    </SettingsPanel>
  );
}

function BillingSettings() {
  return (
    <SettingsPanel title="Billing / Credits" description="Dummy credit summary. No billing provider is connected.">
      <div className="grid gap-4 lg:grid-cols-3">
        <InfoCard icon={<CreditCard className="h-4 w-4" />} title="AI Credits" value="7,850" detail="Dummy remaining studio credits" />
        <InfoCard icon={<Bot className="h-4 w-4" />} title="Monthly Usage" value="2,150" detail="21.5% of dummy monthly allowance" />
        <InfoCard icon={<Bell className="h-4 w-4" />} title="Reset Date" value="01 Jul 2026" detail="Dummy monthly credit cycle" />
      </div>
    </SettingsPanel>
  );
}

function SettingsPanel({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <DashboardPanel title={title} description={description}>{children}</DashboardPanel>;
}

function TextField({ label, defaultValue }: { label: string; defaultValue: string }) {
  return <label><FieldLabel>{label}</FieldLabel><input defaultValue={defaultValue} className="premium-input px-4 py-3 text-sm" /></label>;
}

function ControlledField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label><FieldLabel>{label}</FieldLabel><input value={value} onChange={(event) => onChange(event.target.value)} className="premium-input px-4 py-3 text-sm" /></label>;
}

function SelectField({ label, options }: { label: string; options: string[] }) {
  return <label><FieldLabel>{label}</FieldLabel><select className="premium-input px-4 py-3 text-sm">{options.map((option) => <option key={option}>{option}</option>)}</select></label>;
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="mb-2 block text-xs font-semibold text-slate-400">{children}</span>;
}

function UploadBox({ title, detail, icon, onChange }: { title: string; detail: string; icon: ReactNode; onChange: (event: ChangeEvent<HTMLInputElement>) => void }) {
  return <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-cyan-300/20 bg-cyan-300/[0.035] p-4 text-center text-cyan-200 transition hover:bg-cyan-300/[0.06]"><input type="file" accept="image/*,.ico" onChange={onChange} className="sr-only" />{icon}<div className="mt-3 text-sm font-semibold text-slate-200">{title}</div><p className="mt-1.5 text-xs leading-5 text-slate-500">{detail}</p></label>;
}

function PreviewStatus({ label, ready }: { label: string; ready: boolean }) {
  return <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.025] p-3 text-xs"><span className="text-slate-400">{label}</span><span className={ready ? "text-emerald-200" : "text-slate-500"}>{ready ? "Local preview ready" : "Text fallback active"}</span></div>;
}

function InfoCard({ icon, title, value, detail }: { icon: ReactNode; title: string; value: string; detail: string }) {
  return <article className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4"><div className="text-cyan-200">{icon}</div><div className="mt-4 text-xs font-semibold text-slate-500">{title}</div><div className="mt-2 text-lg font-bold text-white">{value}</div><p className="mt-1.5 text-xs leading-5 text-slate-500">{detail}</p></article>;
}

function ToggleSetting({ label, detail, enabled = false }: { label: string; detail: string; enabled?: boolean }) {
  const [active, setActive] = useState(enabled);
  return <button type="button" onClick={() => setActive((current) => !current)} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] p-4 text-left"><span className={`relative h-6 w-11 shrink-0 rounded-full transition ${active ? "bg-cyan-400/70" : "bg-slate-700"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${active ? "left-6" : "left-1"}`} /></span><span><span className="block text-sm font-semibold text-slate-200">{label}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{detail}</span></span></button>;
}
