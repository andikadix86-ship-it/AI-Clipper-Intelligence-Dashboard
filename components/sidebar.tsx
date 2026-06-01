"use client";

import clsx from "clsx";
import {
  BarChart3,
  Blocks,
  Bot,
  BrainCircuit,
  Clapperboard,
  Home,
  Library,
  PlugZap,
  Send,
  Settings,
  Sparkles,
  Store,
  Upload,
  X
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { BrandLogo, useBranding } from "@/components/branding-engine";

type NavItem = { href: string; label: string; icon: LucideIcon; match?: string[] };

const navigation: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: Home, match: ["/dashboard"] },
  { href: "/intelligence", label: "Intelligence Center", icon: BrainCircuit, match: ["/intelligence", "/intelligence-center", "/trending-center", "/ai-analysis", "/analysis"] },
  { href: "/ai-content-creator", label: "AI Content Creator", icon: Sparkles, match: ["/ai-content-creator", "/creative-studio", "/content-factory"] },
  { href: "/clipper-center", label: "Clipper Center", icon: Clapperboard, match: ["/clipper-center", "/clipper"] },
  { href: "/affiliate-center", label: "Affiliate Center", icon: Store, match: ["/affiliate-center", "/campaigns", "/winning-products"] },
  { href: "/publishing-center", label: "Publishing Center", icon: Send, match: ["/publishing-center", "/publishing", "/schedule", "/approval"] },
  { href: "/analytics", label: "Analytics", icon: BarChart3, match: ["/analytics", "/analytics-center"] },
  { href: "/content-library", label: "Content Library", icon: Library, match: ["/content-library", "/library", "/projects"] },
  { href: "/ai-agents", label: "AI Agents", icon: Bot, match: ["/ai-agents", "/agents"] },
  { href: "/knowledge-base", label: "Knowledge Base", icon: Blocks, match: ["/knowledge-base", "/prompt-center"] },
  { href: "/integrations", label: "Integrations", icon: PlugZap, match: ["/integrations", "/social-accounts"] },
  { href: "/settings", label: "Settings", icon: Settings, match: ["/settings", "/studio-settings"] }
];

export function Sidebar({ open, pathname, onClose }: { open: boolean; pathname: string; onClose: () => void }) {
  const { branding } = useBranding();
  return (
    <aside className={clsx("fixed inset-y-0 left-0 z-50 flex w-[270px] max-w-[86vw] flex-col border-r border-white/[0.07] bg-[#090E1C]/95 shadow-2xl backdrop-blur-xl transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
      <div className="border-b border-white/[0.07] px-4 py-5">
        <div className="flex items-start justify-between gap-3">
          <Link href="/dashboard" onClick={onClose} className="flex min-w-0 items-center gap-3">
            <BrandLogo />
            <div className="min-w-0">
              <div className="truncate text-sm font-bold tracking-wide text-white">{branding.productName}</div>
              <div className="mt-1 truncate text-[10px] uppercase tracking-[0.16em] text-slate-500">{branding.companyName}</div>
            </div>
          </Link>
          <button type="button" aria-label="Close navigation" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-white lg:hidden"><X className="h-5 w-5" /></button>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <div className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">Studio Menu</div>
        <div className="space-y-1">
          {navigation.map((item) => <NavigationLink key={item.label} item={item} pathname={pathname} onNavigate={onClose} />)}
        </div>
      </nav>
      <Link href="/settings" onClick={onClose} className="m-3 rounded-xl border border-dashed border-cyan-300/20 bg-cyan-300/[0.04] p-3 transition hover:bg-cyan-300/[0.07]">
        <div className="flex items-center gap-2 text-xs font-semibold text-cyan-100"><Upload className="h-3.5 w-3.5" /> Logo area ready</div>
        <p className="mt-1.5 text-[11px] leading-5 text-slate-500">Insert or upload your company logo from Settings.</p>
      </Link>
    </aside>
  );
}

function NavigationLink({ item, pathname, onNavigate }: { item: NavItem; pathname: string; onNavigate: () => void }) {
  const matches = item.match ?? [item.href];
  const active = item.href === "/" ? pathname === "/" : matches.some((href) => pathname === href || pathname.startsWith(`${href}/`));
  return (
    <Link href={item.href} onClick={onNavigate} className={clsx("group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition", active ? "border border-blue-400/20 bg-gradient-to-r from-blue-500/20 to-cyan-400/[0.07] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]" : "border border-transparent text-slate-400 hover:bg-white/[0.04] hover:text-slate-100")}>
      <item.icon className={clsx("h-4 w-4 shrink-0 transition", active ? "text-cyan-300" : "text-slate-500 group-hover:text-cyan-200")} />
      <span>{item.label}</span>
    </Link>
  );
}
