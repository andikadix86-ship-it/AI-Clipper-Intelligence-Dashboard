"use client";

import { Bell, CheckCheck, RefreshCcw, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type NotificationRow = { id: string; title: string; message: string; type: string; severity: string; source: string; status: string; actionUrl?: string; createdAt: string };
type NotificationPayload = { items?: NotificationRow[]; notifications?: NotificationRow[]; unreadCount?: number; source?: string; message?: string };
const fallbackMessage = "Database unavailable, using empty notifications.";

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [message, setMessage] = useState("");
  const fallbackActive = useRef(false);

  const applyPayload = useCallback((data: NotificationPayload) => {
    setItems(data.items ?? data.notifications ?? []);
    setUnreadCount(data.unreadCount ?? 0);
    fallbackActive.current = data.source === "fallback";
    setMessage(data.message ?? "");
  }, []);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications");
      if (!response.ok) {
        applyPayload({ items: [], unreadCount: 0, source: "fallback", message: fallbackMessage });
        return;
      }
      applyPayload(await response.json());
    } catch {
      applyPayload({ items: [], unreadCount: 0, source: "fallback", message: fallbackMessage });
    }
  }, [applyPayload]);

  useEffect(() => {
    load();
    const timer = window.setInterval(() => {
      if (!fallbackActive.current) load();
    }, 5 * 60_000);
    return () => window.clearInterval(timer);
  }, [load]);

  async function markAllRead() {
    try {
      const response = await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ markAllRead: true }) });
      if (!response.ok) {
        applyPayload({ items: [], unreadCount: 0, source: "fallback", message: fallbackMessage });
        return;
      }
      applyPayload(await response.json());
    } catch {
      applyPayload({ items: [], unreadCount: 0, source: "fallback", message: fallbackMessage });
    }
  }

  return <div className="relative">
    <button type="button" aria-label="Open notifications" onClick={() => setOpen((value) => !value)} className="relative rounded-lg border border-white/10 bg-white/[0.04] p-2 text-slate-300 hover:text-white">
      <Bell className="h-4 w-4" />
      {unreadCount ? <span className="absolute -right-2 -top-2 min-w-5 rounded-full bg-rose-500 px-1 text-center text-[10px] font-semibold leading-5 text-white">{Math.min(unreadCount, 99)}</span> : null}
    </button>
    {open ? <div className="absolute right-0 top-11 z-50 w-[min(92vw,420px)] rounded-xl border border-white/10 bg-[#111A2E] p-3 shadow-2xl">
      <div className="flex items-center justify-between gap-3"><div><h2 className="font-semibold text-white">Notification Center</h2><p className="mt-1 text-xs text-slate-500">{unreadCount} unread</p></div><div className="flex gap-1"><button type="button" onClick={load} className="rounded-lg p-2 text-slate-400 hover:bg-white/[0.06] hover:text-white" title="Refresh"><RefreshCcw className="h-4 w-4" /></button><button type="button" onClick={markAllRead} className="rounded-lg p-2 text-slate-400 hover:bg-white/[0.06] hover:text-white" title="Mark all read"><CheckCheck className="h-4 w-4" /></button><button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-white/[0.06] hover:text-white" title="Close"><X className="h-4 w-4" /></button></div></div>
      <div className="mt-3 max-h-[62vh] space-y-2 overflow-y-auto">
        {message ? <div className="rounded-lg border border-amber-300/15 bg-amber-300/[0.06] px-3 py-2 text-xs leading-5 text-amber-100">{message}</div> : null}
        {items.map((item) => <Link key={item.id} href={item.actionUrl ?? "#"} onClick={() => setOpen(false)} className="block rounded-lg border border-white/10 bg-white/[0.03] p-3 hover:bg-white/[0.06]"><div className="flex items-center justify-between gap-2"><span className={`text-xs font-semibold ${item.severity === "ERROR" ? "text-rose-300" : item.severity === "WARNING" ? "text-amber-300" : "text-sky-300"}`}>{item.title}</span><span className="text-[10px] text-slate-600">{item.status}</span></div><p className="mt-1 text-xs leading-5 text-slate-300">{item.message}</p><div className="mt-2 text-[10px] text-slate-600">{item.source} - {new Date(item.createdAt).toLocaleString("id-ID")}</div></Link>)}
        {!items.length ? <div className="rounded-lg border border-dashed border-white/10 p-4 text-center text-xs text-slate-500">Belum ada notifikasi workflow.</div> : null}
      </div>
    </div> : null}
  </div>;
}
