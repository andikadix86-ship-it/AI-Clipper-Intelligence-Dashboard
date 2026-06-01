import { ArrowRight, Clapperboard, Sparkles } from "lucide-react";
import Link from "next/link";

export function ClipperHeader() {
  return (
    <header className="relative overflow-hidden rounded-2xl border border-blue-300/10 bg-[#0E1730] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.18)] md:p-8">
      <div className="absolute -right-14 -top-20 h-64 w-64 rounded-full bg-blue-500/18 blur-3xl" />
      <div className="absolute right-28 top-10 h-52 w-52 rounded-full bg-violet-500/15 blur-3xl" />
      <div className="relative">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-100"><Sparkles className="h-3.5 w-3.5" /> AI Short-Form Engine</div>
        <h1 className="mt-5 text-3xl font-bold tracking-tight text-white md:text-4xl">Clipper Center</h1>
        <p className="mt-3 max-w-4xl text-base leading-7 text-slate-300">Transform long videos into viral short clips with AI hook detection, captions, metadata, and platform-specific optimization.</p>
        <Link href="/clipper" className="mt-6 inline-flex items-center gap-2 rounded-xl border border-cyan-300/15 bg-cyan-300/[0.06] px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/[0.1]"><Clapperboard className="h-4 w-4" /> Open Advanced Workflow <ArrowRight className="h-4 w-4" /></Link>
      </div>
    </header>
  );
}
