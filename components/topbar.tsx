"use client";

import { Search, Upload, UserRound } from "lucide-react";
import Link from "next/link";
import { BrandLogo, useBranding } from "@/components/branding-engine";
import { NotificationCenter } from "@/components/notification-center";

export function Topbar() {
  const { branding } = useBranding();
  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#070B17]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-[74px] max-w-[1680px] items-center justify-between gap-4 px-4 pl-20 md:px-7 lg:px-8">
        <div className="hidden min-w-0 items-center gap-3 lg:flex">
          <BrandLogo size="sm" />
          <div>
            <div className="text-sm font-semibold text-white">{branding.productName}</div>
            <div className="mt-1 text-xs text-slate-500">Content Intelligence Workspace</div>
          </div>
        </div>
        <label className="flex max-w-md flex-1 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 py-2.5 text-slate-500 lg:ml-auto">
          <Search className="h-4 w-4 shrink-0" />
          <input aria-label="Search workspace" placeholder="Search workspace..." className="min-w-0 flex-1 bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-600" />
        </label>
        <div className="flex items-center gap-2">
          <Link href="/settings" title="Upload logo from Settings" className="hidden items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.07] sm:flex">
            <Upload className="h-3.5 w-3.5 text-cyan-300" /> Upload Logo
          </Link>
          <NotificationCenter />
          <button type="button" aria-label="Open user menu" className="grid h-10 w-10 place-items-center rounded-xl border border-white/[0.08] bg-gradient-to-br from-blue-500/20 to-violet-500/20 text-cyan-100">
            <UserRound className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
