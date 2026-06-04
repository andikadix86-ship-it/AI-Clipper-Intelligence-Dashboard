import { ArrowRight, CheckCircle2, PlayCircle, Plus, Sparkles, TrendingUp, WandSparkles } from "lucide-react";
import Link from "next/link";

const quickStats = [
  { label: "AI workflows", value: "12", icon: WandSparkles },
  { label: "Ready to publish", value: "24", icon: CheckCircle2 },
  { label: "Growth signal", value: "+18%", icon: TrendingUp }
];

export function DashboardHero() {
  return (
    <section
      className="hero-shadow relative flex min-h-[300px] overflow-hidden rounded-2xl border border-blue-300/15 bg-[#0E1730] bg-cover bg-right p-6 md:min-h-[330px] md:p-8 lg:p-9"
      style={{ backgroundImage: "linear-gradient(90deg, rgba(5,10,25,0.98) 0%, rgba(5,10,25,0.91) 42%, rgba(5,10,25,0.42) 72%, rgba(5,10,25,0.18) 100%), url('/images/dashboard-hero.jpg')" }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(34,211,238,0.14),transparent_24rem)]" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#050a19]/80 to-transparent" />
      <div className="relative flex max-w-3xl flex-col justify-between">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.07] px-3 py-1.5 text-xs font-semibold text-cyan-100">
          <Sparkles className="h-3.5 w-3.5" /> AI-Powered Content Intelligence
        </div>
        <h1 className="mt-4 max-w-3xl text-3xl font-bold leading-tight tracking-tight text-white md:text-4xl">Buat Konten Cerdas, Menarik, dan Menghasilkan.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">Gunakan AI dan data intelligence untuk menciptakan konten berkualitas, aman, original, dan siap menghasilkan.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/ai-content-creator" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 via-blue-500 to-violet-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_34px_rgba(59,130,246,0.34)] transition hover:-translate-y-0.5 hover:brightness-110"><Plus className="h-4 w-4" /> Buat Konten Baru <ArrowRight className="h-4 w-4" /></Link>
          <Link href="/clipper-center" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#071023]/70 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/[0.08]"><PlayCircle className="h-4 w-4 text-cyan-300" /> Lihat Workflow</Link>
        </div>
        <div className="mt-7 grid max-w-2xl grid-cols-3 gap-2 sm:gap-3">
          {quickStats.map((stat) => <div key={stat.label} className="rounded-xl border border-white/[0.1] bg-[#071023]/65 px-3 py-2.5 backdrop-blur-md sm:px-4"><div className="flex items-center gap-2"><stat.icon className="h-3.5 w-3.5 text-cyan-300" /><span className="text-base font-bold text-white sm:text-lg">{stat.value}</span></div><p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">{stat.label}</p></div>)}
        </div>
      </div>
    </section>
  );
}
