import type { LucideIcon } from "lucide-react";
import { EmptyState, FeatureCard, PageHeader, StatCard } from "@/components/studio-ui";

export type StudioSection = {
  eyebrow: string;
  title: string;
  subtitle: string;
  description: string;
  primaryAction?: { label: string; href: string };
  stats?: Array<{ label: string; value: string; detail: string }>;
  modules: Array<{ title: string; description: string; href?: string; icon: LucideIcon; status?: string }>;
};

export function StudioSectionPage({ section }: { section: StudioSection }) {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={section.eyebrow} title={section.title} subtitle={section.subtitle} description={section.description} action={section.primaryAction} />
      <div className="grid gap-3 sm:grid-cols-3">
        {(section.stats ?? defaultStats).map((stat) => <StatCard key={stat.label} {...stat} />)}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {section.modules.map((module) => <FeatureCard key={module.title} {...module} />)}
      </div>
      <EmptyState title={section.title} />
    </div>
  );
}

const defaultStats = [
  { label: "Active Modules", value: "03", detail: "Clean dummy data" },
  { label: "Workspace Status", value: "Ready", detail: "UI structure available" },
  { label: "Next Phase", value: "Backend", detail: "Prepared for integration" }
];
