"use client";

import { FolderKanban, Layers3, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { ContentMode, ProjectDto } from "@/lib/types";

const modes: Array<{ value: ContentMode; label: string }> = [
  { value: "CLIPPER", label: "Clipper Mode" },
  { value: "IMAGE_GENERATOR", label: "Image Generator Mode" },
  { value: "AI_VIDEO_GENERATOR", label: "AI Video Generator Mode" }
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [form, setForm] = useState({
    name: "New Viral Workflow",
    niche: "AI tools for creators",
    category: "Education",
    targetAccounts: "Fatih - YouTube, Fatih - TikTok",
    contentMode: "CLIPPER" as ContentMode
  });
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/projects")
      .then((response) => response.json())
      .then((data) => setProjects(data.projects));
  }, []);

  async function createProject() {
    setMessage(null);
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        targetAccounts: form.targetAccounts.split(",").map((item) => item.trim()).filter(Boolean)
      })
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "Project could not be created.");
      return;
    }
    setProjects((current) => [data.project, ...current]);
    setMessage(data.warning ?? "Project saved.");
  }

  return (
    <div className="space-y-6">
      <header>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1 text-sm text-teal-100">
          <FolderKanban className="h-4 w-4" />
          Workflow Center
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">Projects</h1>
        <p className="mt-3 max-w-3xl text-slate-300">
          Organize every niche, social destination, and content generation mode from one project hub.
        </p>
      </header>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="glass rounded-2xl p-5 md:p-6">
          <h2 className="mb-4 text-xl font-semibold text-white">Create Project</h2>
          <div className="space-y-4">
            <Field label="Project Name">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="premium-input px-4 py-3" />
            </Field>
            <Field label="Niche">
              <input value={form.niche} onChange={(e) => setForm({ ...form, niche: e.target.value })} className="premium-input px-4 py-3" />
            </Field>
            <Field label="Kategori">
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="premium-input px-4 py-3" />
            </Field>
            <Field label="Akun sosial media tujuan">
              <input value={form.targetAccounts} onChange={(e) => setForm({ ...form, targetAccounts: e.target.value })} className="premium-input px-4 py-3" />
            </Field>
            <Field label="Mode konten">
              <select value={form.contentMode} onChange={(e) => setForm({ ...form, contentMode: e.target.value as ContentMode })} className="premium-input px-4 py-3">
                {modes.map((mode) => (
                  <option key={mode.value} value={mode.value}>{mode.label}</option>
                ))}
              </select>
            </Field>
            <button onClick={createProject} type="button" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-300 px-5 py-4 font-semibold text-slate-950 shadow-glow">
              <Plus className="h-5 w-5" />
              Save Project
            </button>
            {message ? <p className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-300">{message}</p> : null}
          </div>
        </div>

        <div className="grid gap-4">
          {projects.map((project) => (
            <article key={project.id} className="glass rounded-2xl p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-teal-100">
                    <Sparkles className="h-3.5 w-3.5" />
                    {modes.find((mode) => mode.value === project.contentMode)?.label}
                  </div>
                  <Link href={`/projects/${project.id}`} className="text-xl font-semibold text-white hover:text-teal-100">{project.name}</Link>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{project.niche} - {project.category}</p>
                </div>
                <Layers3 className="h-6 w-6 text-teal-300" />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {project.targetAccounts.map((account) => (
                  <span key={account} className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-slate-300">{account}</span>
                ))}
              </div>
              <Link href={`/projects/${project.id}`} className="mt-4 inline-flex rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white hover:bg-white/[0.1]">
                Open Project Center
              </Link>
            </article>
          ))}
          {!projects.length ? (
            <div className="glass grid min-h-72 place-items-center rounded-2xl p-8 text-center">
              <div>
                <FolderKanban className="mx-auto mb-4 h-10 w-10 text-teal-300" />
                <h2 className="text-xl font-semibold text-white">Belum ada project</h2>
                <p className="mt-2 max-w-md text-sm text-slate-400">Buat project pertama sebagai pusat workflow niche, brand, atau campaign.</p>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">{label}</span>
      {children}
    </label>
  );
}
