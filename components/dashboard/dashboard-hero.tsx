import { ArrowRight, PlayCircle, Plus, Sparkles } from "lucide-react";
import Link from "next/link";

export function DashboardHero() {
  return (
    <section
      className="relative flex min-h-[240px] overflow-hidden rounded-2xl border border-blue-300/10 bg-[#0E1730] bg-cover bg-right p-6 shadow-[0_18px_60px_rgba(0,0,0,0.22)] md:min-h-[260px] md:p-8 lg:p-9"
      style={{ backgroundImage: "linear-gradient(90deg, rgba(5,10,25,0.96) 0%, rgba(5,10,25,0.82) 38%, rgba(5,10,25,0.25) 70%), url('/images/dashboard-hero.jpg')" }}
    >
      <div className="relative max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.07] px-3 py-1.5 text-xs font-semibold text-cyan-100">
          <Sparkles className="h-3.5 w-3.5" /> AI-Powered Content Intelligence
        </div>
        <h1 className="mt-4 max-w-3xl text-3xl font-bold leading-tight tracking-tight text-white md:text-4xl">Buat Konten Cerdas, Menarik, dan Menghasilkan.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">Gunakan AI dan data intelligence untuk menciptakan konten berkualitas, aman, original, dan siap menghasilkan.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/ai-content-creator" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(59,130,246,0.24)] transition hover:brightness-110"><Plus className="h-4 w-4" /> Buat Konten Baru <ArrowRight className="h-4 w-4" /></Link>
          <Link href="/clipper-center" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#071023]/70 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/[0.08]"><PlayCircle className="h-4 w-4 text-cyan-300" /> Lihat Workflow</Link>
        </div>
      </div>
    </section>
  );
}
