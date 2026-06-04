"use client";

import { useEffect, useState } from "react";
import { ActiveProjects } from "@/components/dashboard/active-projects";
import { AIAgentsPanel } from "@/components/dashboard/ai-agents-panel";
import { ContentPipeline } from "@/components/dashboard/content-pipeline";
import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import { FeatureCards } from "@/components/dashboard/feature-cards";
import { KPIOverview } from "@/components/dashboard/kpi-overview";
import { PolicyQualitySnapshot } from "@/components/dashboard/policy-quality-snapshot";
import { QuickAccess } from "@/components/dashboard/quick-access";
import { WarningCard } from "@/components/state-cards";
import { ProviderRuntimeStatus } from "@/components/provider-runtime-status";
import type { DashboardSummary } from "@/components/dashboard/types";

const initialSummary: DashboardSummary = {
  reviewQueue: 0,
  approvalQueue: 0,
  scheduledToday: 0,
  failedPosting: 0,
  publishedContent: 0,
  scheduledContent: 0,
  aiTeam: [],
  recentActivities: [],
  unreadNotifications: 0,
  providerWarnings: 0,
  recommendationsReady: 0
};

export function DashboardHome() {
  const { summary, warning } = useDashboardSummary();
  return (
    <div className="space-y-6">
      <DashboardHero />
      {warning ? <WarningCard compact title="Fallback mode aktif" description={warning} /> : null}
      <FeatureCards />
      <ProviderRuntimeStatus compact />
      <KPIOverview summary={summary} />
      <ContentPipeline summary={summary} />
      <div className="grid gap-6 2xl:grid-cols-[1.42fr_0.78fr]">
        <ActiveProjects />
        <PolicyQualitySnapshot warningCount={summary.providerWarnings} />
      </div>
      <div className="grid gap-6 2xl:grid-cols-[1.25fr_0.95fr]">
        <AIAgentsPanel agents={summary.aiTeam} />
        <QuickAccess />
      </div>
    </div>
  );
}

function useDashboardSummary() {
  const [summary, setSummary] = useState<DashboardSummary>(initialSummary);
  const [warning, setWarning] = useState("");

  useEffect(() => {
    const load = () => fetch("/api/dashboard/operations")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Dashboard summary gagal dimuat.");
        setSummary({ ...initialSummary, ...data.operations, ...data.analytics, ...data.notifications, aiTeam: data.aiTeam ?? [], recentActivities: data.recentActivities ?? [] });
        setWarning(data.source === "fallback" ? data.message ?? "Database unavailable, using empty dashboard summary." : "");
      })
      .catch((error) => setWarning(error instanceof Error ? error.message : "Dashboard summary gagal dimuat."));
    load();
    const timer = window.setInterval(load, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  return { summary, warning };
}
