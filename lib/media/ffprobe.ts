import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export type VideoMetadata = {
  duration: number;
  width?: number;
  height?: number;
  formatName?: string;
  bitRate?: number;
};

export async function hasFfprobe() {
  try {
    await execFileAsync("ffprobe", ["-version"], { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

export async function probeVideo(inputPath: string): Promise<VideoMetadata> {
  const { stdout } = await execFileAsync(
    "ffprobe",
    [
      "-v",
      "error",
      "-print_format",
      "json",
      "-show_format",
      "-show_streams",
      inputPath
    ],
    { timeout: 30000, maxBuffer: 1024 * 1024 * 4 }
  );
  const data = JSON.parse(stdout);
  const videoStream = data.streams?.find((stream: { codec_type?: string }) => stream.codec_type === "video");
  return {
    duration: Math.max(1, Math.round(Number(data.format?.duration ?? videoStream?.duration ?? 60))),
    width: videoStream?.width,
    height: videoStream?.height,
    formatName: data.format?.format_name,
    bitRate: data.format?.bit_rate ? Number(data.format.bit_rate) : undefined
  };
}
