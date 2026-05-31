"use client";

import clsx from "clsx";
import {
  BarChart3,
  Bot,
  Brain,
  CalendarDays,
  ClipboardCheck,
  ChevronDown,
  ChevronRight,
  FileText,
  Flame,
  FolderKanban,
  Home,
  Library,
  LineChart,
  ListChecks,
  Menu,
  PackageSearch,
  Palette,
  ScrollText,
  Send,
  Settings,
  Share2,
  Wand2,
  X
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ModeSwitch, useWorkspaceMode, WorkspaceModeProvider } from "@/components/workspace-mode";
import { NotificationCenter } from "@/components/notification-center";

type NavigationItem = { href: string; label: string; icon: LucideIcon; badge?: "Workflow" | "Soon"; activeMatch?: boolean; available?: boolean; description?: string; fallbackHref?: string };
type NavigationGroup = { label: string; items: NavigationItem[] };

const creatorGroups: NavigationGroup[] = [
  { label: "Intelligence", items: [
    { href: "/trending-center", label: "Trending Center", icon: Flame },
    { href: "/ai-analysis", label: "AI Analysis", icon: Brain }
  ] },
  { label: "Production", items: [
    { href: "/projects", label: "Projects", icon: FolderKanban },
    { href: "/library", label: "Content Pipeline", icon: ListChecks, badge: "Workflow", activeMatch: false },
    { href: "/clipper", label: "Clipper Workflow", icon: Wand2 },
    { href: "/creative-studio", label: "Creative Studio", icon: Palette },
    { href: "/library", label: "Content Library", icon: Library }
  ] },
  { label: "Publishing", items: [
    { href: "/schedule", label: "Scheduler", icon: CalendarDays },
    { href: "/publishing", label: "Publishing Center", icon: Send },
    { href: "/social-accounts", label: "Social Accounts", icon: Share2 },
    { href: "/approval", label: "Approval Queue", icon: ClipboardCheck, badge: "Workflow" }
  ] },
  { label: "AI Team", items: [
    { href: "/agents", label: "AI Team", icon: Bot },
    { href: "/prompt-center", label: "Prompt Center", icon: FileText }
  ] },
  { label: "Analytics", items: [
    { href: "/analytics", label: "Analytics", icon: BarChart3 }
  ] },
  { label: "System", items: [
    { href: "/settings", label: "Provider Management", icon: Settings },
    { href: "/settings", label: "Settings", icon: Settings },
    { href: "/coming-soon", label: "Logs", icon: ScrollText, badge: "Soon", available: false, description: "Audit log viewer masih disiapkan. Gunakan Dashboard untuk memantau aktivitas terbaru.", fallbackHref: "/" }
  ] }
];

const affiliateGroups: NavigationGroup[] = [
  { label: "Product Discovery", items: [
    { href: "/trending-center", label: "Product Hunter", icon: Flame },
    { href: "/winning-products", label: "Winning Products", icon: PackageSearch }
  ] },
  { label: "Campaigns", items: [
    { href: "/campaigns", label: "Campaign Center", icon: FolderKanban }
  ] },
  { label: "Content", items: [
    { href: "/content-factory", label: "Content Factory", icon: Palette },
    { href: "/ai-analysis", label: "AI Script", icon: FileText, badge: "Workflow", activeMatch: false },
    { href: "/prompt-center", label: "Prompt Center", icon: Wand2 }
  ] },
  { label: "Publishing", items: [
    { href: "/publishing", label: "Publishing", icon: Send },
    { href: "/schedule", label: "Scheduler", icon: CalendarDays }
  ] },
  { label: "Performance", items: [
    { href: "/coming-soon", label: "Commission Center", icon: BarChart3, badge: "Soon", available: false, description: "Commission tracking belum terhubung ke platform affiliate. Gunakan Affiliate Analytics untuk melihat workflow analitik yang sudah tersedia.", fallbackHref: "/analytics" },
    { href: "/analytics", label: "Affiliate Analytics", icon: LineChart, badge: "Workflow", activeMatch: false }
  ] },
  { label: "AI Team", items: [
    { href: "/agents", label: "Affiliate AI Team", icon: Bot }
  ] },
  { label: "System", items: [
    { href: "/settings", label: "Settings", icon: Settings }
  ] }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return <WorkspaceModeProvider><AppFrame>{children}</AppFrame></WorkspaceModeProvider>;
}

function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { mode } = useWorkspaceMode();
  const [open, setOpen] = useState(false);
  const groups = mode === "creator" ? creatorGroups : affiliateGroups;

  return (
    <div className="min-h-screen lg:flex">
      <button type="button" aria-label="Open navigation" onClick={() => setOpen(true)} className="fixed left-4 top-4 z-40 rounded-lg border border-white/10 bg-[#0A1020] p-3 text-white shadow-lg lg:hidden">
        <Menu className="h-5 w-5" />
      </button>
      <aside className={clsx("fixed inset-y-0 left-0 z-50 flex w-72 max-w-[86vw] flex-col border-r border-white/10 bg-[#0A1020] transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
        <div className="border-b border-white/10 p-5">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-white"><Wand2 className="h-5 w-5" /></div>
              <div><div className="font-semibold text-white">OpenDirector</div><div className="text-xs text-slate-500">Content Intelligence OS</div></div>
            </Link>
            <button type="button" aria-label="Close navigation" onClick={() => setOpen(false)} className="rounded-lg p-2 text-slate-300 lg:hidden"><X className="h-5 w-5" /></button>
          </div>
          <div className="mt-4"><ModeSwitch /></div>
        </div>
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          <NavigationLink item={{ href: "/", label: "Dashboard", icon: Home }} pathname={pathname} onNavigate={() => setOpen(false)} />
          {groups.map((group, groupIndex) => (
            <details key={`${mode}-${group.label}`} className="group" open={groupIndex < 4}>
              <summary className="mb-2 flex cursor-pointer list-none items-center justify-between px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 transition hover:text-slate-300">
                {group.label}
                <ChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" />
              </summary>
              <div className="space-y-1">
                {group.items.map((item, index) => <NavigationLink key={`${group.label}-${item.label}-${index}`} item={item} pathname={pathname} onNavigate={() => setOpen(false)} />)}
              </div>
            </details>
          ))}
        </nav>
      </aside>
      {open ? <div className="fixed inset-0 z-40 bg-black/70 lg:hidden" onClick={() => setOpen(false)} /> : null}
      <main className="min-w-0 flex-1 px-4 pb-12 pt-20 md:px-8 lg:px-12 lg:pt-6">
        <header className="mx-auto mb-8 flex max-w-7xl items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div><div className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-200">{mode === "creator" ? "Creator / Clipper Mode" : "Affiliate Intelligence OS"}</div><div className="mt-1 text-sm text-slate-500">Action-first content operations</div></div>
          <div className="flex items-center gap-3"><NotificationCenter /><div className="origin-right scale-[0.86] sm:scale-100"><ModeSwitch /></div></div>
        </header>
        <div className="mx-auto max-w-7xl">
          <Breadcrumb pathname={pathname} />
          {children}
        </div>
      </main>
    </div>
  );
}

function NavigationLink({ item, pathname, onNavigate }: { item: NavigationItem; pathname: string; onNavigate: () => void }) {
  const active = item.activeMatch !== false && (pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`)));
  const badge = item.badge === "Soon" ? "Coming Soon" : item.badge;
  if (item.available === false) {
    return (
      <Link href={comingSoonHref(item)} onClick={onNavigate} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-500 transition hover:bg-white/[0.04] hover:text-slate-300" title="Coming Soon">
        <item.icon className="h-4 w-4 shrink-0" />
        <span>{item.label}</span>
        <span className="ml-auto rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600">{badge}</span>
      </Link>
    );
  }
  return (
    <Link href={item.href} onClick={onNavigate} className={clsx("flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition", active ? "bg-primary text-white" : "text-slate-400 hover:bg-white/[0.06] hover:text-white")}>
      <item.icon className="h-4 w-4 shrink-0" />
      <span>{item.label}</span>
      {badge ? <span className={clsx("ml-auto rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase", active ? "border-white/30 text-white/80" : "border-white/10 text-slate-600")}>{badge}</span> : null}
    </Link>
  );
}

function comingSoonHref(item: NavigationItem) {
  const params = new URLSearchParams({
    feature: item.label,
    description: item.description ?? "Fitur ini masih disiapkan.",
    next: item.fallbackHref ?? "/"
  });
  return `/coming-soon?${params.toString()}`;
}

const breadcrumbLabels: Record<string, string> = {
  agents: "AI Team",
  approval: "Approval Queue",
  "ai-analysis": "AI Analysis",
  analysis: "Analysis Result",
  analytics: "Analytics",
  clipper: "Clipper Workflow",
  campaigns: "Campaign Center",
  "content-factory": "Content Factory",
  "coming-soon": "Coming Soon",
  "creative-studio": "Creative Studio",
  library: "Content Library",
  projects: "Projects",
  "prompt-center": "Prompt Center",
  publishing: "Publishing Center",
  schedule: "Scheduler",
  settings: "Settings",
  "social-accounts": "Social Accounts",
  "trending-center": "Trending Center",
  "winning-products": "Winning Products"
};

function Breadcrumb({ pathname }: { pathname: string }) {
  if (pathname === "/") return null;
  const segments = pathname.split("/").filter(Boolean);
  return (
    <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-1 text-xs text-slate-500">
      <Link href="/" className="transition hover:text-slate-200">Dashboard</Link>
      {segments.map((segment, index) => (
        <span key={`${segment}-${index}`} className="inline-flex items-center gap-1">
          <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
          <span className={index === segments.length - 1 ? "text-slate-300" : ""}>{breadcrumbLabels[segment] ?? (index === segments.length - 1 ? "Detail" : segment)}</span>
        </span>
      ))}
    </nav>
  );
}
