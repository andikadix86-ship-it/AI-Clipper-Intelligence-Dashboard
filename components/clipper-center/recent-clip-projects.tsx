import { ArrowRight, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { DashboardPanel } from "@/components/dashboard/ui";

const projects = [
  { title: "How AI Changes Small Business Marketing", duration: "58:24", clips: 12, score: "96", platform: "Multi-platform", status: "Ready to Review" },
  { title: "Podcast Founder Story: Building From Zero", duration: "1:42:18", clips: 18, score: "92", platform: "TikTok", status: "Analyzing" },
  { title: "Webinar: Affiliate Strategy for Beginners", duration: "46:09", clips: 9, score: "89", platform: "Instagram Reels", status: "Draft" },
  { title: "Weekly Product Deep Dive Episode 08", duration: "32:55", clips: 7, score: "94", platform: "YouTube Shorts", status: "Exported" }
];

export function RecentClipProjects() {
  return (
    <DashboardPanel title="Recent Clip Projects" description="Dummy project history for the Clipper Center workspace." action={<Link href="/clipper" className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-200 hover:text-cyan-100">Open advanced workflow <ArrowRight className="h-3.5 w-3.5" /></Link>}>
      <div className="overflow-x-auto">
        <table className="min-w-[860px] w-full text-left text-sm">
          <thead className="text-[10px] uppercase tracking-[0.16em] text-slate-600"><tr>{["Video Title", "Source Duration", "Clips Generated", "Best Hook", "Platform Target", "Status", ""].map((label, index) => <th key={`${label}-${index}`} className="pb-3 font-semibold">{label}</th>)}</tr></thead>
          <tbody>{projects.map((project) => <tr key={project.title} className="border-t border-white/[0.06]"><td className="max-w-sm py-4 pr-4 font-semibold text-slate-200">{project.title}</td><td className="py-4 pr-4 text-slate-400">{project.duration}</td><td className="py-4 pr-4 text-slate-400">{project.clips}</td><td className="py-4 pr-4"><span className="font-bold text-cyan-200">{project.score}</span><span className="text-slate-600"> / 100</span></td><td className="py-4 pr-4 text-slate-400">{project.platform}</td><td className="py-4 pr-4"><span className="rounded-full border border-white/[0.07] bg-white/[0.035] px-2.5 py-1 text-xs font-semibold text-slate-300">{project.status}</span></td><td className="py-4 text-right"><button type="button" aria-label={`Open ${project.title} actions`} className="text-slate-600 hover:text-slate-200"><MoreHorizontal className="h-4 w-4" /></button></td></tr>)}</tbody>
        </table>
      </div>
    </DashboardPanel>
  );
}
