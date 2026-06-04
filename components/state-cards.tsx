import { AlertTriangle, CheckCircle2, Inbox, ShieldAlert, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

type StateCardProps = {
  title: string;
  description: string;
  action?: { label: string; href: string };
  compact?: boolean;
};

const variants = {
  error: { icon: ShieldAlert, className: "border-rose-300/20 bg-rose-300/[0.065] text-rose-100", iconClassName: "bg-rose-300/10 text-rose-200" },
  warning: { icon: AlertTriangle, className: "border-amber-300/20 bg-amber-300/[0.065] text-amber-100", iconClassName: "bg-amber-300/10 text-amber-200" },
  success: { icon: CheckCircle2, className: "border-emerald-300/20 bg-emerald-300/[0.06] text-emerald-100", iconClassName: "bg-emerald-300/10 text-emerald-200" },
  empty: { icon: Inbox, className: "border-cyan-300/15 bg-cyan-300/[0.04] text-cyan-100", iconClassName: "bg-cyan-300/10 text-cyan-200" }
} satisfies Record<string, { icon: LucideIcon; className: string; iconClassName: string }>;

function StateCard({ variant, title, description, action, compact = false }: StateCardProps & { variant: keyof typeof variants }) {
  const config = variants[variant];
  const Icon = config.icon;
  return (
    <section className={`rounded-2xl border ${config.className} ${compact ? "p-4" : "p-5"}`}>
      <div className="flex items-start gap-3">
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${config.iconClassName}`}><Icon className="h-4 w-4" /></div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="mt-1 text-xs leading-5 text-slate-400">{description}</p>
          {action ? <Link href={action.href} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-200 transition hover:text-cyan-100"><Sparkles className="h-3.5 w-3.5" />{action.label}</Link> : null}
        </div>
      </div>
    </section>
  );
}

export function ErrorCard(props: StateCardProps) {
  return <StateCard variant="error" {...props} />;
}

export function WarningCard(props: StateCardProps) {
  return <StateCard variant="warning" {...props} />;
}

export function SuccessCard(props: StateCardProps) {
  return <StateCard variant="success" {...props} />;
}

export function EmptyCard(props: StateCardProps) {
  return <StateCard variant="empty" {...props} />;
}
