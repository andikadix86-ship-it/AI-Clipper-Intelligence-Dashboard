"use client";

/* eslint-disable @next/next/no-img-element */

import clsx from "clsx";
import {
  BadgeCheck,
  Captions,
  Check,
  ChevronDown,
  Clock3,
  Eye,
  Instagram,
  Layers3,
  Loader2,
  Play,
  Scissors,
  Send,
  Settings2,
  Sparkles,
  TextCursorInput,
  Type,
  Youtube
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { GeneratedClipDto, Platform, PostingClipDetailDto, PrivacyStatus, ProjectDto, VideoPreview } from "@/lib/types";

const platformOptions: Array<{ value: Platform; label: string; icon: typeof Youtube }> = [
  { value: "YOUTUBE", label: "YouTube", icon: Youtube },
  { value: "TIKTOK", label: "TikTok", icon: Play },
  { value: "INSTAGRAM", label: "Instagram", icon: Instagram }
];

const tabs = [
  { id: "basic", label: "Pengaturan Dasar", icon: Settings2 },
  { id: "layout", label: "Layout", icon: Layers3 },
  { id: "subtitleStyle", label: "Gaya Subtitle", icon: Type },
  { id: "textPlacement", label: "Peletakan Teks", icon: TextCursorInput },
  { id: "cc", label: "Subtitle/CC", icon: Captions }
] as const;

type TabId = (typeof tabs)[number]["id"];

type ClipperSetting = {
  prompt: string;
  watermark: boolean;
  subtitle: boolean;
  category: string;
  clipCount: number;
  duration: number | "AUTO";
  resolution: string;
  layout: string;
  subtitleStyle: string;
  textPlacement: string;
  ccLanguage: string;
};

const defaultSetting: ClipperSetting = {
  prompt: "Find the strongest hooks, emotional peaks, and practical takeaways for short-form social clips.",
  watermark: true,
  subtitle: true,
  category: "Education",
  clipCount: 3,
  duration: 30,
  resolution: "1080x1920",
  layout: "Auto Reframe",
  subtitleStyle: "Bold Creator",
  textPlacement: "Lower Third",
  ccLanguage: "id-ID"
};

const thumbnailSurfaces = [
  "bg-[#172033]",
  "bg-[#1d2433]",
  "bg-[#142234]",
  "bg-[#202331]"
];

type MediaJob = {
  id: string;
  videoSourceId?: string;
  status: string;
  progress: number;
  inputUrl: string;
  outputUrl?: string;
  errorMessage?: string;
  logs?: string[];
};

export default function ClipperPage() {
  const [platform, setPlatform] = useState<Platform>("YOUTUBE");
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [projectId, setProjectId] = useState("");
  const [url, setUrl] = useState("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  const [sourceType, setSourceType] = useState<"URL" | "UPLOAD">("URL");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null);
  const [mediaJob, setMediaJob] = useState<MediaJob | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [preview, setPreview] = useState<VideoPreview | null>(null);
  const [setting, setSetting] = useState(defaultSetting);
  const [activeTab, setActiveTab] = useState<TabId>("basic");
  const [clips, setClips] = useState<GeneratedClipDto[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [postingDetails, setPostingDetails] = useState<Record<string, PostingClipDetailDto>>({});
  const [openDetailId, setOpenDetailId] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [schedule, setSchedule] = useState({
    socialAccountName: "Fatih",
    destination: "YOUTUBE" as Platform,
    startDate: new Date().toISOString().slice(0, 10),
    postingTime: "09:00",
    postingEndTime: "21:00",
    timezone: "Asia/Jakarta",
    videosPerDay: 2
  });

  const selectedClips = useMemo(() => clips.filter((clip) => selectedIds.includes(clip.id)), [clips, selectedIds]);
  const selectedPlatform = platformOptions.find((item) => item.value === platform) ?? platformOptions[0];

  useEffect(() => {
    fetch("/api/projects")
      .then((response) => response.json())
      .then((data) => {
        const loadedProjects = data.projects ?? [];
        setProjects(loadedProjects);
        setProjectId(loadedProjects[0]?.id ?? "");
      })
      .catch(() => undefined);
  }, []);

  async function loadPreview() {
    setLoadingPreview(true);
    setMessage(null);
    try {
      const response = await fetch("/api/video/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, url, projectId })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Preview failed.");
      setPreview(data);
      setClips([]);
      setSelectedIds([]);
      setPostingDetails({});
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Preview failed.");
    } finally {
      setLoadingPreview(false);
    }
  }

  async function uploadVideo() {
    if (!uploadFile) return;
    setUploading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("projectId", projectId);
      formData.append("platform", platform);
      const response = await fetch("/api/media/upload", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Upload failed.");
      setMediaJob(data.job);
      setPreview({
        id: data.videoSource.id,
        platform: data.videoSource.platform,
        url: data.videoSource.url,
        title: data.videoSource.title,
        thumbnail: data.videoSource.thumbnail
      });
      setUrl(data.videoSource.url);
      setMessage(data.warning ?? "Upload queued.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function startProcessing() {
    const videoSourceId = preview?.id ?? mediaJob?.videoSourceId;
    if (!videoSourceId) return;
    setProcessing(true);
    setMessage(null);
    try {
      const response = await fetch("/api/clips/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoSourceId })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Processing failed.");
      setMediaJob(data.job);
      setMessage(data.job.errorMessage ?? `Processing ${data.job.status}. Output ready.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Processing failed.");
    } finally {
      setProcessing(false);
    }
  }

  async function generateClips() {
    if (!preview) return;
    setGenerating(true);
    setMessage(null);
    try {
      const response = await fetch("/api/clips/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoSourceId: preview.id,
          sourceTitle: preview.title,
          sourceUrl: preview.url,
          platform: preview.platform,
          projectId,
          setting: { ...setting, videoSourceId: preview.id }
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Generate failed.");
      setClips(data.clips);
      if (data.jobs?.length) setMediaJob(data.jobs[data.jobs.length - 1]);
      setPreview((current) => (current ? { ...current, id: data.videoSourceId ?? current.id } : current));
      setSelectedIds([]);
      setPostingDetails(
        Object.fromEntries(
          data.clips.map((clip: GeneratedClipDto) => [
            clip.id,
            {
              generatedClipId: clip.id,
              title: clip.title,
              description: clip.description,
              tags: clip.tags,
              privacyStatus: "PUBLIC" as PrivacyStatus,
              notifySubscriber: true,
              madeForKids: false
            }
          ])
        )
      );
      setMessage(data.warning ?? `${data.clips.length} clips generated.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Generate failed.");
    } finally {
      setGenerating(false);
    }
  }

  function toggleSelected(clip: GeneratedClipDto) {
    setSelectedIds((current) => (current.includes(clip.id) ? current.filter((id) => id !== clip.id) : [...current, clip.id]));
  }

  function selectAll() {
    setSelectedIds((current) => (current.length === clips.length ? [] : clips.map((clip) => clip.id)));
  }

  function updatePostingDetail(id: string, patch: Partial<PostingClipDetailDto>) {
    setPostingDetails((current) => ({ ...current, [id]: { ...current[id], ...patch } }));
  }

  async function saveSchedule() {
    if (!preview || selectedClips.length === 0) return;
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/schedule/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...schedule,
          videoSourceId: preview.id,
          clips: selectedClips.map((clip) => postingDetails[clip.id])
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Schedule failed.");
      setMessage(`Schedule saved with ${data.schedule.clipDetails.length} posting details.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Schedule failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1 text-sm text-teal-100">
            <Scissors className="h-4 w-4" />
            Tahap 2B
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">Clipper Workflow</h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            Generate, analyze, and schedule viral short clips from long videos.
          </p>
        </div>
        <div className="grid grid-cols-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] text-center">
          <MiniStat label="Preview" value={preview ? "Ready" : "0"} />
          <MiniStat label="Clips" value={String(clips.length)} />
          <MiniStat label="Selected" value={String(selectedIds.length)} />
        </div>
      </header>

      <section className="glass rounded-2xl p-5 md:p-6">
        <div className="grid gap-4 lg:grid-cols-[190px_220px_220px_1fr_auto] lg:items-end">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-300">Source Type</span>
            <select value={sourceType} onChange={(event) => setSourceType(event.target.value as "URL" | "UPLOAD")} className="premium-input px-4 py-4">
              <option value="URL">URL</option>
              <option value="UPLOAD">Upload</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-300">Project</span>
            <select value={projectId} onChange={(event) => setProjectId(event.target.value)} className="premium-input px-4 py-4">
              <option value="">Unassigned</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-300">Platform</span>
            <div className="relative">
              <selectedPlatform.icon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-teal-300" />
              <select
                value={platform}
                onChange={(event) => setPlatform(event.target.value as Platform)}
                className="premium-input appearance-none px-12 py-4"
              >
                {platformOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            </div>
          </label>

          {sourceType === "URL" ? <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-300">Video URL</span>
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="Paste YouTube, TikTok, or Instagram video URL"
              className="premium-input px-4 py-4"
            />
          </label> : <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-300">Upload Video</span>
            <input
              type="file"
              accept="video/*"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setUploadFile(file);
                setUploadPreviewUrl(file ? URL.createObjectURL(file) : null);
              }}
              className="premium-input px-4 py-3"
            />
          </label>}

          <button
            type="button"
            onClick={sourceType === "URL" ? loadPreview : uploadVideo}
            disabled={sourceType === "URL" ? loadingPreview || !url : uploading || !uploadFile}
            className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-primary px-6 font-semibold text-white shadow-glow transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingPreview || uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Eye className="h-5 w-5" />}
            {sourceType === "URL" ? "Load Preview" : "Upload Video"}
          </button>
        </div>
        {sourceType === "UPLOAD" ? (
          <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm text-amber-100">
            Supabase Storage buckets needed for production: videos, thumbnails, outputs, subtitles. Current fallback stores upload locally and does not crash if buckets are missing.
          </div>
        ) : null}
        {message ? <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-200">{message}</div> : null}
      </section>

      {(mediaJob || uploadPreviewUrl) ? (
        <section className="glass rounded-2xl p-5">
          <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
            {uploadPreviewUrl ? <video src={uploadPreviewUrl} controls className="aspect-video w-full rounded-2xl bg-slate-950 object-cover" /> : <div className="grid aspect-video place-items-center rounded-2xl bg-slate-950 text-slate-400">Upload preview</div>}
            <div>
              <h2 className="text-xl font-semibold text-white">Media Processing Job</h2>
              <p className="mt-2 text-sm text-slate-400">Dummy processing pipeline prepared for future FFmpeg/worker execution.</p>
              {mediaJob ? (
                <div className="mt-4 space-y-3">
                  <div className="flex justify-between text-sm"><span className="text-slate-400">Status</span><span className="font-semibold text-white">{mediaJob.status}</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/[0.08]"><div className="h-full bg-teal-300" style={{ width: `${mediaJob.progress}%` }} /></div>
                  <div className="text-xs text-slate-500">Job ID: {mediaJob.id}</div>
                  {mediaJob.errorMessage ? <div className="text-sm text-rose-200">{mediaJob.errorMessage}</div> : null}
                  {mediaJob.outputUrl ? <a href={mediaJob.outputUrl} target="_blank" rel="noreferrer" className="block text-sm text-teal-200">Output preview</a> : null}
                  {mediaJob.logs?.length ? (
                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Job Logs</div>
                      <div className="space-y-1 text-xs text-slate-300">
                        {mediaJob.logs.slice(-5).map((log, index) => <div key={`${log}-${index}`}>{log}</div>)}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
              <button type="button" disabled={processing || !preview} onClick={startProcessing} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-300 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60">
                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scissors className="h-4 w-4" />}
                Start Processing
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {preview ? (
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(380px,0.65fr)]">
          <div className="glass overflow-hidden rounded-2xl">
            <div className="aspect-video bg-slate-950">
              {preview.embedUrl ? (
                <iframe
                  src={preview.embedUrl}
                  title={preview.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full"
                />
              ) : (
                <div className="grid h-full place-items-center bg-[#0E1728]">
                  <div className="text-center">
                    <Play className="mx-auto mb-4 h-14 w-14 text-teal-300" />
                    <div className="text-xl font-semibold text-white">Preview placeholder</div>
                    <div className="mt-1 text-sm text-slate-400">{preview.platform}</div>
                  </div>
                </div>
              )}
            </div>
            <div className="grid gap-4 p-5 md:grid-cols-[160px_1fr]">
              <img src={preview.thumbnail} alt="" className="h-28 w-full rounded-2xl object-cover" />
              <div>
                <div className="mb-2 inline-flex rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1 text-xs font-semibold text-teal-100">
                  {preview.platform}
                </div>
                <h2 className="text-2xl font-semibold text-white">{preview.title}</h2>
                <p className="mt-2 break-all text-sm text-slate-400">{preview.url}</p>
              </div>
            </div>
          </div>

          <ClipSettings
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            setting={setting}
            setSetting={setSetting}
            generating={generating}
            onGenerate={generateClips}
          />
        </section>
      ) : null}

      {clips.length > 0 ? (
        <section className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">Generated Clips</h2>
              <p className="mt-1 text-sm text-slate-400">Dummy clip cards with realistic metadata for review and selection.</p>
            </div>
            <button
              type="button"
              onClick={selectAll}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.1]"
            >
              <Check className="h-4 w-4" />
              {selectedIds.length === clips.length ? "Batalkan Semua" : "Pilih Semua"}
            </button>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {clips.map((clip, index) => {
              const selected = selectedIds.includes(clip.id);
              return (
                <article key={clip.id} className={clsx("glass overflow-hidden rounded-2xl transition", selected && "ring-2 ring-teal-300")}>
                  <div className={clsx("relative aspect-[9/12]", thumbnailSurfaces[index % thumbnailSurfaces.length])}>
                    <img src={clip.thumbnail} alt="" className="h-full w-full object-cover opacity-40 mix-blend-luminosity" />
                    <div className="absolute left-4 top-4 rounded-full bg-slate-950/80 px-3 py-1 text-sm font-semibold text-teal-200">
                      Viral {clip.viralScore}
                    </div>
                    <div className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-slate-950/80 px-3 py-1 text-sm text-white">
                      <Clock3 className="h-4 w-4" />
                      {clip.duration}s
                    </div>
                    <div className="absolute bottom-4 right-4 rounded-full bg-slate-950/80 px-3 py-1 text-xs font-semibold text-sky-100">
                      {clip.processingStatus ?? "QUEUED"}
                    </div>
                    <label className="absolute right-4 top-4 grid h-10 w-10 cursor-pointer place-items-center rounded-full bg-slate-950/80">
                      <input type="checkbox" checked={selected} onChange={() => toggleSelected(clip)} className="h-5 w-5 accent-teal-300" />
                    </label>
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-white">{clip.title}</h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-400">{clip.description}</p>
                    <button
                      type="button"
                      className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.1]"
                    >
                      <Play className="h-4 w-4" />
                      Preview
                    </button>
                    {clip.outputFileUrl ? (
                      <a href={clip.outputFileUrl} download className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-200">
                        Download Result
                      </a>
                    ) : null}
                    {clip.errorMessage ? <p className="mt-3 text-xs text-amber-200">{clip.errorMessage}</p> : null}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {selectedClips.length > 0 ? (
        <section className="glass rounded-2xl p-5 md:p-6">
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">Schedule Posting</h2>
              <p className="mt-1 text-sm text-slate-400">Save selected clips into the posting schedule pipeline.</p>
            </div>
            <div className="rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1 text-sm font-semibold text-teal-100">
              {selectedClips.length} clips selected
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Akun Sosial Media">
              <input value={schedule.socialAccountName} onChange={(e) => setSchedule({ ...schedule, socialAccountName: e.target.value })} className="premium-input px-4 py-3" />
            </Field>
            <Field label="Platform tujuan">
              <select value={schedule.destination} onChange={(e) => setSchedule({ ...schedule, destination: e.target.value as Platform })} className="premium-input px-4 py-3">
                {platformOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Tanggal mulai">
              <input type="date" value={schedule.startDate} onChange={(e) => setSchedule({ ...schedule, startDate: e.target.value })} className="premium-input px-4 py-3" />
            </Field>
            <Field label="Jam posting">
              <input type="time" value={schedule.postingTime} onChange={(e) => setSchedule({ ...schedule, postingTime: e.target.value })} className="premium-input px-4 py-3" />
            </Field>
            <Field label="Jam akhir posting">
              <input type="time" value={schedule.postingEndTime} onChange={(e) => setSchedule({ ...schedule, postingEndTime: e.target.value })} className="premium-input px-4 py-3" />
            </Field>
            <Field label="Zona waktu">
              <input value={schedule.timezone} onChange={(e) => setSchedule({ ...schedule, timezone: e.target.value })} className="premium-input px-4 py-3" />
            </Field>
            <Field label="Jumlah video per hari">
              <input
                type="number"
                min={1}
                max={10}
                value={schedule.videosPerDay}
                onChange={(e) => setSchedule({ ...schedule, videosPerDay: Number(e.target.value) })}
                className="premium-input px-4 py-3"
              />
            </Field>
          </div>

          <div className="mt-6 space-y-3">
            {selectedClips.map((clip) => {
              const detail = postingDetails[clip.id];
              const open = openDetailId === clip.id;
              return (
                <div key={clip.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
                  <button
                    type="button"
                    onClick={() => setOpenDetailId(open ? null : clip.id)}
                    className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left"
                  >
                    <div>
                      <div className="font-semibold text-white">{detail.title}</div>
                      <div className="mt-1 text-sm text-slate-400">{detail.privacyStatus} - {detail.tags.join(", ")}</div>
                    </div>
                    <ChevronDown className={clsx("h-5 w-5 text-slate-400 transition", open && "rotate-180")} />
                  </button>

                  {open ? (
                    <div className="grid gap-4 border-t border-white/10 p-4 md:grid-cols-2">
                      <Field label="Title">
                        <input value={detail.title} onChange={(e) => updatePostingDetail(clip.id, { title: e.target.value })} className="premium-input px-4 py-3" />
                      </Field>
                      <Field label="Privacy Status">
                        <select value={detail.privacyStatus} onChange={(e) => updatePostingDetail(clip.id, { privacyStatus: e.target.value as PrivacyStatus })} className="premium-input px-4 py-3">
                          <option value="PUBLIC">Public</option>
                          <option value="PRIVATE">Private</option>
                          <option value="UNLISTED">Unlisted</option>
                        </select>
                      </Field>
                      <Field label="Description">
                        <textarea value={detail.description} onChange={(e) => updatePostingDetail(clip.id, { description: e.target.value })} rows={4} className="premium-input px-4 py-3" />
                      </Field>
                      <Field label="Tags">
                        <input
                          value={detail.tags.join(", ")}
                          onChange={(e) => updatePostingDetail(clip.id, { tags: e.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) })}
                          className="premium-input px-4 py-3"
                        />
                      </Field>
                      <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-200">
                        <input type="checkbox" checked={detail.notifySubscriber} onChange={(e) => updatePostingDetail(clip.id, { notifySubscriber: e.target.checked })} className="h-5 w-5 accent-teal-300" />
                        Notify subscriber
                      </label>
                      <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-200">
                        <input type="checkbox" checked={detail.madeForKids} onChange={(e) => updatePostingDetail(clip.id, { madeForKids: e.target.checked })} className="h-5 w-5 accent-teal-300" />
                        Made for kids
                      </label>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={saveSchedule}
            disabled={saving}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 font-semibold text-white shadow-glow transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            Save Schedule
          </button>
        </section>
      ) : null}
    </div>
  );
}

function ClipSettings({
  activeTab,
  setActiveTab,
  setting,
  setSetting,
  generating,
  onGenerate
}: {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  setting: ClipperSetting;
  setSetting: (setting: ClipperSetting) => void;
  generating: boolean;
  onGenerate: () => void;
}) {
  return (
    <aside className="glass rounded-2xl p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white">Clip Settings</h2>
          <p className="mt-1 text-sm text-slate-400">Tune clips before generation.</p>
        </div>
        <Sparkles className="h-6 w-6 text-teal-300" />
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2 xl:grid-cols-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              "flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium transition",
              activeTab === tab.id ? "bg-white text-slate-950" : "bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "basic" ? (
        <div className="space-y-4">
          <Field label="Prompt clip">
            <textarea value={setting.prompt} onChange={(e) => setSetting({ ...setting, prompt: e.target.value })} rows={4} className="premium-input px-4 py-3" />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Toggle label="Watermark" checked={setting.watermark} onChange={(watermark) => setSetting({ ...setting, watermark })} />
            <Toggle label="Subtitle/CC" checked={setting.subtitle} onChange={(subtitle) => setSetting({ ...setting, subtitle })} />
          </div>
          <Field label="Kategori Video">
            <select value={setting.category} onChange={(e) => setSetting({ ...setting, category: e.target.value })} className="premium-input px-4 py-3">
              <option>Education</option>
              <option>AI</option>
              <option>Gaming</option>
              <option>Finance</option>
              <option>Business</option>
              <option>Entertainment</option>
              <option>Podcast</option>
              <option>News</option>
            </select>
          </Field>
          <Field label="Jumlah Klip 1-10">
            <input type="number" min={1} max={10} value={setting.clipCount} onChange={(e) => setSetting({ ...setting, clipCount: Number(e.target.value) })} className="premium-input px-4 py-3" />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Durasi Klip">
              <select value={setting.duration} onChange={(e) => setSetting({ ...setting, duration: e.target.value === "AUTO" ? "AUTO" : Number(e.target.value) })} className="premium-input px-4 py-3">
                <option value="AUTO">Auto</option>
                <option value={15}>15s</option>
                <option value={30}>30s</option>
                <option value={45}>45s</option>
                <option value={60}>60s</option>
                <option value={90}>90s</option>
              </select>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                Rekomendasi FYP: 15-45 detik. Gunakan 60-90 detik untuk storytelling, podcast, atau edukasi lebih panjang.
              </p>
              <p className="mt-1 text-xs leading-5 text-teal-200">
                Default: 30s untuk FYP cepat, 45s untuk edukasi ringan.
              </p>
            </Field>
            <Field label="Resolusi">
              <select value={setting.resolution} onChange={(e) => setSetting({ ...setting, resolution: e.target.value })} className="premium-input px-4 py-3">
                <option>720x1280</option>
                <option>1080x1920</option>
              </select>
            </Field>
          </div>
        </div>
      ) : (
        <AdvancedTab activeTab={activeTab} setting={setting} setSetting={setSetting} />
      )}

      <button
        type="button"
        onClick={onGenerate}
        disabled={generating}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 font-semibold text-slate-950 transition hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {generating ? <Loader2 className="h-5 w-5 animate-spin" /> : <BadgeCheck className="h-5 w-5" />}
        Generate Klip
      </button>
    </aside>
  );
}

function AdvancedTab({
  activeTab,
  setting,
  setSetting
}: {
  activeTab: TabId;
  setting: ClipperSetting;
  setSetting: (setting: ClipperSetting) => void;
}) {
  if (activeTab === "layout") {
    return (
      <Field label="Layout">
        <select value={setting.layout} onChange={(e) => setSetting({ ...setting, layout: e.target.value })} className="premium-input px-4 py-3">
          <option>Auto Reframe</option>
          <option>Face Tracking</option>
          <option>Split Screen</option>
          <option>Gameplay Focus</option>
        </select>
      </Field>
    );
  }

  if (activeTab === "subtitleStyle") {
    return (
      <Field label="Gaya Subtitle">
        <select value={setting.subtitleStyle} onChange={(e) => setSetting({ ...setting, subtitleStyle: e.target.value })} className="premium-input px-4 py-3">
          <option>Bold Creator</option>
          <option>TikTok</option>
          <option>Podcast</option>
          <option>Modern</option>
        </select>
      </Field>
    );
  }

  if (activeTab === "textPlacement") {
    return (
      <Field label="Peletakan Teks">
        <select value={setting.textPlacement} onChange={(e) => setSetting({ ...setting, textPlacement: e.target.value })} className="premium-input px-4 py-3">
          <option>Lower Third</option>
          <option>Center Safe Area</option>
          <option>Top Hook</option>
          <option>Dynamic Follow</option>
        </select>
      </Field>
    );
  }

  return (
    <div className="space-y-4">
      <Toggle label="Subtitle/CC aktif" checked={setting.subtitle} onChange={(subtitle) => setSetting({ ...setting, subtitle })} />
      <Field label="Bahasa CC">
        <select value={setting.ccLanguage} onChange={(e) => setSetting({ ...setting, ccLanguage: e.target.value })} className="premium-input px-4 py-3">
          <option>id-ID</option>
          <option>en-US</option>
          <option>ms-MY</option>
        </select>
      </Field>
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

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-slate-200"
    >
      {label}
      <span className={clsx("relative h-6 w-11 rounded-full transition", checked ? "bg-teal-300" : "bg-slate-700")}>
        <span className={clsx("absolute top-1 h-4 w-4 rounded-full bg-white transition", checked ? "left-6" : "left-1")} />
      </span>
    </button>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-24 px-4 py-3">
      <div className="text-sm font-semibold text-white">{value}</div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  );
}
