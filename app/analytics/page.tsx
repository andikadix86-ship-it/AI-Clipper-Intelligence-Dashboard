import { BarChart3, MessageCircle, Play, Share2, ThumbsUp, Timer, TrendingDown, TrendingUp } from "lucide-react";
import { getAnalyticsSummary } from "@/lib/analytics-service";
import { getRecommendationInsights } from "@/lib/recommendation-service";
import { CreateSimilarContentButton, GenerateRecommendationButton } from "@/components/recommendation-actions";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { trendScoreExplanation } from "@/lib/intelligence/scoring";
import { getOperationsAnalytics } from "@/lib/operations-analytics-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const fallbackMetrics = [
  { label: "Total views", value: "2.84M", icon: Play },
  { label: "Total likes", value: "186K", icon: ThumbsUp },
  { label: "Total comments", value: "18.4K", icon: MessageCircle },
  { label: "Total shares", value: "42.8K", icon: Share2 },
  { label: "Total saves", value: "31.2K", icon: BarChart3 },
  { label: "Watch time", value: "9,420h", icon: Timer },
  { label: "Engagement rate", value: "11.7%", icon: TrendingUp }
];

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export default async function AnalyticsPage() {
  let summary: Awaited<ReturnType<typeof getAnalyticsSummary>> | null = null;
  let recommendations: Awaited<ReturnType<typeof getRecommendationInsights>> = [];
  let analystRecommendations: Array<{ id: string; title: string; description: string; score: number; priority: string }> = [];
  let lifecycle = { published: 0, scheduled: 0, approvalPending: 0, failed: 0 };
  let operations: Awaited<ReturnType<typeof getOperationsAnalytics>> | null = null;
  try {
    summary = await getAnalyticsSummary();
    recommendations = await getRecommendationInsights();
    analystRecommendations = await prisma.agentRecommendation.findMany({
      where: { agent: { role: "ANALYST" } },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, title: true, description: true, score: true, priority: true }
    });
    const [published, scheduled, approvalPending, failed] = await Promise.all([
      prisma.contentItem.count({ where: { workflowStatus: "POSTED" } }),
      prisma.contentItem.count({ where: { workflowStatus: "SCHEDULED" } }),
      prisma.contentItem.count({ where: { workflowStatus: "REVIEW" } }),
      prisma.contentItem.count({ where: { workflowStatus: "FAILED" } })
    ]);
    lifecycle = { published, scheduled, approvalPending, failed };
    operations = await getOperationsAnalytics();
  } catch {
    summary = null;
    recommendations = await getRecommendationInsights().catch(() => []);
  }

  const hasRealData = Boolean(summary?.rows.length);
  const metrics = hasRealData && summary
    ? [
        { label: "Total views", value: formatNumber(summary.totals.views), icon: Play },
        { label: "Total likes", value: formatNumber(summary.totals.likes), icon: ThumbsUp },
        { label: "Total comments", value: formatNumber(summary.totals.comments), icon: MessageCircle },
        { label: "Total shares", value: formatNumber(summary.totals.shares), icon: Share2 },
        { label: "Total saves", value: formatNumber(summary.totals.saves), icon: BarChart3 },
        { label: "Watch time", value: `${formatNumber(summary.totals.watchTime)}s`, icon: Timer },
        { label: "Engagement rate", value: `${summary.engagementRate}%`, icon: TrendingUp }
      ]
    : fallbackMetrics;

  const topContent = summary?.topContent;
  const topAccount = summary?.topAccount;

  return (
    <div className="space-y-6">
      <header>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1 text-sm text-teal-100">
          <BarChart3 className="h-4 w-4" />
          Analytics
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">Analytics</h1>
        <p className="mt-3 max-w-3xl text-slate-300">Manual performance analytics from posted content. Dummy fallback is used until real performance is recorded.</p>
      </header>
      {!hasRealData ? <div className="rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">Sample performance metrics aktif karena belum ada input performa manual. Overview, Creator Analytics, dan Affiliate Analytics tetap membaca database real.</div> : null}

      <section className="glass rounded-2xl p-5">
        <h2 className="text-2xl font-semibold text-white">Overview</h2>
        <p className="mt-2 text-sm text-slate-400">Operational totals from Prisma/Supabase. No sample numbers are used in this section.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
          {[
            ["Total Projects", operations?.overview.totalProjects ?? 0],
            ["Total Campaigns", operations?.overview.totalCampaigns ?? 0],
            ["Total Assets", operations?.overview.totalAssets ?? 0],
            ["Published Content", operations?.overview.publishedContent ?? 0],
            ["Scheduled Content", operations?.overview.scheduledContent ?? 0],
            ["Approval Pending", operations?.overview.approvalPending ?? 0],
            ["Failed Content", operations?.overview.failedContent ?? 0]
          ].map(([label, value]) => <MiniMetric key={label} label={String(label)} value={value} />)}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="glass rounded-2xl p-5">
          <h2 className="text-2xl font-semibold text-white">Creator Analytics</h2>
          <p className="mt-2 text-sm text-slate-400">Real creator pipeline totals from projects, assets, and Content Library.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <MiniMetric label="Projects" value={operations?.creator.projects ?? 0} />
            <MiniMetric label="Assets Generated" value={operations?.creator.assetsGenerated ?? 0} />
            <MiniMetric label="Videos Generated" value={operations?.creator.videosGenerated ?? 0} />
            <MiniMetric label="Published Videos" value={operations?.creator.publishedVideos ?? 0} />
          </div>
          <div className="mt-5 space-y-3">
            {(operations?.creator.contentByStatus ?? []).map((row) => <SimpleBar key={row.status} label={row.status} value={row.count} max={Math.max(...(operations?.creator.contentByStatus ?? []).map((item) => item.count), 1)} />)}
          </div>
        </div>
        <div className="glass rounded-2xl p-5">
          <h2 className="text-2xl font-semibold text-white">Affiliate Analytics</h2>
          <p className="mt-2 text-sm text-slate-400">Real saved campaign and generated Content Factory totals.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <MiniMetric label="Campaigns" value={operations?.affiliate.campaigns ?? 0} />
            <MiniMetric label="Generated Hooks" value={operations?.affiliate.generatedHooks ?? 0} />
            <MiniMetric label="Generated Scripts" value={operations?.affiliate.generatedScripts ?? 0} />
            <MiniMetric label="Generated Captions" value={operations?.affiliate.generatedCaptions ?? 0} />
            <MiniMetric label="Winning Products Saved" value={operations?.affiliate.winningProductsSaved ?? 0} />
            <MiniMetric label="Content Created" value={operations?.affiliate.contentCreated ?? 0} />
          </div>
          <div className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/10 p-4">
            <div className="text-sm font-semibold text-amber-100">Commission Tracking</div>
            <div className="mt-1 text-xs text-amber-200/80">Status: Coming Soon. Marketplace affiliate API belum terhubung.</div>
          </div>
        </div>
      </section>

      <section className="glass rounded-2xl p-5">
        <h2 className="text-2xl font-semibold text-white">Recent Activities</h2>
        <p className="mt-2 text-sm text-slate-400">Audit timeline dari workflow penting.</p>
        <div className="mt-5 space-y-3">
          {(operations?.recentActivities ?? []).map((activity) => (
            <div key={activity.id} className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-sky-300" />
              <div><div className="text-sm font-semibold text-white">{activity.message}</div><div className="mt-1 text-xs text-slate-500">{activity.action} - {new Date(activity.createdAt).toLocaleString("id-ID")}</div></div>
            </div>
          ))}
          {!operations?.recentActivities.length ? <p className="text-sm text-slate-400">Belum ada activity log. Mulai dari membuat project atau menjalankan agent.</p> : null}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
        {metrics.map((metric) => (
          <div key={metric.label} className="glass rounded-2xl p-4">
            <metric.icon className="mb-4 h-5 w-5 text-teal-300" />
            <div className="text-2xl font-semibold text-white">{metric.value}</div>
            <div className="mt-1 text-xs text-slate-400">{metric.label}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Published Content", lifecycle.published],
          ["Scheduled Content", lifecycle.scheduled],
          ["Approval Pending", lifecycle.approvalPending],
          ["Failed Content", lifecycle.failed]
        ].map(([label, value]) => (
          <div key={label} className="glass rounded-xl p-4">
            <div className="text-2xl font-semibold text-white">{value}</div>
            <div className="mt-1 text-xs text-slate-400">{label}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <PerformanceCard icon={TrendingUp} title="Top Performing Content" value={topContent?.contentItem.title ?? "The 30 Second AI Workflow That Saves 2 Hours"} detail={topContent ? `${formatNumber(topContent.views)} views, ${topContent.engagementRate}% engagement rate` : "168K views, 14.2K likes, 18.6% engagement rate"} />
        <PerformanceCard icon={TrendingDown} title="Needs Attention" value={hasRealData ? "Content without manual performance input" : "Long Tool Overview Without Hook"} detail={hasRealData ? "Use Scheduler > Input Performance to complete reporting." : "8.4K views, 3.1% engagement rate, weak first 3 seconds"} />
      </section>

      <section className="glass rounded-2xl p-5">
        <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">AI Recommendation Engine</h2>
            <p className="mt-2 text-sm text-slate-400">Rule-based insight from manual PostAnalytics. No external AI API is called.</p>
            <p className="mt-1 text-xs text-slate-500">{trendScoreExplanation}</p>
          </div>
          <GenerateRecommendationButton />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recommendations.map((item) => (
            <RecommendationCard key={item.id ?? item.title} item={item} />
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-4">
        <InfoPanel title="Best Posting Time" value={recommendations.find((item) => item.insightType === "POSTING_TIME")?.title ?? "19:00-21:00"} detail={recommendations.find((item) => item.insightType === "POSTING_TIME")?.recommendation ?? "Schedule evening posts and compare after 24 hours."} />
        <InfoPanel title="Content Pattern Insight" value={recommendations.find((item) => item.insightType === "CONTENT_PATTERN")?.title ?? "Proof-first workflow"} detail={recommendations.find((item) => item.insightType === "CONTENT_PATTERN")?.recommendation ?? "Repeat content that earns saves and shares."} />
        <InfoPanel title="Account Growth Insight" value={recommendations.find((item) => item.insightType === "ACCOUNT_GROWTH")?.title ?? "Focus active accounts"} detail={recommendations.find((item) => item.insightType === "ACCOUNT_GROWTH")?.recommendation ?? "Prioritize accounts with follower gain."} />
        <InfoPanel title="Next Content Recommendation" value={recommendations[0]?.title ?? "Create similar content"} detail={recommendations[0]?.recommendation ?? "Generate another clip using the strongest current pattern."} />
      </section>

      <section className="glass rounded-2xl p-5">
        <h2 className="text-2xl font-semibold text-white">Analyst Agent Insight</h2>
        <p className="mt-2 text-sm text-slate-400">Dummy/rule-based analysis from AI Agents. No external AI API is called.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {(analystRecommendations.length ? analystRecommendations : [{ id: "fallback", title: "Run Analyst Agent for fresh insight", description: "Use AI Agents to read manual performance and generate next content recommendations.", score: 82, priority: "MEDIUM" }]).map((item) => (
            <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="mb-3 rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1 text-xs font-semibold text-teal-100 w-fit">{item.priority}</div>
              <h3 className="font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{item.description}</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.08]"><div className="h-full rounded-full bg-teal-300" style={{ width: `${item.score}%` }} /></div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <TableCard title="Performance by Social Account" rows={topAccount ? [[topAccount.name, `${formatNumber(topAccount.views)} views`, `${(topAccount.engagement / topAccount.count).toFixed(2)}% ER`]] : [["Fatih Shorts", "YouTube Shorts", "1.2M views", "13.4% ER"]]} />
        <TableCard title="Performance by Project" rows={hasRealData ? [[topContent?.contentItem.title ?? "Posted content", `${formatNumber(summary?.totals.views ?? 0)} views`, "Manual analytics"]] : [["Creator Growth Engine", "1.9M views", "Best hook retention"]]} />
        <TableCard title="Performance by Platform" rows={hasRealData ? [[topContent?.platform ?? "YOUTUBE_SHORTS", `${formatNumber(topContent?.views ?? 0)} views`, `${topContent?.engagementRate ?? 0}%`]] : [["YouTube Shorts", "1.2M", "12.9%"]]} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="glass rounded-2xl p-5">
          <h2 className="mb-3 text-xl font-semibold text-white">Trending Content Insight</h2>
          <p className="text-sm leading-6 text-slate-300">Manual performance input now powers analytics. Keep post URLs and metrics updated after posting to improve recommendations.</p>
        </div>
        <div className="glass rounded-2xl p-5">
          <h2 className="mb-3 text-xl font-semibold text-white">AI Recommendation Summary</h2>
          <p className="text-sm leading-6 text-slate-300">Prioritize content with high save and share rates, then schedule similar hooks in the same evening posting window.</p>
        </div>
      </section>
    </div>
  );
}

function RecommendationCard({ item }: { item: Awaited<ReturnType<typeof getRecommendationInsights>>[number] }) {
  const priorityClass = item.priority === "High" ? "bg-rose-400/15 text-rose-100 border-rose-300/25" : item.priority === "Medium" ? "bg-amber-400/15 text-amber-100 border-amber-300/25" : "bg-teal-300/15 text-teal-100 border-teal-300/25";
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-slate-200">{item.insightType.replaceAll("_", " ")}</span>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${priorityClass}`}>{item.priority}</span>
      </div>
      <div className="mb-3 flex flex-wrap gap-2 text-[10px] font-semibold uppercase">
        <span className={`rounded-full border px-2 py-1 ${item.isDemo ? "border-amber-300/25 bg-amber-300/10 text-amber-100" : "border-emerald-300/25 bg-emerald-300/10 text-emerald-100"}`}>{item.isDemo ? "Demo" : "Data-backed"}</span>
        <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-1 text-slate-300">{item.source}</span>
        <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-1 text-slate-300">{item.confidence}% confidence</span>
      </div>
      <h3 className="text-lg font-semibold text-white">{item.title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">{item.description}</p>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.08]">
        <div className="h-full rounded-full bg-teal-300" style={{ width: `${item.score}%` }} />
      </div>
      <div className="mt-2 text-xs text-slate-500">Score {item.score}/100</div>
      <p className="mt-3 text-sm leading-6 text-teal-100">{item.recommendation}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{item.notes}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <CreateSimilarContentButton contentItemId={item.contentItemId} recommendationTitle={item.title} />
        <Link
          href={`/ai-analysis?similar=${encodeURIComponent(JSON.stringify({ title: item.title, recommendation: item.recommendation, contentItemId: item.contentItemId }))}`}
          className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-white hover:bg-white/[0.1]"
        >
          Send to AI Analysis
        </Link>
      </div>
    </article>
  );
}

function InfoPanel({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <div className="glass rounded-2xl p-5">
      <h2 className="text-sm font-semibold uppercase text-teal-200">{title}</h2>
      <div className="mt-3 text-lg font-semibold text-white">{value}</div>
      <p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p>
    </div>
  );
}

function PerformanceCard({ icon: Icon, title, value, detail }: { icon: typeof TrendingUp; title: string; value: string; detail: string }) {
  return (
    <div className="glass rounded-2xl p-5">
      <Icon className="mb-4 h-6 w-6 text-teal-300" />
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <div className="mt-3 text-lg font-semibold text-teal-100">{value}</div>
      <p className="mt-2 text-sm text-slate-400">{detail}</p>
    </div>
  );
}

function TableCard({ title, rows }: { title: string; rows: Array<Array<string | number>> }) {
  return (
    <div className="glass rounded-2xl p-5">
      <h2 className="mb-4 text-xl font-semibold text-white">{title}</h2>
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.join("-")} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
            <div className="font-semibold text-white">{row[0]}</div>
            <div className="mt-1 text-sm text-slate-400">{row.slice(1).join(" - ")}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4"><div className="text-2xl font-semibold text-white">{value}</div><div className="mt-1 text-xs text-slate-400">{label}</div></div>;
}

function SimpleBar({ label, value, max }: { label: string; value: number; max: number }) {
  return <div><div className="mb-1 flex justify-between text-xs"><span className="text-slate-400">{label}</span><span className="font-semibold text-white">{value}</span></div><div className="h-2 overflow-hidden rounded-full bg-white/[0.08]"><div className="h-full rounded-full bg-sky-400" style={{ width: `${Math.max(4, Math.round(value / max * 100))}%` }} /></div></div>;
}
