import { ArrowRight, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { DashboardPanel } from "@/components/dashboard/ui";

const projects = [
  { name: "Faceless Productivity Series", type: "AI Content Creator", stage: "Subtitle", progress: 78, status: "In Progress", color: "bg-cyan-300" },
  { name: "Ramadan Affiliate Campaign", type: "Affiliate Center", stage: "Policy Review", progress: 62, status: "Review", color: "bg-violet-300" },
  { name: "Podcast Shorts Batch #08", type: "Clipper Center", stage: "Export", progress: 91, status: "Almost Ready", color: "bg-blue-300" },
  { name: "Weekly Trend Explainer", type: "Intelligence Center", stage: "Script", progress: 38, status: "Draft", color: "bg-teal-300" }
];

export function ActiveProjects() {
  return (
    <DashboardPanel title="Active Projects" description="Project yang sedang berjalan di seluruh studio." action={<Link href="/projects" className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-200 hover:text-cyan-100">View all <ArrowRight className="h-3.5 w-3.5" /></Link>}>
      <div className="overflow-x-auto">
        <table className="min-w-[680px] w-full text-left text-sm">
          <thead className="text-[10px] uppercase tracking-[0.16em] text-slate-600"><tr>{["Project", "Current Stage", "Progress", "Status", ""].map((label, index) => <th key={`${label}-${index}`} className="pb-3 font-semibold">{label}</th>)}</tr></thead>
          <tbody>{projects.map((project) => <tr key={project.name} className="border-t border-white/[0.06]">
            <td className="py-4 pr-4"><div className="font-semibold text-slate-200">{project.name}</div><div className="mt-1 text-xs text-slate-600">{project.type}</div></td>
            <td className="py-4 pr-4 text-slate-400">{project.stage}</td>
            <td className="w-40 py-4 pr-4"><div className="flex items-center gap-3"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.07]"><div className={`h-full rounded-full ${project.color}`} style={{ width: `${project.progress}%` }} /></div><span className="text-xs text-slate-500">{project.progress}%</span></div></td>
            <td className="py-4 pr-4"><span className="rounded-full border border-white/[0.07] bg-white/[0.035] px-2.5 py-1 text-xs font-semibold text-slate-300">{project.status}</span></td>
            <td className="py-4 text-right"><button type="button" aria-label={`Open ${project.name} actions`} className="text-slate-600 hover:text-slate-200"><MoreHorizontal className="h-4 w-4" /></button></td>
          </tr>)}</tbody>
        </table>
      </div>
    </DashboardPanel>
  );
}
