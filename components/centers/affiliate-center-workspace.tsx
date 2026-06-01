import { BarChart3, Calculator, ChartNoAxesCombined, Flame, PackageSearch, Search, Sparkles, Store, Target, TrendingUp, UsersRound } from "lucide-react";
import { ModuleGrid, WorkflowPanel } from "@/components/centers/center-ui";
import { DashboardPanel } from "@/components/dashboard/ui";
import { PageHeader, StatCard } from "@/components/studio-ui";

const productCards = [
  { title: "Trending Products", detail: "Products with accelerating demand signals.", metric: "128", icon: TrendingUp },
  { title: "High Commission Products", detail: "Products prioritized by payout potential.", metric: "42", icon: BarChart3 },
  { title: "Low Competition Products", detail: "Opportunities with healthier entry windows.", metric: "36", icon: Target },
  { title: "Viral Products", detail: "Products appearing in fast-moving short-form content.", metric: "19", icon: Flame },
  { title: "Recommended Products", detail: "AI-curated shortlist for the next campaign.", metric: "24", icon: Sparkles }
];

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

const rows = [
  ["Portable Blender Pro", "TikTok Shop", "92", "12%", "Low", "Recommended"],
  ["Smart Home Mini Camera", "Shopee", "89", "9%", "Medium", "Viral"],
  ["Travel Prayer Kit", "Tokopedia", "86", "14%", "Low", "Trending"],
  ["Ergonomic Laptop Stand", "TikTok Shop", "83", "11%", "Medium", "Research"]
];

export function AffiliateCenterWorkspace() {
  return <div className="space-y-6"><PageHeader eyebrow="Affiliate Marketing OS" title="Affiliate Center" subtitle="Find profitable products, build campaigns, and track affiliate opportunities from one operating system." description="Dummy intelligence workspace for product discovery, competitor research, content production, publishing, and commission tracking." action={{ label: "Explore Product Hunter", href: "/winning-products" }} /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><StatCard label="Products Scanned" value="1,248" detail="Dummy catalog signals" /><StatCard label="Recommended" value="24" detail="Ready for research" /><StatCard label="Campaign Drafts" value="08" detail="Content angles prepared" /><StatCard label="Avg. Commission" value="11.4%" detail="Across shortlisted products" /><StatCard label="Conversion Signal" value="+18%" detail="Demo weekly movement" /></div><ModuleGrid title="Affiliate Operating Modules" description="Core modules for product-led affiliate operations." items={modules} /><WorkflowPanel title="Affiliate Workflow" steps={["Find Product", "Analyze", "Create Content", "Publish", "Track Commission"]} /><ModuleGrid title="Product Opportunity Cards" description="Clean dummy signals for product prioritization." items={productCards} columns="xl:grid-cols-5" /><DashboardPanel title="Recommended Product Shortlist" description="Dummy product data prepared for marketplace API integration."><div className="overflow-x-auto"><table className="min-w-[760px] w-full text-left text-sm"><thead className="text-[10px] uppercase tracking-[0.16em] text-slate-600"><tr>{["Product", "Source", "Score", "Commission", "Competition", "Status"].map((label) => <th key={label} className="pb-3 font-semibold">{label}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row[0]} className="border-t border-white/[0.06]">{row.map((value, index) => <td key={`${row[0]}-${index}`} className={`py-4 pr-4 ${index === 0 ? "font-semibold text-slate-200" : index === 2 ? "font-bold text-cyan-200" : "text-slate-400"}`}>{value}</td>)}</tr>)}</tbody></table></div></DashboardPanel></div>;
}
