import { writeFile } from "node:fs/promises";

export type SubtitleStyle = "Bold Creator" | "TikTok" | "Podcast" | "Modern" | string;

export type SubtitleSegment = {
  start: number;
  end: number;
  text: string;
};

function timecode(seconds: number) {
  const safe = Math.max(0, seconds);
  const hh = Math.floor(safe / 3600).toString().padStart(2, "0");
  const mm = Math.floor((safe % 3600) / 60).toString().padStart(2, "0");
  const ss = Math.floor(safe % 60).toString().padStart(2, "0");
  return `${hh}:${mm}:${ss},000`;
}

export function createDummySubtitleSegments(start: number, duration: number, title: string): SubtitleSegment[] {
  const lines = [
    `Hook: ${title}`,
    "Masalahnya muncul di detik pertama.",
    "Lihat proof dan workflow singkatnya.",
    "Simpan ide ini untuk batch konten berikutnya."
  ];
  const segmentDuration = Math.max(3, Math.floor(duration / lines.length));
  return lines.map((text, index) => ({
    start: start + index * segmentDuration,
    end: Math.min(start + duration, start + (index + 1) * segmentDuration),
    text
  }));
}

export function renderSrt(segments: SubtitleSegment[]) {
  return segments
    .map((segment, index) => `${index + 1}\n${timecode(segment.start)} --> ${timecode(segment.end)}\n${segment.text}\n`)
    .join("\n");
}

export function subtitleStyleConfig(style: SubtitleStyle) {
  const styles: Record<string, { fontWeight: string; position: string; color: string }> = {
    "Bold Creator": { fontWeight: "800", position: "lower-third", color: "#ffffff" },
    TikTok: { fontWeight: "900", position: "center-safe", color: "#ffffff" },
    Podcast: { fontWeight: "700", position: "lower-third", color: "#f8fafc" },
    Modern: { fontWeight: "700", position: "lower-third", color: "#ccfbf1" }
  };
  return styles[style] ?? styles["Bold Creator"];
}

export async function writeSrtFile(path: string, segments: SubtitleSegment[]) {
  await writeFile(path, renderSrt(segments), "utf8");
}
