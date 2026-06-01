import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  CircleGauge,
  Cloud,
  Database,
  Github,
  Image,
  KeyRound,
  MessageCircle,
  Mic2,
  PlugZap,
  Search,
  Server,
  Sparkles,
  Video
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { DashboardPanel } from "@/components/dashboard/ui";
import { PageHeader, StatCard } from "@/components/studio-ui";

type ProviderStatus = "Connected" | "Not Configured" | "Error";
type ProviderMode = "Dummy" | "Real";
type Provider = { name: string; status: ProviderStatus; mode: ProviderMode; checked: string; usage: string; icon: LucideIcon };

const groups: Array<{ title: string; description: string; providers: Provider[] }> = [
  {
    title: "AI Providers", description: "Core intelligence and content generation providers.", providers: [
      { name: "Gemini", status: "Connected", mode: "Real", checked: "12 min ago", usage: "42% monthly quota", icon: Sparkles },
      { name: "OpenAI", status: "Connected", mode: "Real", checked: "18 min ago", usage: "31% monthly quota", icon: Bot },
      { name: "Claude / Optional", status: "Not Configured", mode: "Dummy", checked: "Never", usage: "Not available", icon: Bot },
      { name: "Local Model / Future", status: "Not Configured", mode: "Dummy", checked: "Never", usage: "Future roadmap", icon: Server }
    ]
  },
  {
    title: "Video & Creative", description: "Visual generation and stock asset sources.", providers: [
      { name: "Gemini Veo", status: "Connected", mode: "Dummy", checked: "24 min ago", usage: "18 preview jobs", icon: Video },
      { name: "Sora / Future", status: "Not Configured", mode: "Dummy", checked: "Never", usage: "Future roadmap", icon: Video },
      { name: "Runway / Optional", status: "Not Configured", mode: "Dummy", checked: "Never", usage: "Optional provider", icon: Video },
      { name: "Pexels", status: "Connected", mode: "Dummy", checked: "1 hour ago", usage: "64 demo assets", icon: Image },
      { name: "Pixabay", status: "Not Configured", mode: "Dummy", checked: "Never", usage: "No API key", icon: Image },
      { name: "Unsplash", status: "Not Configured", mode: "Dummy", checked: "Never", usage: "No API key", icon: Image }
    ]
  },
  {
    title: "Voice", description: "Voice generation and manual narration options.", providers: [
      { name: "OpenAI TTS", status: "Connected", mode: "Dummy", checked: "32 min ago", usage: "12 demo renders", icon: Mic2 },
      { name: "ElevenLabs", status: "Not Configured", mode: "Dummy", checked: "Never", usage: "No API key", icon: Mic2 },
      { name: "Gemini TTS", status: "Not Configured", mode: "Dummy", checked: "Never", usage: "Future setup", icon: Mic2 },
      { name: "Manual Voice Upload", status: "Connected", mode: "Real", checked: "Available", usage: "Local upload", icon: Mic2 }
    ]
  },
  {
    title: "Data Intelligence", description: "Trend, platform, and market research sources.", providers: [
      { name: "Google Trends", status: "Connected", mode: "Dummy", checked: "45 min ago", usage: "28 demo queries", icon: Search },
      { name: "YouTube Data API", status: "Not Configured", mode: "Dummy", checked: "Never", usage: "No API key", icon: Search },
      { name: "Reddit", status: "Connected", mode: "Dummy", checked: "2 hours ago", usage: "16 demo signals", icon: Search },
      { name: "Meta Ad Library / Future", status: "Not Configured", mode: "Dummy", checked: "Never", usage: "Future roadmap", icon: Search },
      { name: "TikTok Research / Future", status: "Not Configured", mode: "Dummy", checked: "Never", usage: "Future roadmap", icon: Search }
    ]
  },
  {
    title: "Automation", description: "Operational services for approval, storage, backup, and deployment.", providers: [
      { name: "Telegram Bot", status: "Not Configured", mode: "Dummy", checked: "Never", usage: "Approval fallback active", icon: MessageCircle },
      { name: "Supabase", status: "Error", mode: "Real", checked: "Build check", usage: "DNS unavailable", icon: Database },
      { name: "GitHub Backup", status: "Not Configured", mode: "Dummy", checked: "Never", usage: "Optional backup", icon: Github },
      { name: "Vercel Deployment", status: "Not Configured", mode: "Dummy", checked: "Never", usage: "Optional deployment", icon: Cloud }
    ]
  }
];

function statusTone(status: ProviderStatus) {
  if (status === "Connected") return "border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-200";
  if (status === "Error") return "border-rose-300/20 bg-rose-300/[0.08] text-rose-200";
  return "border-amber-300/20 bg-amber-300/[0.08] text-amber-200";
}

function ProviderCard({ provider }: { provider: Provider }) {
  return (
    <article className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-300/[0.08] text-cyan-200"><provider.icon className="h-4 w-4" /></div>
        <span className={`rounded-full border px-2 py-1 text-[9px] font-semibold uppercase tracking-wide ${statusTone(provider.status)}`}>{provider.status}</span>
      </div>
      <h3 className="mt-4 text-sm font-semibold text-slate-200">{provider.name}</h3>
      {provider.status === "Not Configured" ? <p className="mt-2 text-[11px] font-semibold text-amber-200">Provider belum dikonfigurasi</p> : null}
      <div className="mt-3 space-y-1.5 text-[11px] text-slate-500">
        <div className="flex justify-between gap-2"><span>Mode</span><span className="font-semibold text-slate-300">{provider.mode}</span></div>
        <div className="flex justify-between gap-2"><span>Last checked</span><span className="font-semibold text-slate-300">{provider.checked}</span></div>
        <div className="flex justify-between gap-2"><span>Usage limit</span><span className="text-right font-semibold text-cyan-100">{provider.usage}</span></div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link href="/settings/providers" className="rounded-lg border border-cyan-300/15 bg-cyan-300/[0.06] px-2 py-2 text-center text-[11px] font-semibold text-cyan-100">Configure</Link>
        <button type="button" className="rounded-lg border border-white/[0.08] bg-white/[0.025] px-2 py-2 text-[11px] font-semibold text-slate-300">Test Connection</button>
      </div>
    </article>
  );
}

export function IntegrationsCenterWorkspace() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Provider Connections"
        title="Integrations"
        subtitle="Connect AI providers, creative tools, data intelligence sources, and automation services."
        description="Provider cards menampilkan dummy health overview. Existing provider configuration tetap tersedia tanpa perubahan melalui halaman provider settings lama."
        action={{ label: "Open Provider Settings", href: "/settings/providers" }}
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Provider Surfaces" value="23" detail="Across five integration groups" />
        <StatCard label="Connected" value="08" detail="Dummy and real-ready surfaces" />
        <StatCard label="Needs Setup" value="14" detail="Optional credentials or future work" />
        <StatCard label="Integration Errors" value="01" detail="Fallback-aware database state" />
      </div>

      {groups.map((group) => (
        <DashboardPanel key={group.title} title={group.title} description={group.description}>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {group.providers.map((provider) => <ProviderCard key={provider.name} provider={provider} />)}
          </div>
        </DashboardPanel>
      ))}

      <div className="grid gap-6 2xl:grid-cols-2">
        <DashboardPanel title="API Health Overview" description="Dummy provider health prepared for a future live status layer.">
          <div className="grid gap-3 sm:grid-cols-3">
            {[["Healthy", "08", CheckCircle2, "text-emerald-200"], ["Needs Setup", "14", KeyRound, "text-amber-200"], ["Error", "01", AlertTriangle, "text-rose-200"]].map(([label, value, Icon, tone]) => (
              <div key={String(label)} className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4"><Icon className={`h-4 w-4 ${tone}`} /><div className="mt-3 text-xl font-bold text-white">{String(value)}</div><div className="mt-1 text-xs text-slate-500">{String(label)}</div></div>
            ))}
          </div>
        </DashboardPanel>
        <DashboardPanel title="Provider Usage" description="Dummy normalized usage across core providers.">
          <div className="space-y-4">
            {[["Gemini", 42], ["OpenAI", 31], ["Gemini Veo", 18], ["Google Trends", 28]].map(([label, value]) => (
              <div key={String(label)}><div className="mb-2 flex justify-between text-xs"><span className="font-semibold text-slate-400">{String(label)}</span><span className="font-bold text-cyan-100">{String(value)}%</span></div><div className="h-2 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-300" style={{ width: `${value}%` }} /></div></div>
            ))}
          </div>
        </DashboardPanel>
      </div>

      <div className="grid gap-6 2xl:grid-cols-2">
        <DashboardPanel title="Error Logs" description="Safe dummy diagnostics. Sensitive credentials are never displayed.">
          <div className="rounded-xl border border-rose-300/10 bg-rose-300/[0.04] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-rose-100"><Database className="h-4 w-4" /> Supabase connection unavailable</div>
            <p className="mt-2 text-xs leading-5 text-slate-500">Database DNS is unavailable in the current environment. UI fallback remains active and navigation is not blocked.</p>
          </div>
        </DashboardPanel>
        <DashboardPanel title="Integration Checklist" description="MVP readiness checklist for provider onboarding.">
          <div className="space-y-2.5">
            {["Store credentials only in secure server environment", "Test provider connections before enabling real mode", "Keep manual export available as publishing fallback", "Review usage limits before running batch workflows"].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3 text-xs text-slate-400"><CircleGauge className="h-4 w-4 shrink-0 text-cyan-200" />{item}</div>
            ))}
          </div>
        </DashboardPanel>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-cyan-300/10 bg-cyan-300/[0.04] p-4 text-xs leading-5 text-slate-500">
        <PlugZap className="h-5 w-5 shrink-0 text-cyan-200" /> Configure and test controls remain opt-in. This overview does not call provider APIs automatically.
      </div>
    </div>
  );
}
