import { Facebook, Instagram, Play, ShoppingBag, Youtube } from "lucide-react";
import { DashboardPanel } from "@/components/dashboard/ui";

const platforms = [
  { name: "YouTube Shorts", detail: "Like, Subscribe, Comment, Watch Next", icon: Youtube, color: "text-rose-200 bg-rose-300/10" },
  { name: "TikTok", detail: "Follow, Like, Save, Comment, Keranjang Kuning jika affiliate", icon: Play, color: "text-cyan-200 bg-cyan-300/10" },
  { name: "Instagram Reels", detail: "Save, Share, Follow, DM, Comment", icon: Instagram, color: "text-fuchsia-200 bg-fuchsia-300/10" },
  { name: "Facebook Reels", detail: "Share, Comment, Follow Page, Group Engagement, WhatsApp CTA", icon: Facebook, color: "text-blue-200 bg-blue-300/10" }
];

export function PlatformOptimizationPanel() {
  return (
    <DashboardPanel title="Platform Optimization" description="CTA and publishing guidance tailored for each short-form platform.">
      <div className="grid gap-3 md:grid-cols-2">
        {platforms.map((platform) => <article key={platform.name} className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4"><div className="flex items-center gap-3"><div className={`grid h-9 w-9 place-items-center rounded-xl ${platform.color}`}><platform.icon className="h-4 w-4" /></div><h3 className="text-sm font-semibold text-slate-200">{platform.name}</h3></div><p className="mt-3 text-xs leading-6 text-slate-500">{platform.detail}</p>{platform.name === "TikTok" ? <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-300/15 bg-amber-300/[0.06] px-2.5 py-1 text-[10px] font-semibold text-amber-100"><ShoppingBag className="h-3 w-3" /> Affiliate-ready CTA</div> : null}</article>)}
      </div>
    </DashboardPanel>
  );
}
