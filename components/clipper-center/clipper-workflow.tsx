import { Check, ChevronRight } from "lucide-react";
import { DashboardPanel } from "@/components/dashboard/ui";

const stages = ["Source", "Analyze", "Segment", "Score", "Caption", "Metadata", "Policy", "Export"];

export function ClipperWorkflow({ activeStage }: { activeStage: number }) {
  return (
    <DashboardPanel title="Clipper Workflow" description="Source to export pipeline for short-form content production.">
      <div className="grid gap-2 md:grid-cols-4 xl:grid-cols-8">
        {stages.map((stage, index) => {
          const complete = index < activeStage;
          const active = index === activeStage;
          return <div key={stage} className="relative flex items-center gap-2 xl:block"><div className={`flex min-h-[78px] flex-1 items-center gap-3 rounded-xl border p-3 xl:block ${complete ? "border-cyan-300/15 bg-cyan-300/[0.055]" : active ? "border-violet-300/25 bg-violet-300/[0.07]" : "border-white/[0.07] bg-white/[0.025]"}`}><div className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${complete ? "bg-cyan-300/15 text-cyan-100" : active ? "bg-violet-300/15 text-violet-100" : "bg-white/[0.06] text-slate-600"}`}>{complete ? <Check className="h-3.5 w-3.5" /> : index + 1}</div><div className="mt-0 text-xs font-semibold text-slate-300 xl:mt-3">{stage}</div></div>{index < stages.length - 1 ? <ChevronRight className="hidden h-4 w-4 shrink-0 text-slate-700 xl:absolute xl:-right-3 xl:top-8 xl:z-10 xl:block" /> : null}</div>;
        })}
      </div>
    </DashboardPanel>
  );
}
