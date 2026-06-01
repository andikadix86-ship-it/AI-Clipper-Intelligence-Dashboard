import { Check, ChevronRight } from "lucide-react";
import type { DashboardSummary } from "@/components/dashboard/types";
import { DashboardPanel } from "@/components/dashboard/ui";

const stages = ["Topic", "Script", "Scene", "Voice", "Subtitle", "Metadata", "Policy", "Export"];

export function ContentPipeline({ summary }: { summary: DashboardSummary }) {
  return (
    <DashboardPanel title="Content Pipeline" description="Pantau progres produksi konten dari ide hingga asset siap publish." action={<span className="rounded-full border border-blue-300/15 bg-blue-300/[0.06] px-3 py-1 text-xs font-semibold text-blue-100">{summary.reviewQueue + summary.approvalQueue} active items</span>}>
      <div className="grid gap-2 md:grid-cols-4 xl:grid-cols-8">
        {stages.map((stage, index) => (
          <div key={stage} className="relative flex items-center gap-2 xl:block">
            <div className={`flex min-h-[76px] flex-1 items-center gap-3 rounded-xl border p-3 xl:block ${index < 5 ? "border-cyan-300/15 bg-cyan-300/[0.055]" : "border-white/[0.07] bg-white/[0.025]"}`}>
              <div className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${index < 5 ? "bg-cyan-300/15 text-cyan-100" : "bg-white/[0.06] text-slate-500"}`}>{index < 5 ? <Check className="h-3.5 w-3.5" /> : index + 1}</div>
              <div className="mt-0 text-xs font-semibold text-slate-300 xl:mt-3">{stage}</div>
            </div>
            {index < stages.length - 1 ? <ChevronRight className="hidden h-4 w-4 shrink-0 text-slate-700 xl:absolute xl:-right-3 xl:top-8 xl:z-10 xl:block" /> : null}
          </div>
        ))}
      </div>
    </DashboardPanel>
  );
}
