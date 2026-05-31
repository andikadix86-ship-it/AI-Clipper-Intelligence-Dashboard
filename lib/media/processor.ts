import path from "node:path";
import { prisma } from "@/lib/prisma";
import { createDummyClips } from "@/lib/dummy-clips";
import { cutVideoWithFfmpeg, ensureMediaDirs, generateThumbnailWithFfmpeg, hasFfmpeg, outputPublicUrl, publicUrlToPath, subtitlePublicUrl, thumbnailPublicUrl, uploadRoot } from "@/lib/media/ffmpeg";
import { hasFfprobe, probeVideo, type VideoMetadata } from "@/lib/media/ffprobe";
import { createDummySubtitleSegments, subtitleStyleConfig, writeSrtFile } from "@/lib/media/subtitle";
import type { ClipSettingPayload, GeneratedClipDto } from "@/lib/types";

type MediaJobShape = {
  id: string;
  projectId: string | null;
  videoSourceId: string | null;
  generatedClipId: string | null;
  jobType: string;
  status: string;
  progress: number;
  inputUrl: string;
  outputUrl: string | null;
  errorMessage: string | null;
  logs?: string[];
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type ClipSuggestion = {
  index: number;
  startTime: number;
  endTime: number;
  duration: number;
  viralScore: number;
  title: string;
  description: string;
};

export function mapMediaJob(job: MediaJobShape) {
  return {
    id: job.id,
    projectId: job.projectId ?? undefined,
    videoSourceId: job.videoSourceId ?? undefined,
    generatedClipId: job.generatedClipId ?? undefined,
    jobType: job.jobType,
    status: job.status,
    progress: job.progress,
    inputUrl: job.inputUrl,
    outputUrl: job.outputUrl ?? undefined,
    errorMessage: job.errorMessage ?? undefined,
    logs: job.logs ?? [],
    startedAt: job.startedAt?.toISOString(),
    completedAt: job.completedAt?.toISOString(),
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString()
  };
}

function durationByCategory(category: string, requestedDuration: number) {
  if (requestedDuration > 0) return requestedDuration;
  const normalized = category.toLowerCase();
  if (normalized.includes("gaming")) return 15;
  if (normalized.includes("education")) return 45;
  if (normalized.includes("podcast")) return 45;
  if (normalized.includes("finance")) return 30;
  if (normalized.includes("ai")) return 30;
  return 30;
}

export function generateClipSuggestions(params: {
  sourceTitle: string;
  category: string;
  clipCount: number;
  requestedDuration: number;
  metadata?: VideoMetadata;
}) {
  const duration = durationByCategory(params.category, params.requestedDuration);
  const totalDuration = params.metadata?.duration ?? Math.max(duration * params.clipCount + 15, 120);
  const maxStart = Math.max(0, totalDuration - duration - 1);
  const spacing = Math.max(1, Math.floor(maxStart / Math.max(1, params.clipCount + 1)));

  return Array.from({ length: params.clipCount }, (_, index): ClipSuggestion => {
    const startTime = Math.min(maxStart, Math.max(0, spacing * (index + 1)));
    const endTime = Math.min(totalDuration, startTime + duration);
    const viralScore = Math.min(98, 76 + ((index + 1) * 6) + (duration <= 30 ? 5 : 0));
    return {
      index,
      startTime,
      endTime,
      duration: endTime - startTime,
      viralScore,
      title: `${params.sourceTitle} - Peak Moment ${index + 1}`,
      description: `Rule-based peak detection from ${Math.round(startTime)}s to ${Math.round(endTime)}s. Category ${params.category}, auto reframe 9:16 ready.`
    };
  });
}

async function updateJob(jobId: string, progress: number, status: "PROCESSING" | "GENERATING_SUBTITLE" | "GENERATING_THUMBNAIL" | "COMPLETED" | "FAILED", log: string, patch: Record<string, unknown> = {}) {
  return prisma.mediaProcessingJob.update({
    where: { id: jobId },
    data: {
      status,
      progress,
      logs: { push: log },
      ...patch
    }
  });
}

export async function runDummyProcessingJob(jobId: string, warning = "FFmpeg not available. Dummy processing completed safely.") {
  const started = await prisma.mediaProcessingJob.update({
    where: { id: jobId },
    data: {
      status: "PROCESSING",
      progress: 35,
      startedAt: new Date(),
      errorMessage: warning,
      logs: { push: "Fallback dummy processing started." }
    }
  });

  const outputUrl = started.outputUrl || `https://dummy.supabase.local/outputs/${started.id}.mp4`;
  const completed = await prisma.mediaProcessingJob.update({
    where: { id: jobId },
    data: {
      status: "COMPLETED",
      progress: 100,
      outputUrl,
      completedAt: new Date(),
      logs: { push: "Fallback dummy processing completed." }
    }
  });

  if (completed.generatedClipId) {
    await prisma.generatedClip.update({
      where: { id: completed.generatedClipId },
      data: { processingStatus: "COMPLETED", outputFileUrl: outputUrl, errorMessage: warning }
    });
  }

  return mapMediaJob(completed);
}

export async function processClipJob(jobId: string, options: { resolution?: string; subtitleStyle?: string } = {}) {
  const job = await prisma.mediaProcessingJob.findUnique({
    where: { id: jobId },
    include: { generatedClip: true, videoSource: true }
  });
  if (!job) throw new Error("Media processing job not found.");

  const ffmpegReady = await hasFfmpeg();
  const ffprobeReady = await hasFfprobe();
  const inputPath = publicUrlToPath(job.inputUrl);
  if (!ffmpegReady || !ffprobeReady || !inputPath || !job.generatedClip) {
    return runDummyProcessingJob(jobId, !ffmpegReady || !ffprobeReady ? "FFmpeg/FFprobe not found. Dummy fallback used." : "Local uploaded source not found. Dummy fallback used.");
  }

  try {
    await ensureMediaDirs();
    await updateJob(jobId, 10, "PROCESSING", "Load Video: local source loaded.", { startedAt: new Date(), errorMessage: null });
    const metadata = await probeVideo(inputPath);
    await updateJob(jobId, 25, "PROCESSING", `Analyze Duration: ${metadata.duration}s, ${metadata.width ?? 0}x${metadata.height ?? 0}.`);
    await updateJob(jobId, 40, "PROCESSING", "Extract Metadata: format and dimensions read by FFprobe.");

    const clip = job.generatedClip;
    const startTime = clip.startTime ?? 0;
    const duration = clip.duration;
    const baseName = `${clip.id}-${Date.now()}`;
    const outputPath = path.join(uploadRoot, "outputs", `${baseName}.mp4`);
    const thumbPath = path.join(uploadRoot, "thumbnails", `${baseName}.jpg`);
    const subtitlePath = path.join(uploadRoot, "subtitles", `${baseName}.srt`);
    const outputUrl = outputPublicUrl(`${baseName}.mp4`);
    const thumbnailUrl = thumbnailPublicUrl(`${baseName}.jpg`);
    const srtUrl = subtitlePublicUrl(`${baseName}.srt`);

    await updateJob(jobId, 55, "PROCESSING", "Auto Reframe: center crop 16:9 to 9:16 prepared.");
    await cutVideoWithFfmpeg({ inputPath, startTime, duration, outputPath, resolution: options.resolution });
    await updateJob(jobId, 72, "GENERATING_SUBTITLE", `Subtitle: dummy ${options.subtitleStyle ?? "Bold Creator"} style generated.`);
    subtitleStyleConfig(options.subtitleStyle ?? "Bold Creator");
    await writeSrtFile(subtitlePath, createDummySubtitleSegments(startTime, duration, clip.title));
    await updateJob(jobId, 86, "GENERATING_THUMBNAIL", "Thumbnail: extracting vertical preview frame.");
    await generateThumbnailWithFfmpeg({ inputPath, atTime: startTime + 1, outputPath: thumbPath });

    const completed = await prisma.mediaProcessingJob.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        progress: 100,
        outputUrl,
        completedAt: new Date(),
        logs: { push: "Completed: FFmpeg clip, thumbnail, and subtitle output ready." }
      }
    });

    await prisma.generatedClip.update({
      where: { id: clip.id },
      data: {
        outputFileUrl: outputUrl,
        thumbnail: thumbnailUrl,
        thumbnailUrl,
        subtitleUrl: srtUrl,
        processingStatus: "COMPLETED",
        errorMessage: null
      }
    });

    return mapMediaJob(completed);
  } catch (error) {
    const failed = await prisma.mediaProcessingJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        progress: 100,
        errorMessage: error instanceof Error ? error.message : "FFmpeg processing failed.",
        completedAt: new Date(),
        logs: { push: "Failed: FFmpeg processing error." }
      }
    });
    if (job.generatedClipId) {
      await prisma.generatedClip.update({
        where: { id: job.generatedClipId },
        data: { processingStatus: "FAILED", errorMessage: failed.errorMessage }
      });
    }
    return mapMediaJob(failed);
  }
}

export async function analyzeVideoSource(videoSourceId: string) {
  const source = await prisma.videoSource.findUnique({ where: { id: videoSourceId } });
  if (!source) throw new Error("Video source not found.");
  const inputPath = publicUrlToPath(source.sourceFileUrl ?? source.url);
  const ffmpegReady = await hasFfmpeg();
  const ffprobeReady = await hasFfprobe();
  if (!ffmpegReady || !ffprobeReady || !inputPath) {
    return {
      mode: "DUMMY",
      warning: "FFmpeg/FFprobe or local source not available. Using rule-based dummy metadata.",
      metadata: { duration: 180 } satisfies VideoMetadata
    };
  }
  return { mode: "REAL", metadata: await probeVideo(inputPath) };
}

export function mapClipToDto(clip: {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  thumbnailUrl?: string | null;
  duration: number;
  viralScore: number;
  tags: string[];
  outputFileUrl?: string | null;
  subtitleUrl?: string | null;
  startTime?: number | null;
  endTime?: number | null;
  processingStatus?: string;
  errorMessage?: string | null;
}): GeneratedClipDto & { outputFileUrl?: string; subtitleUrl?: string; startTime?: number; endTime?: number; processingStatus?: string; errorMessage?: string } {
  return {
    id: clip.id,
    title: clip.title,
    description: clip.description,
    thumbnail: clip.thumbnailUrl ?? clip.thumbnail,
    duration: clip.duration,
    viralScore: clip.viralScore,
    tags: clip.tags,
    outputFileUrl: clip.outputFileUrl ?? undefined,
    subtitleUrl: clip.subtitleUrl ?? undefined,
    startTime: clip.startTime ?? undefined,
    endTime: clip.endTime ?? undefined,
    processingStatus: clip.processingStatus,
    errorMessage: clip.errorMessage ?? undefined
  };
}

export function fallbackClips(count: number, duration: number, sourceTitle: string) {
  return createDummyClips(count, duration, sourceTitle);
}
