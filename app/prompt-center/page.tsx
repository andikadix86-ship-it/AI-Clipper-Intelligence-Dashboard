"use client";

import clsx from "clsx";
import { BookOpen, Camera, Check, Clapperboard, Copy, ExternalLink, Filter, Layers3, Palette, Search, Sparkles, Wand2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  affiliatePromptTemplates,
  allPromptTemplates,
  cameraLanguage,
  cinematicLanguage,
  creatorPromptTemplates,
  promptProviderGuides,
  visualStyleLibrary,
  type PromptProviderId,
  type PromptTemplate
} from "@/lib/prompt-intelligence";

type View = "providers" | "templates" | "camera" | "styles";

const views: Array<{ id: View; label: string; icon: typeof BookOpen }> = [
  { id: "providers", label: "Provider Guides", icon: BookOpen },
  { id: "templates", label: "Prompt Templates", icon: Wand2 },
  { id: "camera", label: "Camera Language", icon: Camera },
  { id: "styles", label: "Visual Styles", icon: Palette }
];

export default function PromptCenterPage() {
  const [activeView, setActiveView] = useState<View>("providers");
  const [providerId, setProviderId] = useState<PromptProviderId>("VEO_3");
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState("");
  const provider = promptProviderGuides.find((item) => item.id === providerId) ?? promptProviderGuides[0];

  const visibleTemplates = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return allPromptTemplates;
    return allPromptTemplates.filter((item) => `${item.title} ${item.category} ${item.useCase} ${item.prompt}`.toLowerCase().includes(needle));
  }, [query]);

  async function copyPrompt(template: PromptTemplate) {
    await navigator.clipboard.writeText(template.prompt);
    setCopied(template.id);
    window.setTimeout(() => setCopied(""), 1600);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-sm text-sky-100">
            <Sparkles className="h-4 w-4" />
            Prompt Intelligence Center
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">Prompt Engineering Knowledge Base</h1>
          <p className="mt-3 max-w-3xl text-slate-300">Provider-aware playbooks, camera language, visual styles, and reusable templates for Creator and Affiliate workflows.</p>
        </div>
        <Link href="/creative-studio" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500">
          <Wand2 className="h-4 w-4" />
          Open Creative Studio
        </Link>
      </header>

      <section className="rounded-xl border border-sky-300/15 bg-sky-300/[0.05] p-4 text-sm leading-6 text-sky-100">
        This library is a versioned internal knowledge base. Provider capabilities change over time: verify the selected model in Provider Management before a real request. Templates preserve user intent and remain editable before generation.
      </section>

      <section className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
        {views.map((view) => (
          <button key={view.id} type="button" onClick={() => setActiveView(view.id)} className={clsx("inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition", activeView === view.id ? "border-primary bg-primary text-white" : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]")}>
            <view.icon className="h-4 w-4" />
            {view.label}
          </button>
        ))}
      </section>

      {activeView === "providers" ? (
        <section className="grid gap-5 xl:grid-cols-[280px_1fr]">
          <aside className="space-y-2">
            {promptProviderGuides.map((item) => (
              <button key={item.id} type="button" onClick={() => setProviderId(item.id)} className={clsx("w-full rounded-lg border p-3 text-left transition", provider.id === item.id ? "border-primary bg-primary/15" : "border-white/10 bg-[#111A2E] hover:bg-white/[0.06]")}>
                <div className="font-semibold text-white">{item.label}</div>
                <div className="mt-1 text-xs text-slate-400">{item.modality}</div>
              </button>
            ))}
          </aside>
          <div className="space-y-5">
            <section className="rounded-xl border border-white/10 bg-[#111A2E] p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-300">{provider.modality}</div>
                  <h2 className="mt-2 text-2xl font-semibold text-white">{provider.label}</h2>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">{provider.summary}</p>
                </div>
                <a href={provider.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-sky-200 transition hover:bg-white/[0.08]">
                  <ExternalLink className="h-3.5 w-3.5" />
                  {provider.sourceStatus}
                </a>
              </div>
              <div className="mt-5 rounded-lg border border-white/10 bg-[#0B1220] p-4">
                <div className="text-xs font-semibold uppercase text-slate-500">Prompt Formula</div>
                <div className="mt-2 text-sm leading-6 text-sky-100">{provider.formula}</div>
              </div>
              <p className="mt-4 text-xs leading-5 text-amber-100">{provider.modelNote}</p>
            </section>

            <section className="grid gap-5 lg:grid-cols-2">
              <KnowledgeList title="Best Practices" items={provider.bestPractices} tone="success" />
              <KnowledgeList title="Avoid" items={provider.avoid} tone="warning" />
            </section>

            <section>
              <SectionHeading title={`${provider.label} Templates`} detail="Copy a prompt or open it directly in Creative Studio." />
              <div className="mt-3 grid gap-4 lg:grid-cols-2">
                {provider.templates.map((template) => <TemplateCard key={template.id} template={template} copied={copied === template.id} onCopy={() => copyPrompt(template)} />)}
              </div>
            </section>
          </div>
        </section>
      ) : null}

      {activeView === "templates" ? (
        <section>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading title="Reusable Prompt Templates" detail={`${creatorPromptTemplates.length} creator starters, ${affiliatePromptTemplates.length} affiliate starters, and provider-specific variants.`} />
            <label className="relative block w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search prompt template" className="premium-input py-2.5 pl-10 pr-4 text-sm" />
            </label>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {visibleTemplates.map((template) => <TemplateCard key={template.id} template={template} copied={copied === template.id} onCopy={() => copyPrompt(template)} />)}
          </div>
          {!visibleTemplates.length ? <EmptyState title="No prompt template found" detail="Try a broader keyword or open a provider guide." /> : null}
        </section>
      ) : null}

      {activeView === "camera" ? (
        <section className="grid gap-5 lg:grid-cols-2">
          <LanguageTable icon={Camera} title="Camera Language" detail="Use concrete camera movement instead of vague cinematic wording." rows={cameraLanguage} />
          <LanguageTable icon={Clapperboard} title="Cinematic Language" detail="Control mood with lighting, palette, and visual treatment." rows={cinematicLanguage} />
        </section>
      ) : null}

      {activeView === "styles" ? (
        <section>
          <SectionHeading title="Visual Style Library" detail="Choose one dominant visual direction before adding provider-specific details." />
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visualStyleLibrary.map((style) => (
              <article key={style.name} className="rounded-xl border border-white/10 bg-[#111A2E] p-4">
                <Layers3 className="h-5 w-5 text-sky-300" />
                <h3 className="mt-3 font-semibold text-white">{style.name}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{style.description}</p>
                <div className="mt-4 text-xs font-semibold text-emerald-200">Best for: {style.bestFor}</div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function studioLink(template: PromptTemplate) {
  return `/creative-studio?prompt=${encodeURIComponent(template.prompt)}&type=${template.generationType}`;
}

function TemplateCard({ template, copied, onCopy }: { template: PromptTemplate; copied: boolean; onCopy: () => void }) {
  return (
    <article className="rounded-xl border border-white/10 bg-[#111A2E] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge>{template.category}</Badge>
            <Badge>{template.generationType.replace("_", " ")}</Badge>
          </div>
          <h3 className="mt-3 font-semibold text-white">{template.title}</h3>
          <p className="mt-1 text-xs text-slate-500">{template.useCase}</p>
        </div>
        <Filter className="h-4 w-4 text-slate-600" />
      </div>
      <p className="mt-4 rounded-lg border border-white/10 bg-[#0B1220] p-3 text-xs leading-5 text-slate-300">{template.prompt}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={onCopy} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/[0.08]">
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy Prompt"}
        </button>
        <Link href={studioLink(template)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-500">
          <Wand2 className="h-3.5 w-3.5" />
          Use in Studio
        </Link>
      </div>
    </article>
  );
}

function KnowledgeList({ title, items, tone }: { title: string; items: string[]; tone: "success" | "warning" }) {
  return (
    <section className="rounded-xl border border-white/10 bg-[#111A2E] p-5">
      <h3 className="font-semibold text-white">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.map((item) => <div key={item} className="flex gap-3 text-sm leading-6 text-slate-300"><span className={clsx("mt-2 h-2 w-2 shrink-0 rounded-full", tone === "success" ? "bg-emerald-400" : "bg-amber-400")} />{item}</div>)}
      </div>
    </section>
  );
}

function LanguageTable({ icon: Icon, title, detail, rows }: { icon: typeof Camera; title: string; detail: string; rows: Array<{ term: string; description: string; phrase: string }> }) {
  return (
    <section className="rounded-xl border border-white/10 bg-[#111A2E] p-5">
      <Icon className="h-5 w-5 text-sky-300" />
      <h2 className="mt-3 text-xl font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p>
      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <article key={row.term} className="rounded-lg border border-white/10 bg-[#0B1220] p-3">
            <h3 className="text-sm font-semibold text-white">{row.term}</h3>
            <p className="mt-1 text-xs leading-5 text-slate-400">{row.description}</p>
            <p className="mt-2 text-xs leading-5 text-sky-200">{row.phrase}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function SectionHeading({ title, detail }: { title: string; detail: string }) {
  return <div><h2 className="text-xl font-semibold text-white">{title}</h2><p className="mt-1 text-sm leading-6 text-slate-400">{detail}</p></div>;
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-sky-300/20 bg-sky-300/10 px-2 py-1 text-[10px] font-semibold uppercase text-sky-100">{children}</span>;
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return <div className="mt-4 rounded-xl border border-dashed border-white/15 bg-white/[0.03] p-8 text-center"><h3 className="font-semibold text-white">{title}</h3><p className="mt-2 text-sm text-slate-400">{detail}</p></div>;
}

