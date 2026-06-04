"use client";

import { AlertTriangle, CheckCircle2, RefreshCcw, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { DashboardPanel } from "@/components/dashboard/ui";

type HealthStatus = "Healthy" | "Warning" | "Error";
type HealthService = { name: string; status: HealthStatus; message: string; last_check: string; response_time_ms: number; error_count: number };
type ErrorEvent = { id: string; timestamp: string; category: string; level: "warning" | "error"; event: string; message: string };
type HealthPayload = { services?: HealthService[]; errors?: ErrorEvent[]; checked_at?: string };

const statusTone: Record<HealthStatus, string> = {
  Healthy: "border-emerald-300/20 bg-emerald-300/[0.06] text-emerald-100",
  Warning: "border-amber-300/20 bg-amber-300/[0.06] text-amber-100",
  Error: "border-rose-300/20 bg-rose-300/[0.06] text-rose-100"
};

export function SystemHealthPanel() {
  const [payload, setPayload] = useState<HealthPayload>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/system-health", { cache: "no-store" });
      if (!response.ok) throw new Error("System health endpoint unavailable.");
      setPayload(await response.json());
      setMessage("");
    } catch {
      setPayload({ services: [], errors: [] });
      setMessage("System health belum dapat dimuat. UI tetap tersedia dalam fallback mode.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <DashboardPanel title="System Health Panel" description="Runtime status read-only. Refresh tidak mengirim request ke provider eksternal.">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500">{payload.checked_at ? `Last check ${new Date(payload.checked_at).toLocaleString("id-ID")}` : "Status runtime belum tersedia."}</p>
          <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-lg border border-cyan-300/15 bg-cyan-300/[0.06] px-3 py-2 text-xs font-semibold text-cyan-100"><RefreshCcw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh</button>
        </div>
        {message ? <div className="rounded-xl border border-amber-300/20 bg-amber-300/[0.06] p-3 text-xs text-amber-100">{message}</div> : null}
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(payload.services ?? []).map((service) => <HealthCard key={service.name} service={service} />)}
          {!loading && !(payload.services ?? []).length ? <div className="rounded-xl border border-dashed border-white/10 p-4 text-xs text-slate-500">Belum ada health data.</div> : null}
        </div>
      </DashboardPanel>
      <DashboardPanel title="Error Registry" description="Provider errors, fallback events, timeout, validation, dan API diagnostics yang sudah disanitasi.">
        <div className="space-y-2">
          {(payload.errors ?? []).map((error) => (
            <div key={error.id} className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2"><span className={error.level === "error" ? "text-xs font-semibold text-rose-200" : "text-xs font-semibold text-amber-200"}>{error.event}</span><span className="text-[10px] uppercase tracking-wide text-slate-600">{error.category} - {new Date(error.timestamp).toLocaleTimeString("id-ID")}</span></div>
              <p className="mt-2 text-xs leading-5 text-slate-500">{error.message}</p>
            </div>
          ))}
          {!loading && !(payload.errors ?? []).length ? <div className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-slate-500">Belum ada error event pada proses runtime ini.</div> : null}
        </div>
      </DashboardPanel>
    </div>
  );
}

function HealthCard({ service }: { service: HealthService }) {
  const Icon = service.status === "Healthy" ? CheckCircle2 : service.status === "Warning" ? AlertTriangle : XCircle;
  return (
    <article className={`rounded-xl border p-4 ${statusTone[service.status]}`}>
      <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2 text-sm font-semibold"><Icon className="h-4 w-4" />{service.name}</div><span className="text-[10px] font-bold uppercase tracking-wide">{service.status}</span></div>
      <p className="mt-3 min-h-10 text-xs leading-5 opacity-80">{service.message}</p>
      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-current/10 pt-3 text-[10px] uppercase tracking-wide opacity-70"><span>{service.response_time_ms} ms</span><span className="text-right">{service.error_count} errors</span></div>
    </article>
  );
}
