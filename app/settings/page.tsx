"use client";

import clsx from "clsx";
import { KeyRound, Loader2, Send, Settings, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { providerLabels } from "@/lib/dummy-creative";
import { providerStatusLabel } from "@/lib/provider-status";
import type { AIProviderDto, AIProviderName, GoogleOAuthSettingDto, OAuthProviderSettingDto, TelegramSettingDto } from "@/lib/types";

const providerNames: AIProviderName[] = ["GEMINI_VEO", "OPENAI_SORA", "RUNWAY", "PIKA", "LUMA", "MANUAL_UPLOAD"];
type ProviderStatusRow = {
  provider: string;
  status: string;
  lastTest?: string;
  errorMessage?: string;
  dailyLimit: number;
  usedToday: number;
  mode: string;
};
type TestTarget = "openai" | "gemini" | "telegram" | "youtube" | "tiktok" | "meta";
type IntelligenceProviderSetting = { provider: string; label: string; status: string; apiKeyMasked: string; credentialSource: string; lastError?: string; lastCheckedAt?: string; quota?: YouTubeQuotaSummary };
type YouTubeQuotaSummary = { estimatedUsedToday: number; requestCountToday: number; lastRequest?: { endpoint: string; keyword: string; region: string; estimatedCost: number; status: string; createdAt: string }; warning?: string };

export default function SettingsPage() {
  const [providers, setProviders] = useState<AIProviderDto[]>([]);
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [telegram, setTelegram] = useState<TelegramSettingDto>({ botTokenMasked: "", chatId: "", status: "NOT_CONNECTED", statusLabel: "Not Connected" });
  const [telegramForm, setTelegramForm] = useState({ botToken: "", chatId: "" });
  const [telegramLoading, setTelegramLoading] = useState<"save" | "test" | null>(null);
  const [googleOAuth, setGoogleOAuth] = useState<GoogleOAuthSettingDto>({ clientIdMasked: "", clientSecretMasked: "", redirectUri: "", status: "NOT_CONNECTED", statusLabel: "Not Connected" });
  const [googleForm, setGoogleForm] = useState({ clientId: "", clientSecret: "", redirectUri: "" });
  const [googleLoading, setGoogleLoading] = useState(false);
  const [oauthSettings, setOauthSettings] = useState<OAuthProviderSettingDto[]>([]);
  const [oauthForms, setOauthForms] = useState<Record<string, { clientId: string; clientSecret: string; redirectUri: string }>>({
    TIKTOK: { clientId: "", clientSecret: "", redirectUri: "" },
    META: { clientId: "", clientSecret: "", redirectUri: "" }
  });
  const [oauthSaving, setOauthSaving] = useState<string | null>(null);
  const [providerStatuses, setProviderStatuses] = useState<ProviderStatusRow[]>([]);
  const [testLoading, setTestLoading] = useState<TestTarget | null>(null);
  const [intelligenceProviders, setIntelligenceProviders] = useState<IntelligenceProviderSetting[]>([]);
  const [youtubeDataApiKey, setYoutubeDataApiKey] = useState("");
  const [intelligenceSaving, setIntelligenceSaving] = useState(false);
  const youtubeQuota = intelligenceProviders.find((item) => item.provider === "YOUTUBE_DATA_API")?.quota;

  useEffect(() => {
    loadProviders();
    fetch("/api/telegram/settings")
      .then((response) => response.json())
      .then((data) => {
        setTelegram(data.setting);
        setTelegramForm((current) => ({ ...current, chatId: data.setting.chatId ?? "" }));
      })
      .catch(() => setMessage("Telegram settings gagal dimuat."));
    fetch("/api/settings/google-oauth")
      .then((response) => response.json())
      .then((data) => {
        setGoogleOAuth(data.setting);
        setGoogleForm((current) => ({ ...current, redirectUri: data.setting.redirectUri ?? "" }));
      })
      .catch(() => setMessage("Google OAuth settings gagal dimuat."));
    fetch("/api/settings/oauth-providers")
      .then((response) => response.json())
      .then((data) => {
        setOauthSettings(data.settings ?? []);
        setOauthForms((current) => ({
          ...current,
          TIKTOK: { ...current.TIKTOK, redirectUri: data.settings?.find((item: OAuthProviderSettingDto) => item.provider === "TIKTOK")?.redirectUri ?? "" },
          META: { ...current.META, redirectUri: data.settings?.find((item: OAuthProviderSettingDto) => item.provider === "META")?.redirectUri ?? "" }
        }));
      })
      .catch(() => setMessage("OAuth provider settings gagal dimuat."));
    loadProviderStatus();
    loadIntelligenceProviders();
  }, []);

  async function loadIntelligenceProviders() {
    try {
      const response = await fetch("/api/settings/intelligence-providers");
      const data = await response.json();
      setIntelligenceProviders(data.settings ?? []);
    } catch {
      setIntelligenceProviders([]);
    }
  }

  async function saveYouTubeDataApiKey() {
    setIntelligenceSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/settings/intelligence-providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "YOUTUBE_DATA_API", apiKey: youtubeDataApiKey })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "YouTube Data API setting could not be saved.");
      setIntelligenceProviders(data.settings ?? []);
      setYoutubeDataApiKey("");
      setMessage("YouTube Data API setting saved. API key is hidden after save.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "YouTube Data API setting could not be saved.");
    } finally {
      setIntelligenceSaving(false);
    }
  }

  async function loadProviders() {
    try {
      const response = await fetch("/api/providers");
      const data = await response.json();
      setProviders(data.providers ?? []);
    } catch {
      setProviders([]);
    }
  }

  async function loadProviderStatus() {
    try {
      const response = await fetch("/api/providers/status");
      const data = await response.json();
      setProviderStatuses(data.providers ?? []);
    } catch {
      setProviderStatuses([]);
    }
  }

  function providerFor(name: AIProviderName): AIProviderDto {
    return (
      providers.find((provider) => provider.name === name) ?? {
        name,
        status: "NOT_CONNECTED",
        dailyLimit: 0,
        usedToday: 0,
        resetTime: "00:00",
        isActive: false
      }
    );
  }

  function updateProvider(name: AIProviderName, patch: Partial<AIProviderDto>) {
    setProviders((current) => {
      const exists = current.some((provider) => provider.name === name);
      if (!exists) return [...current, { ...providerFor(name), ...patch }];
      return current.map((provider) => (provider.name === name ? { ...provider, ...patch } : provider));
    });
  }

  async function saveProvider(name: AIProviderName) {
    const provider = providerFor(name);
    setSaving(name);
    setMessage(null);
    const response = await fetch("/api/providers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...provider, apiKey: keys[name] })
    });
    const data = await response.json();
    setSaving(null);
    if (!response.ok) {
      setMessage(data.error ?? "Provider could not be saved.");
      return;
    }
    updateProvider(name, data.provider);
    setKeys((current) => ({ ...current, [name]: "" }));
    setMessage(data.warning ?? `${providerLabels[name]} saved. API key is hidden after save.`);
    await Promise.all([loadProviders(), loadProviderStatus()]);
  }

  async function testProvider(name: AIProviderName) {
    const provider = providerFor(name);
    setSaving(`test:${name}`);
    setMessage(null);
    const response = await fetch("/api/providers/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: name, mode: provider.mode ?? "DUMMY" })
    });
    const data = await response.json();
    setSaving(null);
    const result = data.result ?? data.data?.result ?? data;
    setMessage(response.ok ? `${providerLabels[name]} test: ${result.status}. ${result.warning ?? result.message ?? ""}` : data.error ?? "Provider test failed.");
    await Promise.all([loadProviders(), loadProviderStatus()]);
  }

  async function runProviderTest(target: TestTarget) {
    setTestLoading(target);
    setMessage(null);
    try {
      const response = await fetch(`/api/providers/test/${target}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      const data = await response.json();
      const result = data.result ?? data.data?.result;
      if (!response.ok) throw new Error(data.error ?? data.message ?? `${target} test failed.`);
      setMessage(`${result?.provider ?? target} test: ${result?.status ?? "Done"}. ${result?.message ?? data.message ?? ""}`);
      if (target === "telegram" && data.setting) setTelegram(data.setting);
      await Promise.all([loadProviders(), loadProviderStatus()]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : `${target} test failed.`);
    } finally {
      setTestLoading(null);
    }
  }

  async function saveTelegram() {
    setTelegramLoading("save");
    setMessage(null);
    try {
      const response = await fetch("/api/telegram/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(telegramForm)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Telegram settings could not be saved.");
      setTelegram(data.setting);
      setTelegramForm({ botToken: "", chatId: data.setting.chatId ?? "" });
      setMessage("Telegram settings saved. Bot token is hidden after save.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Telegram settings could not be saved.");
    } finally {
      setTelegramLoading(null);
    }
  }

  async function testTelegram() {
    setTelegramLoading("test");
    setMessage(null);
    try {
      const response = await fetch("/api/telegram/test", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Telegram test failed.");
      setTelegram(data.setting);
      setMessage("Telegram connection test successful.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Telegram test failed.");
    } finally {
      setTelegramLoading(null);
    }
  }

  async function saveGoogleOAuth() {
    setGoogleLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/settings/google-oauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(googleForm)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Google OAuth settings could not be saved.");
      setGoogleOAuth(data.setting);
      setGoogleForm({ clientId: "", clientSecret: "", redirectUri: data.setting.redirectUri ?? "" });
      setMessage("Google OAuth settings saved. Client secret is hidden after save.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Google OAuth settings could not be saved.");
    } finally {
      setGoogleLoading(false);
    }
  }

  function oauthSettingFor(provider: "TIKTOK" | "META") {
    return oauthSettings.find((item) => item.provider === provider) ?? { provider, clientIdMasked: "", clientSecretMasked: "", redirectUri: "", status: "NOT_CONNECTED", statusLabel: "Not Connected" };
  }

  async function saveOAuthProvider(provider: "TIKTOK" | "META") {
    setOauthSaving(provider);
    setMessage(null);
    try {
      const response = await fetch("/api/settings/oauth-providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, ...oauthForms[provider] })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? `${provider} OAuth settings could not be saved.`);
      setOauthSettings((current) => {
        const exists = current.some((item) => item.provider === provider);
        return exists ? current.map((item) => item.provider === provider ? data.setting : item) : [...current, data.setting];
      });
      setOauthForms((current) => ({ ...current, [provider]: { clientId: "", clientSecret: "", redirectUri: data.setting.redirectUri ?? "" } }));
      setMessage(`${provider} OAuth settings saved. Secret is hidden after save.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : `${provider} OAuth settings could not be saved.`);
    } finally {
      setOauthSaving(null);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1 text-sm text-teal-100">
          <Settings className="h-4 w-4" />
          Settings
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">AI Provider Settings</h1>
        <p className="mt-3 max-w-3xl text-slate-300">
          Store provider connection metadata for future real generation. API keys use password inputs and are never displayed after save.
        </p>
      </header>

      {message ? <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">{message}</div> : null}

      <section className="glass rounded-2xl p-5">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1 text-xs font-semibold text-teal-100">
              <ShieldCheck className="h-3.5 w-3.5" />
              Provider Test Center
            </div>
            <h2 className="text-2xl font-semibold text-white">Real Provider Testing & Activation</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">Run safe server-side tests. Missing credentials fall back to dummy/manual mode and never expose secrets.</p>
          </div>
          <button type="button" onClick={loadProviderStatus} className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white">
            Refresh Status
          </button>
        </div>
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {([
            ["openai", "Test OpenAI"],
            ["gemini", "Test Gemini"],
            ["telegram", "Test Telegram"],
            ["youtube", "Test YouTube OAuth"],
            ["tiktok", "Test TikTok OAuth"],
            ["meta", "Test Meta OAuth"]
          ] as Array<[TestTarget, string]>).map(([target, label]) => (
            <button
              key={target}
              type="button"
              onClick={() => runProviderTest(target)}
              disabled={testLoading !== null}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-300 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60"
            >
              {testLoading === target ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              {label}
            </button>
          ))}
        </div>
        <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
          <div className="grid grid-cols-[1.2fr_1fr_1fr_1fr_1fr] bg-white/[0.06] px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            <span>Provider</span>
            <span>Status</span>
            <span>Last Test</span>
            <span>Usage</span>
            <span>Error</span>
          </div>
          {(providerStatuses.length ? providerStatuses : [{ provider: "No status loaded", status: "Dummy", dailyLimit: 0, usedToday: 0, mode: "DUMMY" }]).map((row) => (
            <div key={row.provider} className="grid grid-cols-[1.2fr_1fr_1fr_1fr_1fr] gap-3 border-t border-white/10 px-4 py-3 text-sm text-slate-300">
              <span className="font-semibold text-white">{row.provider}</span>
              <span className={clsx("w-fit rounded-full px-2 py-1 text-xs font-semibold", row.status === "Ready" ? "bg-teal-300 text-slate-950" : row.status === "Error" ? "bg-rose-300 text-slate-950" : "bg-white/[0.08] text-slate-300")}>{row.status}</span>
              <span>{row.lastTest ? new Date(row.lastTest).toLocaleString("id-ID") : "Never"}</span>
              <span>{row.usedToday}/{row.dailyLimit || "∞"} · {row.mode}</span>
              <span className="truncate text-rose-200">{row.errorMessage || "-"}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="glass rounded-2xl p-5">
        <div className="mb-5">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-xs font-semibold text-sky-100"><KeyRound className="h-3.5 w-3.5" />Intelligence Providers</div>
          <h2 className="text-2xl font-semibold text-white">Market Data Configuration</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">YouTube Data API powers public keyword research. This key is separate from YouTube OAuth upload credentials and is never displayed after save.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="YOUTUBE_API_KEY">
            <input type="password" value={youtubeDataApiKey} onChange={(event) => setYoutubeDataApiKey(event.target.value)} placeholder={intelligenceProviders.find((item) => item.provider === "YOUTUBE_DATA_API")?.apiKeyMasked || "Paste YouTube Data API key"} className="premium-input px-4 py-3" />
          </Field>
          <Field label="Saved Key">
            <input readOnly value={intelligenceProviders.find((item) => item.provider === "YOUTUBE_DATA_API")?.apiKeyMasked || "Not saved"} className="premium-input px-4 py-3 text-slate-400" />
          </Field>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {intelligenceProviders.map((provider) => <div key={provider.provider} className="rounded-xl border border-white/10 bg-white/[0.04] p-4"><div className="flex items-center justify-between gap-3"><div className="font-semibold text-white">{provider.label}</div><span className={clsx("rounded-full px-3 py-1 text-xs font-semibold", provider.status === "CONNECTED" ? "bg-emerald-300 text-slate-950" : provider.status === "ERROR" || provider.status === "QUOTA_LIMITED" ? "bg-rose-300 text-slate-950" : "bg-amber-300/15 text-amber-100")}>{provider.status.replace("_", " ")}</span></div><p className="mt-2 text-xs leading-5 text-slate-400">{provider.provider === "GOOGLE_TRENDS" ? "Prep/demo adapter. Belum ada koneksi real." : `Credential source: ${provider.credentialSource}. ${provider.lastError || "Ready for public search test."}`}</p></div>)}
        </div>
        {youtubeQuota ? <div className="mt-4 grid gap-3 md:grid-cols-3">
          <QuotaMetric label="Estimated quota used today" value={`${youtubeQuota.estimatedUsedToday} units`} />
          <QuotaMetric label="Tracked requests today" value={String(youtubeQuota.requestCountToday)} />
          <QuotaMetric label="Last YouTube request" value={youtubeQuota.lastRequest ? `${youtubeQuota.lastRequest.endpoint} · ${youtubeQuota.lastRequest.keyword} · ${new Date(youtubeQuota.lastRequest.createdAt).toLocaleString("id-ID")}` : "No tracked request yet"} />
          {youtubeQuota.warning ? <div className="rounded-xl border border-amber-300/25 bg-amber-300/10 p-4 text-sm text-amber-100 md:col-span-3">{youtubeQuota.warning}</div> : null}
        </div> : null}
        <button type="button" onClick={saveYouTubeDataApiKey} disabled={intelligenceSaving} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-sky-300 px-5 py-3 font-semibold text-slate-950 disabled:opacity-60">{intelligenceSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}Save YouTube API Key</button>
      </section>

      <section className="glass rounded-2xl p-5">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1 text-xs font-semibold text-teal-100">
              <Send className="h-3.5 w-3.5" />
              Telegram Bot
            </div>
            <h2 className="text-2xl font-semibold text-white">Telegram Approval Settings</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">Server-side Telegram approval notifications. Bot token is never displayed after save.</p>
          </div>
          <span className={clsx("w-fit rounded-full px-3 py-1 text-xs font-semibold", telegram.status === "CONNECTED" ? "bg-teal-300 text-slate-950" : telegram.status === "ERROR" ? "bg-rose-300 text-slate-950" : "bg-white/[0.08] text-slate-300")}>
            {telegram.statusLabel}
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Bot Token">
            <input type="password" value={telegramForm.botToken} onChange={(e) => setTelegramForm({ ...telegramForm, botToken: e.target.value })} placeholder={telegram.botTokenMasked || "Paste Telegram bot token"} className="premium-input px-4 py-3" />
          </Field>
          <Field label="Chat ID">
            <input value={telegramForm.chatId} onChange={(e) => setTelegramForm({ ...telegramForm, chatId: e.target.value })} placeholder="Telegram chat ID" className="premium-input px-4 py-3" />
          </Field>
          <Field label="Saved Token">
            <input value={telegram.botTokenMasked || "Not saved"} readOnly className="premium-input px-4 py-3 text-slate-400" />
          </Field>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button type="button" onClick={saveTelegram} disabled={telegramLoading !== null} className="inline-flex items-center gap-2 rounded-2xl bg-teal-300 px-5 py-3 font-semibold text-slate-950 disabled:opacity-60">
            {telegramLoading === "save" ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
            Save Settings
          </button>
          <button type="button" onClick={testTelegram} disabled={telegramLoading !== null} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 font-semibold text-white disabled:opacity-60">
            {telegramLoading === "test" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            Test Connection
          </button>
          <span className="text-sm text-slate-400">Last test: {telegram.lastTestAt ? new Date(telegram.lastTestAt).toLocaleString("id-ID") : "Never"}</span>
        </div>
      </section>

      <section className="glass rounded-2xl p-5">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-xs font-semibold text-sky-100">
              <KeyRound className="h-3.5 w-3.5" />
              Google OAuth
            </div>
            <h2 className="text-2xl font-semibold text-white">YouTube OAuth Configuration</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">Used only server-side for YouTube Shorts account connection. Client secret is masked and never displayed.</p>
          </div>
          <span className={clsx("w-fit rounded-full px-3 py-1 text-xs font-semibold", googleOAuth.status === "CONNECTED" ? "bg-teal-300 text-slate-950" : "bg-white/[0.08] text-slate-300")}>
            {googleOAuth.statusLabel}
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="GOOGLE_CLIENT_ID">
            <input type="password" value={googleForm.clientId} onChange={(e) => setGoogleForm({ ...googleForm, clientId: e.target.value })} placeholder={googleOAuth.clientIdMasked || "Google OAuth client ID"} className="premium-input px-4 py-3" />
          </Field>
          <Field label="GOOGLE_CLIENT_SECRET">
            <input type="password" value={googleForm.clientSecret} onChange={(e) => setGoogleForm({ ...googleForm, clientSecret: e.target.value })} placeholder={googleOAuth.clientSecretMasked || "Google OAuth client secret"} className="premium-input px-4 py-3" />
          </Field>
          <Field label="GOOGLE_REDIRECT_URI">
            <input value={googleForm.redirectUri} onChange={(e) => setGoogleForm({ ...googleForm, redirectUri: e.target.value })} placeholder="http://localhost:3000/api/auth/youtube/callback" className="premium-input px-4 py-3" />
          </Field>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Field label="Saved Client ID"><input value={googleOAuth.clientIdMasked || "Not saved"} readOnly className="premium-input px-4 py-3 text-slate-400" /></Field>
          <Field label="Saved Secret"><input value={googleOAuth.clientSecretMasked || "Not saved"} readOnly className="premium-input px-4 py-3 text-slate-400" /></Field>
          <Field label="Saved Redirect URI"><input value={googleOAuth.redirectUri || "Not saved"} readOnly className="premium-input px-4 py-3 text-slate-400" /></Field>
        </div>
        <button type="button" onClick={saveGoogleOAuth} disabled={googleLoading} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-sky-300 px-5 py-3 font-semibold text-slate-950 disabled:opacity-60">
          {googleLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
          Save Google OAuth
        </button>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {(["TIKTOK", "META"] as const).map((provider) => {
          const setting = oauthSettingFor(provider);
          const form = oauthForms[provider];
          const labels = provider === "TIKTOK"
            ? { title: "TikTok OAuth", clientId: "TIKTOK_CLIENT_KEY", secret: "TIKTOK_CLIENT_SECRET", redirect: "TIKTOK_REDIRECT_URI" }
            : { title: "Meta OAuth", clientId: "META_APP_ID", secret: "META_APP_SECRET", redirect: "META_REDIRECT_URI" };
          return (
            <article key={provider} className="glass rounded-2xl p-5">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <div className="mb-2 inline-flex rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-xs font-semibold text-sky-100">OAuth Provider</div>
                  <h2 className="text-2xl font-semibold text-white">{labels.title}</h2>
                  <p className="mt-2 text-sm text-slate-400">Server-side OAuth preparation. Real upload is still disabled for this platform.</p>
                </div>
                <span className={clsx("rounded-full px-3 py-1 text-xs font-semibold", setting.status === "CONNECTED" ? "bg-teal-300 text-slate-950" : "bg-white/[0.08] text-slate-300")}>{setting.statusLabel}</span>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <Field label={labels.clientId}><input type="password" value={form.clientId} onChange={(e) => setOauthForms((current) => ({ ...current, [provider]: { ...form, clientId: e.target.value } }))} placeholder={setting.clientIdMasked || labels.clientId} className="premium-input px-4 py-3" /></Field>
                <Field label={labels.secret}><input type="password" value={form.clientSecret} onChange={(e) => setOauthForms((current) => ({ ...current, [provider]: { ...form, clientSecret: e.target.value } }))} placeholder={setting.clientSecretMasked || labels.secret} className="premium-input px-4 py-3" /></Field>
                <Field label={labels.redirect}><input value={form.redirectUri} onChange={(e) => setOauthForms((current) => ({ ...current, [provider]: { ...form, redirectUri: e.target.value } }))} placeholder={`/api/auth/${provider === "TIKTOK" ? "tiktok" : "meta"}/callback`} className="premium-input px-4 py-3" /></Field>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <Field label="Saved Client"><input value={setting.clientIdMasked || "Not saved"} readOnly className="premium-input px-4 py-3 text-slate-400" /></Field>
                <Field label="Saved Secret"><input value={setting.clientSecretMasked || "Not saved"} readOnly className="premium-input px-4 py-3 text-slate-400" /></Field>
                <Field label="Saved Redirect"><input value={setting.redirectUri || "Not saved"} readOnly className="premium-input px-4 py-3 text-slate-400" /></Field>
              </div>
              <button type="button" onClick={() => saveOAuthProvider(provider)} disabled={oauthSaving === provider} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-sky-300 px-5 py-3 font-semibold text-slate-950 disabled:opacity-60">
                {oauthSaving === provider ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                Save {provider} OAuth
              </button>
            </article>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {providerNames.map((name) => {
          const provider = providerFor(name);
          const displayStatus = provider.providerStatus ?? (provider.mode === "DUMMY" ? "DUMMY" : provider.apiKeyMasked ? "CONFIGURED" : "NOT_CONFIGURED");
          const statusTone = displayStatus === "READY" ? "bg-teal-300 text-slate-950" : displayStatus === "ERROR" ? "bg-rose-300 text-slate-950" : displayStatus === "CONFIGURED" ? "bg-sky-300 text-slate-950" : "bg-white/[0.08] text-slate-300";
          return (
            <article key={name} className="glass rounded-2xl p-5">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-semibold text-slate-200">
                    <KeyRound className="h-3.5 w-3.5" />
                    Provider Name
                  </div>
                  <h2 className="text-xl font-semibold text-white">{providerLabels[name]}</h2>
                </div>
                <span className={clsx("rounded-full px-3 py-1 text-xs font-semibold", statusTone)}>
                  {providerStatusLabel(displayStatus)}
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="API Key">
                  <input
                    type="password"
                    value={keys[name] ?? ""}
                    onChange={(e) => setKeys((current) => ({ ...current, [name]: e.target.value }))}
                    placeholder={provider.apiKeyMasked ? "Saved key hidden" : "Paste API key"}
                    className="premium-input px-4 py-3"
                  />
                </Field>
                <Field label="Reset Time">
                  <input value={provider.resetTime} onChange={(e) => updateProvider(name, { resetTime: e.target.value })} className="premium-input px-4 py-3" />
                </Field>
                <Field label="Mode">
                  <select value={provider.mode ?? "DUMMY"} onChange={(e) => updateProvider(name, { mode: e.target.value as AIProviderDto["mode"] })} className="premium-input px-4 py-3">
                    <option value="DUMMY">Dummy</option>
                    <option value="REAL">Real</option>
                  </select>
                </Field>
                <Field label="Saved Key">
                  <input value={provider.apiKeyMasked || "Not saved"} readOnly className="premium-input px-4 py-3 text-slate-400" />
                </Field>
                <Field label="Daily Limit">
                  <input type="number" value={provider.dailyLimit} onChange={(e) => updateProvider(name, { dailyLimit: Number(e.target.value) })} className="premium-input px-4 py-3" />
                </Field>
                <Field label="Used Today">
                  <input type="number" value={provider.usedToday} onChange={(e) => updateProvider(name, { usedToday: Number(e.target.value) })} className="premium-input px-4 py-3" />
                </Field>
              </div>

              <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-200">
                  <input type="checkbox" checked={provider.isActive} onChange={(e) => updateProvider(name, { isActive: e.target.checked })} className="h-5 w-5 accent-teal-300" />
                  Is Active
                </label>
                <button
                  type="button"
                  onClick={() => saveProvider(name)}
                  disabled={saving === name}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 font-semibold text-slate-950 disabled:opacity-60"
                >
                  {saving === name ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                  Save Provider
                </button>
                <button
                  type="button"
                  onClick={() => testProvider(name)}
                  disabled={saving === `test:${name}`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 font-semibold text-white disabled:opacity-60"
                >
                  {saving === `test:${name}` ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                  Test Provider
                </button>
              </div>
            </article>
          );
        })}
      </section>
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

function QuotaMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4"><div className="text-xs font-semibold uppercase text-slate-500">{label}</div><div className="mt-2 text-sm font-semibold leading-5 text-white">{value}</div></div>;
}
