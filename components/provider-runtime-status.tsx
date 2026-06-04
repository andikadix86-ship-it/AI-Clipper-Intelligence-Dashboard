"use client";

import { AlertTriangle, CheckCircle2, Loader2, RefreshCcw, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { DashboardPanel } from "@/components/dashboard/ui";

type ProviderRow = {
  provider?: string;
  status?: string;
  providerStatus?: string;
  mode?: string;
  lastTest?: string;
  errorMessage?: string;
};

export function ProviderRuntimeStatus({ compact = false }: { compact?: boolean }) {
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/providers/status", { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error ?? "Provider status endpoint unavailable.");
      setProviders(Array.isArray(payload.providers) ? payload.providers : []);
      setMessage("");
    } catch (error) {
      setProviders([]);
      setMessage(error instanceof Error ? error.message : "Provider status belum dapat dimuat.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function testProvider(provider: string) {
    const target = provider === "Telegram Bot" ? "/api/providers/test/telegram" : "/api/providers/test";
    const body = provider === "Telegram Bot" ? {} : { provider };
    setTesting(provider);
    setMessage("");
    try {
      const response = await fetch(target, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const payload = await response.json().catch(() => ({}));
      const result = payload.result ?? payload.data?.result;
      if (!response.ok) throw new Error(payload.error ?? payload.message ?? "Provider test failed.");
      setMessage(result?.message ?? payload.message ?? "Provider test selesai.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Provider test gagal.");
    } finally {
      setTesting("");
    }
  }

  const rows = compact ? providers.filter((provider) => ["GEMINI_VEO", "OPENAI_SORA", "Telegram Bot"].includes(provider.provider ?? "")).slice(0, 3) : providers;
  return (
    <DashboardPanel title={compact ? "Provider Runtime" : "Live Provider Runtime"} description="Status sinkron dari Settings, credential environment, dan hasil provider test terakhir.">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500">{loading ? "Memuat status provider..." : `${rows.length} provider status tersedia.`}</p>
        <button type="button" onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-cyan-300/15 bg-cyan-300/[0.06] px-3 py-2 text-xs font-semibold text-cyan-100 disabled:opacity-60">
          <RefreshCcw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>
      {message ? <div className="mb-4 rounded-xl border border-amber-300/20 bg-amber-300/[0.06] p-3 text-xs leading-5 text-amber-100">{message}</div> : null}
      <div className={`grid gap-3 ${compact ? "md:grid-cols-3" : "md:grid-cols-2 xl:grid-cols-4"}`}>
        {rows.map((provider) => <ProviderStatusCard key={provider.provider} provider={provider} testing={testing === provider.provider} onTest={testProvider} />)}
        {!loading && !rows.length ? <div className="rounded-xl border border-dashed border-white/10 p-4 text-xs text-slate-500">Status provider belum tersedia. UI tetap berjalan dengan fallback aman.</div> : null}
      </div>
    </DashboardPanel>
  );
}

function ProviderStatusCard({ provider, testing, onTest }: { provider: ProviderRow; testing: boolean; onTest: (provider: string) => void }) {
  const name = provider.provider ?? "Unknown Provider";
  const healthy = ["Ready", "Configured"].includes(provider.status ?? "");
  const error = provider.status === "Error";
  const testable = ["GEMINI_VEO", "OPENAI_SORA", "Telegram Bot"].includes(name);
  const Icon = error ? AlertTriangle : CheckCircle2;
  return (
    <article className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className={`grid h-8 w-8 place-items-center rounded-lg ${error ? "bg-rose-300/10 text-rose-200" : healthy ? "bg-emerald-300/10 text-emerald-200" : "bg-amber-300/10 text-amber-200"}`}><Icon className="h-4 w-4" /></div>
        <span className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-wide ${error ? "bg-rose-300/10 text-rose-100" : healthy ? "bg-emerald-300/10 text-emerald-100" : "bg-amber-300/10 text-amber-100"}`}>{provider.status ?? "Fallback"}</span>
      </div>
      <h3 className="mt-3 text-sm font-semibold text-slate-200">{name.replaceAll("_", " ")}</h3>
      <p className="mt-1 text-[11px] text-slate-500">{provider.mode ?? "DUMMY"} mode{provider.lastTest ? ` - tested ${new Date(provider.lastTest).toLocaleString("id-ID")}` : ""}</p>
      {provider.errorMessage ? <p className="mt-2 line-clamp-2 text-[11px] leading-4 text-rose-200">{provider.errorMessage}</p> : null}
      {testable ? <button type="button" onClick={() => onTest(name)} disabled={testing} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.035] px-3 py-2 text-[11px] font-semibold text-slate-300 disabled:opacity-60">{testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />} Test</button> : null}
    </article>
  );
}

