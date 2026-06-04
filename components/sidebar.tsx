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
  PanelLeftClose,
  PanelLeftOpen,
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

export function Sidebar({ open, pathname, collapsed, onClose, onToggleCollapsed }: { open: boolean; pathname: string; collapsed: boolean; onClose: () => void; onToggleCollapsed: () => void }) {
  const { branding } = useBranding();
  return (
    <aside className={clsx("fixed inset-y-0 left-0 z-50 flex w-[270px] max-w-[86vw] flex-col border-r border-white/[0.07] bg-[#090E1C]/95 shadow-2xl backdrop-blur-xl transition-[width,transform] duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0", collapsed ? "lg:w-[84px]" : "lg:w-[270px]", open ? "translate-x-0" : "-translate-x-full")}>
      <div className="border-b border-white/[0.07] px-4 py-5">
        <div className="flex items-start justify-between gap-3">
          <Link href="/dashboard" onClick={onClose} className="flex min-w-0 items-center gap-3">
            <BrandLogo />
            <div className={clsx("min-w-0 transition lg:block", collapsed && "lg:hidden")}>
              <div className="truncate text-sm font-bold tracking-wide text-white">{branding.productName}</div>
              <div className="mt-1 truncate text-[10px] uppercase tracking-[0.16em] text-slate-500">{branding.companyName}</div>
            </div>
          </Link>
          <button type="button" aria-label="Close navigation" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-white lg:hidden"><X className="h-5 w-5" /></button>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <div className={clsx("mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600", collapsed && "lg:hidden")}>Studio Menu</div>
        <div className="space-y-1">
          {navigation.map((item) => <NavigationLink key={item.label} item={item} pathname={pathname} collapsed={collapsed} onNavigate={onClose} />)}
        </div>
      </nav>
      <Link href="/settings" onClick={onClose} className={clsx("m-3 rounded-xl border border-dashed border-cyan-300/20 bg-cyan-300/[0.04] p-3 transition hover:bg-cyan-300/[0.07]", collapsed && "lg:hidden")}>
        <div className="flex items-center gap-2 text-xs font-semibold text-cyan-100"><Upload className="h-3.5 w-3.5" /> Logo area ready</div>
        <p className="mt-1.5 text-[11px] leading-5 text-slate-500">Insert or upload your company logo from Settings.</p>
      </Link>
      <div className="border-t border-white/[0.07] p-3">
        <div className={clsx("flex items-center gap-3 rounded-xl bg-white/[0.025] p-2.5", collapsed && "lg:justify-center")}>
          <BrandLogo size="sm" />
          <div className={clsx("min-w-0", collapsed && "lg:hidden")}><div className="text-xs font-semibold text-slate-300">FVN Studio</div><div className="mt-1 truncate text-[10px] text-slate-600">Fatih Vistara Niaga</div></div>
        </div>
        <button type="button" onClick={onToggleCollapsed} className="mt-2 hidden w-full items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-white/[0.05] hover:text-slate-200 lg:flex" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <><PanelLeftClose className="h-4 w-4" /><span>Collapse menu</span></>}
        </button>
      </div>
    </aside>
  );
}

function NavigationLink({ item, pathname, collapsed, onNavigate }: { item: NavItem; pathname: string; collapsed: boolean; onNavigate: () => void }) {
  const matches = item.match ?? [item.href];
  const active = item.href === "/" ? pathname === "/" : matches.some((href) => pathname === href || pathname.startsWith(`${href}/`));
  return (
    <Link title={collapsed ? item.label : undefined} href={item.href} onClick={onNavigate} className={clsx("group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition", collapsed && "lg:justify-center", active ? "border border-blue-400/30 bg-gradient-to-r from-blue-500/25 to-cyan-400/[0.09] text-white shadow-[0_8px_22px_rgba(37,99,235,0.13),inset_3px_0_0_rgba(34,211,238,0.75)]" : "border border-transparent text-slate-400 hover:bg-white/[0.04] hover:text-slate-100")}>
      <item.icon className={clsx("h-4 w-4 shrink-0 transition", active ? "text-cyan-300" : "text-slate-500 group-hover:text-cyan-200")} />
      <span className={clsx(collapsed && "lg:hidden")}>{item.label}</span>
    </Link>
  );
}
