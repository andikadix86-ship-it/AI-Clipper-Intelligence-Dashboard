import {
  ChartNoAxesCombined,
  CircleDollarSign,
  Clock3,
  Eye,
  Lightbulb,
  MousePointerClick,
  Target,
  TrendingUp,
  UserPlus,
  UsersRound
} from "lucide-react";
import { BarChartPanel, ModuleGrid } from "@/components/centers/center-ui";
import { DashboardPanel } from "@/components/dashboard/ui";
import { PageHeader, StatCard } from "@/components/studio-ui";
import { AnalyticsEnginePanel } from "@/components/centers/analytics-engine-panel";

const metrics = [
  { title: "Views", detail: "Total content views across active platforms.", metric: "2.84M", icon: Eye },
  { title: "Watch Time", detail: "Accumulated audience watch time.", metric: "18.6K h", icon: Clock3 },
  { title: "Engagement Rate", detail: "Likes, comments, shares, and saves.", metric: "11.7%", icon: UsersRound },
  { title: "Followers Growth", detail: "New audience growth across channels.", metric: "+8.4K", icon: UserPlus },
  { title: "CTR", detail: "Click-through rate from content CTA.", metric: "4.8%", icon: MousePointerClick },
  { title: "Affiliate Clicks", detail: "Tracked clicks from affiliate content.", metric: "28.4K", icon: Target },
  { title: "Conversion Rate", detail: "Dummy purchase conversion rate.", metric: "3.6%", icon: TrendingUp },
  { title: "Estimated Revenue", detail: "Estimated affiliate and content revenue.", metric: "Rp 18.4jt", icon: CircleDollarSign }
];

const bestContent = [
  { title: "3 Produk Viral untuk Workspace Minimalis", platform: "TikTok", views: "684K", engagement: "14.8%", revenue: "Rp 4.8jt" },
  { title: "AI Tools yang Bikin UMKM Lebih Efisien", platform: "YouTube Shorts", views: "512K", engagement: "12.6%", revenue: "Rp 3.1jt" },
  { title: "Setup Konten Affiliate Modal Smartphone", platform: "Instagram Reels", views: "338K", engagement: "10.9%", revenue: "Rp 2.4jt" },
  { title: "Weekly Product Deep Dive", platform: "Facebook Reels", views: "204K", engagement: "8.7%", revenue: "Rp 1.2jt" }
];

const insights = [
  "Short-form hooks under three seconds improve retention for current affiliate content.",
  "TikTok generates the highest affiliate clicks; prioritize product explainers in the next content batch.",
  "Instagram Reels save rate is rising. Repurpose educational scripts with stronger share CTA."
];

function MiniTrendChart({ values }: { values: number[] }) {
  return (
    <div className="flex h-28 items-end gap-2">
      {values.map((value, index) => (
        <div key={`${value}-${index}`} className="group flex h-full flex-1 items-end">
          <div className="w-full rounded-t-md bg-gradient-to-t from-blue-600 to-cyan-300/90 transition-opacity group-hover:opacity-75" style={{ height: `${value}%` }} />
        </div>
      ))}
    </div>
  );
}

export function AnalyticsCenterWorkspace() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Studio Performance"
        title="Analytics"
        subtitle="Monitor content performance, affiliate conversion, and audience growth from a single dashboard."
        description="Dashboard analytics menggunakan clean dummy data dan mini chart CSS agar siap diganti dengan sumber reporting real."
        action={{ label: "Open Detailed Analytics", href: "/analytics/dashboard" }}
      />
      <AnalyticsEnginePanel />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Views" value="2.84M" detail="+18% demo movement" />
        <StatCard label="Watch Time" value="18.6K h" detail="+12.8% last period" />
        <StatCard label="Estimated Revenue" value="Rp 18.4jt" detail="+9.6% dummy monthly total" />
        <StatCard label="Conversion Rate" value="3.6%" detail="+0.8% affiliate conversion" />
      </div>

      <DashboardPanel title="Performance Overview" description="Seven-day dummy performance movement across active channels.">
        <div className="grid gap-5 lg:grid-cols-[1.55fr_1fr]">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Total views trend</p>
                <p className="mt-2 text-2xl font-bold text-white">2.84M</p>
              </div>
              <span className="rounded-full border border-emerald-300/15 bg-emerald-300/[0.06] px-3 py-1.5 text-xs font-semibold text-emerald-200">+18.0%</span>
            </div>
            <MiniTrendChart values={[44, 58, 52, 68, 64, 82, 96]} />
            <div className="mt-3 flex justify-between text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-700">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <span key={day}>{day}</span>)}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              ["Followers Growth", "+8.4K", "+14.2% this period"],
              ["Affiliate Clicks", "28.4K", "+11.6% this period"],
              ["Engagement Rate", "11.7%", "+2.4% this period"]
            ].map(([label, value, detail]) => (
              <div key={label} className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
                <p className="text-xs font-semibold text-slate-500">{label}</p>
                <p className="mt-2 text-xl font-bold text-slate-100">{value}</p>
                <p className="mt-1 text-xs text-emerald-300">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </DashboardPanel>

      <ModuleGrid title="Analytics Metrics" description="Core dummy KPI cards for content, affiliate, and growth monitoring." items={metrics} columns="xl:grid-cols-4" />

      <div className="grid gap-6 2xl:grid-cols-2">
        <BarChartPanel title="Platform Comparison" description="Dummy normalized performance score for each publishing platform." items={[
          { label: "TikTok", value: 94, display: "94%" },
          { label: "YouTube Shorts", value: 88, display: "88%" },
          { label: "Instagram Reels", value: 76, display: "76%" },
          { label: "Facebook Reels", value: 64, display: "64%" }
        ]} />
        <BarChartPanel title="Affiliate Funnel" description="Dummy funnel from content views to conversion." items={[
          { label: "Views", value: 100, display: "2.84M" },
          { label: "Engagement", value: 72, display: "332K" },
          { label: "Affiliate Clicks", value: 38, display: "28.4K" },
          { label: "Conversion", value: 18, display: "1,022" }
        ]} />
      </div>

      <DashboardPanel title="Best Performing Content" description="Top dummy content ranked by views and revenue impact.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-[10px] uppercase tracking-[0.16em] text-slate-600">
              <tr>
                {["Content", "Platform", "Views", "Engagement", "Estimated Revenue"].map((label) => <th key={label} className="pb-3 pr-4 font-semibold">{label}</th>)}
              </tr>
            </thead>
            <tbody>
              {bestContent.map((item) => (
                <tr key={item.title} className="border-t border-white/[0.06]">
                  <td className="py-4 pr-4 font-semibold text-slate-200">{item.title}</td>
                  <td className="py-4 pr-4 text-slate-400">{item.platform}</td>
                  <td className="py-4 pr-4 font-semibold text-cyan-100">{item.views}</td>
                  <td className="py-4 pr-4 text-slate-400">{item.engagement}</td>
                  <td className="py-4 pr-4 text-emerald-200">{item.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardPanel>

      <DashboardPanel title="Recommendation Insight" description="Dummy AI recommendations prepared for future reporting integration.">
        <div className="grid gap-3 lg:grid-cols-3">
          {insights.map((insight, index) => (
            <article key={insight} className="rounded-xl border border-cyan-300/10 bg-cyan-300/[0.04] p-4">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-300/10 text-cyan-200"><Lightbulb className="h-4 w-4" /></div>
              <p className="mt-4 text-xs leading-5 text-slate-400">{insight}</p>
              <div className="mt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-200">Insight 0{index + 1}</div>
            </article>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] p-4 text-xs leading-5 text-slate-500">
          <ChartNoAxesCombined className="h-5 w-5 shrink-0 text-cyan-200" />
          Chart dan rekomendasi masih menggunakan dummy data. Struktur siap dihubungkan ke reporting backend pada tahap berikutnya.
        </div>
      </DashboardPanel>
    </div>
  );
}
