import { ArrowUpRight, BrainCircuit, Clapperboard, Sparkles, Store } from "lucide-react";
import Link from "next/link";

const features = [
  { title: "AI Content Creator", description: "Ubah insight menjadi script dan asset kreatif dengan workflow AI.", href: "/creative-studio", icon: Sparkles, colors: "from-blue-500/25 to-violet-500/10", iconColor: "text-blue-200" },
  { title: "Clipper Center", description: "Potong video panjang menjadi short-form content yang siap review.", href: "/clipper", icon: Clapperboard, colors: "from-cyan-500/20 to-blue-500/10", iconColor: "text-cyan-200" },
  { title: "Affiliate Center", description: "Kelola peluang produk, campaign, dan konten affiliate dalam satu tempat.", href: "/campaigns", icon: Store, colors: "from-violet-500/20 to-fuchsia-500/10", iconColor: "text-violet-200" },
  { title: "Intelligence Center", description: "Temukan signal, tren, dan rekomendasi konten yang relevan.", href: "/trending-center", icon: BrainCircuit, colors: "from-teal-500/20 to-cyan-500/10", iconColor: "text-teal-200" }
];

export function FeatureCards() {
  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div><h2 className="text-lg font-semibold text-white">Studio Centers</h2><p className="mt-1 text-sm text-slate-500">Pilih workspace sesuai pekerjaan yang ingin diselesaikan.</p></div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {features.map((feature) => (
          <Link key={feature.title} href={feature.href} className={`group h-full rounded-2xl border border-white/[0.07] bg-gradient-to-br ${feature.colors} p-5 shadow-[0_10px_30px_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5 hover:border-cyan-300/25`}>
            <div className="flex items-start justify-between gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.06]"><feature.icon className={`h-5 w-5 ${feature.iconColor}`} /></div>
              <ArrowUpRight className="h-4 w-4 text-slate-600 transition group-hover:text-cyan-200" />
            </div>
            <h3 className="mt-5 font-semibold text-white">{feature.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">{feature.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
