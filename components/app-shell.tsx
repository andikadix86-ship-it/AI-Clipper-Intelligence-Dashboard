"use client";

import clsx from "clsx";
import { ChevronRight, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Topbar } from "@/components/topbar";
import { Sidebar } from "@/components/sidebar";
import { BrandLogo, BrandingProvider, useBranding } from "@/components/branding-engine";
import { WorkspaceModeProvider } from "@/components/workspace-mode";

const breadcrumbLabels: Record<string, string> = {
  agents: "AI Agents",
  "affiliate-center": "Affiliate Center",
  "ai-agents": "AI Agents",
  "ai-content-creator": "AI Content Creator",
  approval: "Approval Queue",
  "ai-analysis": "Intelligence Center",
  analysis: "Analysis Result",
  analytics: "Analytics",
  "analytics-center": "Analytics",
  campaigns: "Affiliate Center",
  clipper: "Clipper Center",
  "clipper-center": "Clipper Center",
  "coming-soon": "Coming Soon",
  "content-factory": "AI Content Creator",
  "content-library": "Content Library",
  "creative-studio": "AI Content Creator",
  dashboard: "Dashboard",
  library: "Content Library",
  "integrations": "Integrations",
  intelligence: "Intelligence Center",
  "intelligence-center": "Intelligence Center",
  "knowledge-base": "Knowledge Base",
  projects: "Projects",
  "prompt-center": "Knowledge Base",
  publishing: "Publishing Center",
  "publishing-center": "Publishing Center",
  schedule: "Scheduler",
  settings: "Settings",
  "studio-settings": "Settings",
  "social-accounts": "Integrations",
  "trending-center": "Intelligence Center",
  "winning-products": "Winning Products"
};

export function AppShell({ children }: { children: React.ReactNode }) {
  return <BrandingProvider><WorkspaceModeProvider><AppFrame>{children}</AppFrame></WorkspaceModeProvider></BrandingProvider>;
}

function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#070B17] lg:flex">
      <button type="button" aria-label="Open navigation" onClick={() => setOpen(true)} className="fixed left-4 top-4 z-40 rounded-xl border border-white/10 bg-[#0C1325] p-3 text-white shadow-lg lg:hidden">
        <Menu className="h-5 w-5" />
      </button>
      <Sidebar open={open} pathname={pathname} collapsed={collapsed} onClose={() => setOpen(false)} onToggleCollapsed={() => setCollapsed((current) => !current)} />
      {open ? <div className="fixed inset-0 z-40 bg-black/70 lg:hidden" onClick={() => setOpen(false)} /> : null}
      <main className="min-w-0 flex-1">
        <Topbar />
        <div className={clsx("mx-auto max-w-[1680px] px-4 pb-12 pt-5 md:px-7 lg:px-8")}>
          <Breadcrumb pathname={pathname} />
          {children}
          <StudioFooter />
        </div>
      </main>
    </div>
  );
}

function StudioFooter() {
  const { branding } = useBranding();
  return (
    <footer className="mt-10 flex flex-col gap-3 border-t border-white/[0.06] pt-5 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <BrandLogo size="sm" />
        <div><div className="font-semibold text-slate-400">{branding.productName}</div><div className="mt-1">{branding.footerText}</div></div>
      </div>
      <div>Frontend preview mode - Backend integrations remain opt-in</div>
    </footer>
  );
}

function Breadcrumb({ pathname }: { pathname: string }) {
  if (pathname === "/" || pathname === "/dashboard") return null;
  const segments = pathname.split("/").filter(Boolean);
  return (
    <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-1 text-xs text-slate-500">
      <Link href="/dashboard" className="transition hover:text-slate-200">Dashboard</Link>
      {segments.map((segment, index) => (
        <span key={`${segment}-${index}`} className="inline-flex items-center gap-1">
          <ChevronRight className="h-3.5 w-3.5 text-slate-700" />
          <span className={index === segments.length - 1 ? "text-slate-300" : ""}>{breadcrumbLabels[segment] ?? (index === segments.length - 1 ? "Detail" : segment)}</span>
        </span>
      ))}
    </nav>
  );
}
