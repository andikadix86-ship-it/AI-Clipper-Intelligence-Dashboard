"use client";

import { useState } from "react";
import { ClipperHeader } from "@/components/clipper-center/clipper-header";
import { ClipIntelligenceGrid } from "@/components/clipper-center/clip-intelligence-grid";
import { ClipperWorkflow } from "@/components/clipper-center/clipper-workflow";
import { PlatformOptimizationPanel } from "@/components/clipper-center/platform-optimization-panel";
import { PolicyGuardrail } from "@/components/clipper-center/policy-guardrail";
import { RecentClipProjects } from "@/components/clipper-center/recent-clip-projects";
import { SourcePanel } from "@/components/clipper-center/source-panel";
import { ClipperEnginePanel } from "@/components/clipper-center/clipper-engine-panel";

export function ClipperCenterWorkspace() {
  const [analyzed, setAnalyzed] = useState(false);

  return (
    <div className="space-y-6">
      <ClipperHeader />
      <ClipperEnginePanel />
      <SourcePanel analyzed={analyzed} onAnalyze={() => setAnalyzed(true)} />
      <ClipIntelligenceGrid analyzed={analyzed} />
      <ClipperWorkflow activeStage={analyzed ? 2 : 0} />
      <RecentClipProjects />
      <div className="grid gap-6 2xl:grid-cols-[1.28fr_0.92fr]">
        <PlatformOptimizationPanel />
        <PolicyGuardrail />
      </div>
    </div>
  );
}
