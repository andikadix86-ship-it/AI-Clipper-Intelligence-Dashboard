import { ArrowUpRight, Clapperboard, FileText, Library, Send, Sparkles, Store } from "lucide-react";
import Link from "next/link";
import { DashboardPanel } from "@/components/dashboard/ui";

const shortcuts = [
  { label: "Create Content", href: "/creative-studio", icon: Sparkles },
  { label: "Generate Clips", href: "/clipper", icon: Clapperboard },
  { label: "Affiliate Campaign", href: "/campaigns", icon: Store },
  { label: "Review Library", href: "/library", icon: Library },
  { label: "Publishing Queue", href: "/publishing", icon: Send },
  { label: "Knowledge Base", href: "/prompt-center", icon: FileText }
];

export function QuickAccess() {
  return (
    <DashboardPanel title="Quick Access" description="Shortcut untuk pekerjaan yang paling sering digunakan.">
      <div className="grid gap-2.5 sm:grid-cols-2">
        {shortcuts.map((shortcut) => <Link key={shortcut.label} href={shortcut.href} className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3 text-sm font-semibold text-slate-300 transition hover:border-cyan-300/20 hover:bg-cyan-300/[0.04] hover:text-white"><shortcut.icon className="h-4 w-4 text-cyan-300" /><span className="flex-1">{shortcut.label}</span><ArrowUpRight className="h-3.5 w-3.5 text-slate-700 transition group-hover:text-cyan-200" /></Link>)}
      </div>
    </DashboardPanel>
  );
}
