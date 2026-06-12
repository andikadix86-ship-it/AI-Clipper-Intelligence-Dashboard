import { BarChart3, CalendarClock, Calculator, ChartNoAxesCombined, Megaphone, PackageSearch, Search, Sparkles, Store, UsersRound } from "lucide-react";
import Link from "next/link";
import { ModuleGrid } from "@/components/centers/center-ui";
import { DashboardPanel } from "@/components/dashboard/ui";
import { PageHeader, StatCard } from "@/components/studio-ui";
import { AffiliateEnginePanel } from "@/components/centers/affiliate-engine-panel";
import { ProductIntelligenceCenter } from "@/components/affiliate/product-intelligence-center";
import { AffiliateAccountsPanel, AffiliateAnalyticsPanel, AffiliateDownstreamPanel, AffiliateSchedulerPanel, CampaignManagerPanel } from "@/components/affiliate/affiliate-workflow-panels";

const modules = [
  { title: "Product Hunter", detail: "Discover products with strong affiliate potential.", icon: PackageSearch, tag: "Discovery" },
  { title: "Campaign Hunter", detail: "Find campaign angles and seasonal windows.", icon: Store, tag: "Campaign" },
  { title: "Product Research", detail: "Inspect benefits, pricing, and audience fit.", icon: Search, tag: "Research" },
  { title: "Competitor Research", detail: "Compare offers, hooks, and content positioning.", icon: UsersRound, tag: "Research" },
  { title: "Profit Calculator", detail: "Estimate margin, commission, and content ROI.", icon: Calculator, tag: "Finance" },
  { title: "Content Factory", detail: "Turn shortlisted products into content briefs.", icon: Sparkles, tag: "Production" },
  { title: "Product Score", detail: "Rank products using clean dummy signals.", icon: ChartNoAxesCombined, tag: "Scoring" },
  { title: "Affiliate Analytics", detail: "Track conversion and campaign momentum.", icon: BarChart3, tag: "Analytics" }
];

const quickActions = [
  { title: "Find Product", detail: "Open product hunting and identify the strongest opportunity.", href: "/winning-products", icon: Search },
  { title: "Create Campaign", detail: "Jump to Campaign Manager after choosing a product.", href: "#campaign-manager", icon: Megaphone },
  { title: "Generate Content", detail: "Open Content Factory for hooks, scripts, captions, and CTA.", href: "/content-factory", icon: Sparkles },
  { title: "Publishing", detail: "Review packages and prepare scheduled posting.", href: "#publishing-scheduler", icon: CalendarClock },
  { title: "View Analytics", detail: "Check performance, clicks, sales, and commission.", href: "#analytics-profit-center", icon: BarChart3 }
];

export function AffiliateCenterWorkspace() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Affiliate Marketing OS" title="Affiliate Center" subtitle="Find profitable products, target multiple affiliate accounts, and run campaigns from intelligence to analytics." description="Supabase-backed product intelligence, multi-account campaign planning, content production, publishing, and affiliate analytics." action={{ label: "Explore Product Hunter", href: "/winning-products" }} />
      <section id="product-intelligence-center" className="scroll-mt-6">
        <ProductIntelligenceCenter />
      </section>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Products Scanned" value="70+" detail="Supabase intelligence catalog" />
        <StatCard label="Sources" value="07" detail="Marketplace and custom affiliate" />
        <StatCard label="Categories" value="07" detail="Top 10 products per category" />
        <StatCard label="Scoring Signals" value="05" detail="Demand to trend score" />
        <StatCard label="Workflow" value="07" detail="Discovery to analytics" />
      </div>
      <QuickActionsPanel />
      <AffiliateAccountsPanel />
      <section id="campaign-manager" className="scroll-mt-6">
        <CampaignManagerPanel />
      </section>
      <AffiliateEnginePanel />
      <AffiliateDownstreamPanel />
      <section id="publishing-scheduler" className="scroll-mt-6">
        <AffiliateSchedulerPanel />
      </section>
      <ModuleGrid title="AI Agents Center" description="Agent-like operating modules for product-led affiliate operations." items={modules} />
      <section id="analytics-profit-center" className="scroll-mt-6">
        <AffiliateAnalyticsPanel />
      </section>
    </div>
  );
}

function QuickActionsPanel() {
  return (
    <DashboardPanel title="Quick Actions" description="Use these shortcuts to move from product decision to campaign, content, publishing, and analytics.">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {quickActions.map((item) => (
          <Link key={item.title} href={item.href} className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4 transition hover:border-cyan-300/20 hover:bg-cyan-300/[0.035]">
            <item.icon className="h-4 w-4 text-cyan-200" />
            <h3 className="mt-3 text-sm font-semibold text-white">{item.title}</h3>
            <p className="mt-2 text-xs leading-5 text-slate-500">{item.detail}</p>
          </Link>
        ))}
      </div>
    </DashboardPanel>
  );
}
