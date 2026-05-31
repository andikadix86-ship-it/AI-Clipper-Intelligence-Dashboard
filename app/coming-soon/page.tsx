import { ArrowRight, Clock3, LayoutDashboard } from "lucide-react";
import Link from "next/link";

type PageProps = {
  searchParams: {
    feature?: string;
    description?: string;
    next?: string;
  };
};

export default function ComingSoonPage({ searchParams }: PageProps) {
  const feature = searchParams.feature || "Feature";
  const description = searchParams.description || "Fitur ini masih disiapkan agar workflow tetap sederhana dan stabil.";
  const nextHref = searchParams.next?.startsWith("/") ? searchParams.next : "/";

  return (
    <div className="space-y-6">
      <header>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-300/10 px-3 py-1 text-sm text-blue-100">
          <Clock3 className="h-4 w-4" />
          Coming Soon
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">{feature}</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">{description}</p>
      </header>

      <section className="glass max-w-3xl rounded-xl p-6 md:p-8">
        <h2 className="text-xl font-semibold text-white">Workflow yang bisa digunakan sekarang</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          Fitur ini belum dibuka sebagai modul terpisah. Lanjutkan pekerjaan melalui workflow aktif berikut agar proses tetap berjalan tanpa halaman kosong.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={nextHref} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500">
            Buka workflow aktif
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08]">
            <LayoutDashboard className="h-4 w-4" />
            Kembali ke Dashboard
          </Link>
        </div>
      </section>
    </div>
  );
}
