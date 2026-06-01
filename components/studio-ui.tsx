import { ArrowRight, Clock3, Plus, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

export function PageHeader({ eyebrow, title, subtitle, description, action }: { eyebrow: string; title: string; subtitle: string; description: string; action?: { label: string; href: string } }) {
  return (
    <header className="relative overflow-hidden rounded-2xl border border-blue-300/10 bg-[#0E1730] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.16)] md:p-8">
      <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-blue-500/15 blur-3xl" />
      <div className="absolute right-24 top-16 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />
      <div className="relative">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-100"><Sparkles className="h-3.5 w-3.5" />{eyebrow}</div>
        <h1 className="mt-5 text-3xl font-bold tracking-tight text-white md:text-4xl">{title}</h1>
        <p className="mt-3 text-base font-medium text-slate-300">{subtitle}</p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">{description}</p>
        {action ? <Link href={action.href} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(59,130,246,0.2)] transition hover:brightness-110"><Plus className="h-4 w-4" />{action.label}<ArrowRight className="h-4 w-4" /></Link> : null}
      </div>
    </header>
  );
}

export function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <article className="premium-panel rounded-2xl p-4"><div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">{label}</div><div className="mt-3 text-2xl font-bold text-white">{value}</div><p className="mt-1.5 text-xs text-slate-500">{detail}</p></article>;
}

export function FeatureCard({ title, description, href, icon: Icon, status = "Ready for setup" }: { title: string; description: string; href?: string; icon: LucideIcon; status?: string }) {
  const content = <><div className="flex items-start justify-between gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-300/10 bg-cyan-300/[0.06] text-cyan-200"><Icon className="h-4 w-4" /></div><span className="rounded-full border border-white/[0.07] bg-white/[0.035] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">{status}</span></div><h2 className="mt-5 font-semibold text-white">{title}</h2><p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">{description}</p>{href ? <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-200">Open module <ArrowRight className="h-3.5 w-3.5" /></div> : <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600"><Clock3 className="h-3.5 w-3.5" />Placeholder module</div>}</>;
  const className = "premium-panel block rounded-2xl p-5 transition hover:border-cyan-300/20 hover:bg-cyan-300/[0.025]";
  return href ? <Link href={href} className={className}>{content}</Link> : <article className={className}>{content}</article>;
}

export function EmptyState({ title }: { title: string }) {
  return (
    <section className="rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.018] px-6 py-10 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-violet-300/15 bg-violet-300/[0.07] text-violet-200"><Sparkles className="h-5 w-5" /></div>
      <h2 className="mt-4 text-base font-semibold text-white">Workspace {title} siap dikembangkan</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">Belum ada data tambahan untuk ditampilkan. Area ini sudah disiapkan untuk workflow dan integrasi backend pada fase berikutnya.</p>
    </section>
  );
}
