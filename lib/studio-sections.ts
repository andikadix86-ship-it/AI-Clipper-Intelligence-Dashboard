import {
  BarChart3,
  BookOpen,
  Bot,
  BrainCircuit,
  CalendarClock,
  ChartNoAxesCombined,
  Clapperboard,
  FileCheck2,
  FileText,
  FolderKanban,
  Image,
  KeyRound,
  Library,
  Lightbulb,
  Link2,
  PackageSearch,
  Palette,
  PlugZap,
  ScrollText,
  Send,
  Settings,
  Share2,
  Sparkles,
  Store,
  Upload,
  Video
} from "lucide-react";
import type { StudioSection } from "@/components/studio-section-page";

export const studioSections = {
  intelligence: {
    eyebrow: "Intelligence Center",
    title: "Intelligence Center",
    subtitle: "Temukan signal, tren, dan peluang konten dengan lebih terarah.",
    description: "Landing page untuk seluruh workflow riset. Gunakan modul yang sudah tersedia atau isi placeholder berikutnya saat sumber intelligence baru siap dihubungkan.",
    primaryAction: { label: "Explore Trending Signals", href: "/trending-center" },
    modules: [
      { title: "Trending Center", description: "Eksplorasi signal dan topik yang sedang bergerak.", href: "/trending-center", icon: ChartNoAxesCombined, status: "Available" },
      { title: "AI Analysis", description: "Analisis konten dan rekomendasi berbasis data.", href: "/ai-analysis", icon: BrainCircuit, status: "Available" },
      { title: "Idea Radar", description: "Kumpulan peluang konten prioritas dari berbagai channel.", icon: Lightbulb }
    ]
  },
  creator: {
    eyebrow: "AI Content Creator",
    title: "AI Content Creator",
    subtitle: "Bangun konten dari ide sampai asset kreatif siap review.",
    description: "Area produksi utama untuk script, visual, caption, dan variasi konten. Backend generator lama tetap dapat dibuka dari module card.",
    primaryAction: { label: "Create New Content", href: "/creative-studio" },
    modules: [
      { title: "Creative Studio", description: "Generate konsep, prompt, dan visual asset.", href: "/creative-studio", icon: Palette, status: "Available" },
      { title: "Content Factory", description: "Produksi variasi konten dari campaign affiliate.", href: "/content-factory", icon: Sparkles, status: "Available" },
      { title: "Script Workspace", description: "Editor modular untuk script dan scene direction.", icon: FileText }
    ]
  },
  clipper: {
    eyebrow: "Clipper Center",
    title: "Clipper Center",
    subtitle: "Ubah video panjang menjadi short-form content yang siap diproses.",
    description: "Gunakan engine clipper yang sudah tersedia dan siapkan batch workflow untuk pengembangan berikutnya.",
    primaryAction: { label: "Open Clipper Workflow", href: "/clipper" },
    modules: [
      { title: "Clipper Workflow", description: "Pilih sumber, atur layout, dan generate potongan video.", href: "/clipper", icon: Clapperboard, status: "Available" },
      { title: "Batch Processing", description: "Antrean pemrosesan video dalam jumlah besar.", icon: Video },
      { title: "Clip Templates", description: "Preset layout dan style untuk short-form content.", icon: Image }
    ]
  },
  affiliate: {
    eyebrow: "Affiliate Center",
    title: "Affiliate Center",
    subtitle: "Kelola product discovery, campaign, dan produksi konten affiliate.",
    description: "Pusat kerja affiliate yang menghubungkan insight produk dengan campaign dan asset produksi.",
    primaryAction: { label: "Open Campaign Center", href: "/campaigns" },
    modules: [
      { title: "Campaign Center", description: "Kelola draft campaign dan arah produksi konten.", href: "/campaigns", icon: Store, status: "Available" },
      { title: "Winning Products", description: "Lihat daftar peluang produk dengan momentum terbaik.", href: "/winning-products", icon: PackageSearch, status: "Available" },
      { title: "Commission Monitor", description: "Placeholder untuk koneksi performa affiliate.", icon: BarChart3 }
    ]
  },
  publishing: {
    eyebrow: "Publishing Center",
    title: "Publishing Center",
    subtitle: "Review, jadwalkan, dan distribusikan konten dari satu workspace.",
    description: "Semua workflow distribusi tetap menggunakan route lama yang sudah aktif, kini dirangkum dalam satu landing page.",
    primaryAction: { label: "Open Publishing Queue", href: "/publishing" },
    modules: [
      { title: "Publishing Queue", description: "Pantau dan jalankan distribusi konten.", href: "/publishing", icon: Send, status: "Available" },
      { title: "Content Scheduler", description: "Atur jadwal posting untuk setiap channel.", href: "/schedule", icon: CalendarClock, status: "Available" },
      { title: "Approval Queue", description: "Review dan putuskan kelayakan asset sebelum publish.", href: "/approval", icon: FileCheck2, status: "Available" }
    ]
  },
  analytics: {
    eyebrow: "Analytics",
    title: "Analytics",
    subtitle: "Pantau performa konten dan workflow untuk keputusan berikutnya.",
    description: "Overview analytics studio dengan akses ke dashboard performa lama serta ruang untuk report tambahan.",
    primaryAction: { label: "Open Analytics Dashboard", href: "/analytics/dashboard" },
    modules: [
      { title: "Performance Dashboard", description: "Lihat metrik konten, creator, dan affiliate.", href: "/analytics/dashboard", icon: ChartNoAxesCombined, status: "Available" },
      { title: "Content Insights", description: "Placeholder untuk breakdown performa per asset.", icon: BarChart3 },
      { title: "Executive Report", description: "Placeholder untuk report berkala dan export.", icon: ScrollText }
    ]
  },
  library: {
    eyebrow: "Content Library",
    title: "Content Library",
    subtitle: "Kelola asset, project, dan versi konten dalam satu tempat.",
    description: "Landing page asset management untuk membuka library lama dan pusat project tanpa mengubah workflow yang sudah ada.",
    primaryAction: { label: "Browse Content Library", href: "/library" },
    modules: [
      { title: "Asset Library", description: "Cari, filter, dan kelola asset konten.", href: "/library", icon: Library, status: "Available" },
      { title: "Active Projects", description: "Pantau project dan sumber video yang sedang dikerjakan.", href: "/projects", icon: FolderKanban, status: "Available" },
      { title: "Collections", description: "Placeholder untuk curated asset collections.", icon: BookOpen }
    ]
  },
  agents: {
    eyebrow: "AI Agents",
    title: "AI Agents",
    subtitle: "Kelola tim AI yang mendukung operasional studio.",
    description: "Pantau agent aktif, status workflow, dan siapkan konfigurasi baru sesuai kebutuhan produk.",
    primaryAction: { label: "Manage AI Agents", href: "/agents" },
    modules: [
      { title: "AI Team Center", description: "Pantau agent, task, dan rekomendasi operasional.", href: "/agents", icon: Bot, status: "Available" },
      { title: "Workflow Builder", description: "Placeholder untuk merangkai kolaborasi antar-agent.", icon: Sparkles },
      { title: "Agent Logs", description: "Placeholder untuk audit dan observability agent.", icon: ScrollText }
    ]
  },
  knowledge: {
    eyebrow: "Knowledge Base",
    title: "Knowledge Base",
    subtitle: "Simpan panduan, prompt, dan referensi kerja studio.",
    description: "Bangun sumber pengetahuan yang dapat digunakan ulang oleh tim dan AI agents.",
    primaryAction: { label: "Open Prompt Center", href: "/prompt-center" },
    modules: [
      { title: "Prompt Center", description: "Kelola playbook, prompt, dan template produksi.", href: "/prompt-center", icon: FileText, status: "Available" },
      { title: "Brand Guidelines", description: "Placeholder untuk tone, visual, dan kebijakan brand.", icon: BookOpen },
      { title: "Reference Library", description: "Placeholder untuk sumber internal terkurasi.", icon: Link2 }
    ]
  },
  integrations: {
    eyebrow: "Integrations",
    title: "Integrations",
    subtitle: "Hubungkan channel, provider, dan tool yang digunakan studio.",
    description: "Kelola koneksi eksternal secara bertahap tanpa menambah kompleksitas backend pada fase UI ini.",
    primaryAction: { label: "Manage Social Accounts", href: "/social-accounts" },
    modules: [
      { title: "Social Accounts", description: "Kelola koneksi akun untuk distribusi konten.", href: "/social-accounts", icon: Share2, status: "Available" },
      { title: "AI Providers", description: "Akses konfigurasi provider yang sudah tersedia.", href: "/settings/providers", icon: PlugZap, status: "Available" },
      { title: "API Access", description: "Placeholder untuk key dan webhook management.", icon: KeyRound }
    ]
  },
  settings: {
    eyebrow: "Settings",
    title: "Settings",
    subtitle: "Atur identitas studio, provider, dan preferensi workspace.",
    description: "Gunakan halaman pengaturan lama untuk konfigurasi aktif. Area tambahan disiapkan untuk branding dan pengaturan tim.",
    primaryAction: { label: "Open Provider Settings", href: "/settings/providers" },
    modules: [
      { title: "Provider Settings", description: "Kelola provider, OAuth, dan konfigurasi Telegram.", href: "/settings/providers", icon: Settings, status: "Available" },
      { title: "Branding & Logo", description: "Placeholder untuk upload logo dan identitas studio.", icon: Upload },
      { title: "Team Preferences", description: "Placeholder untuk role dan preferensi workspace.", icon: Sparkles }
    ]
  }
} satisfies Record<string, StudioSection>;
