import { execFile } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export const uploadRoot = path.join(process.cwd(), "public", "uploads");

export type FfmpegClipInput = {
  inputPath: string;
  startTime: number;
  duration: number;
  outputPath: string;
  resolution?: string;
};

export type FfmpegThumbnailInput = {
  inputPath: string;
  atTime: number;
  outputPath: string;
};

export async function ensureMediaDirs() {
  await Promise.all([
    mkdir(path.join(uploadRoot, "videos"), { recursive: true }),
    mkdir(path.join(uploadRoot, "outputs"), { recursive: true }),
    mkdir(path.join(uploadRoot, "thumbnails"), { recursive: true }),
    mkdir(path.join(uploadRoot, "subtitles"), { recursive: true })
  ]);
}

export async function hasFfmpeg() {
  try {
    await execFileAsync("ffmpeg", ["-version"], { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

export function publicUrlToPath(url: string) {
  if (url.startsWith("/uploads/")) return path.join(process.cwd(), "public", url);
  return "";
}

export function outputPublicUrl(fileName: string) {
  return `/uploads/outputs/${fileName}`;
}

export function thumbnailPublicUrl(fileName: string) {
  return `/uploads/thumbnails/${fileName}`;
}

export function subtitlePublicUrl(fileName: string) {
  return `/uploads/subtitles/${fileName}`;
}

export async function cutVideoWithFfmpeg(input: FfmpegClipInput) {
  const resolution = input.resolution === "720x1280" ? { width: 720, height: 1280 } : { width: 1080, height: 1920 };
  const cropFilter = `scale=${resolution.width}:${resolution.height}:force_original_aspect_ratio=increase,crop=${resolution.width}:${resolution.height}`;

  await execFileAsync(
    "ffmpeg",
    [
      "-y",
      "-ss",
      String(input.startTime),
      "-i",
      input.inputPath,
      "-t",
      String(input.duration),
      "-vf",
      cropFilter,
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "23",
      "-c:a",
      "aac",
      "-movflags",
      "+faststart",
      input.outputPath
    ],
    { timeout: 120000, maxBuffer: 1024 * 1024 * 8 }
  );
}

export async function generateThumbnailWithFfmpeg(input: FfmpegThumbnailInput) {
  await execFileAsync(
    "ffmpeg",
    [
      "-y",
      "-ss",
      String(input.atTime),
      "-i",
      input.inputPath,
      "-frames:v",
      "1",
      "-vf",
      "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280",
      input.outputPath
    ],
    { timeout: 60000, maxBuffer: 1024 * 1024 * 4 }
  );
}
