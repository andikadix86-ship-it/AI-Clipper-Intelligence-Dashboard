import type { TrendSignal, TrendSourceInput, TrendSourceMode, TrendSourceName } from "./types";

export function fallbackTrendSignals(source: TrendSourceName, input: TrendSourceInput, message: string, mode: Extract<TrendSourceMode, "demo" | "fallback"> = "fallback"): TrendSignal[] {
  const keyword = input.keyword.trim() || input.niche.trim();
  const rows = source === "YouTube"
    ? [[keyword, 74], [`${keyword} untuk pemula`, 81], [`kesalahan ${keyword}`, 69]]
    : source === "Reddit"
      ? [[`${keyword} discussion`, 67], [`${keyword} tips`, 72], [`${keyword} mistakes`, 64]]
      : source === "Knowledge Base"
        ? [[keyword, 70]]
        : [[keyword, 78], [`cara ${keyword}`, 84], [`tren ${keyword}`, 66]];
  return rows.map(([value, score]) => ({
    source,
    keyword: String(value),
    trend_score: Number(score),
    confidence_score: source === "Knowledge Base" ? 50 : 38,
    collected_at: new Date().toISOString(),
    mode,
    message
  }));
}

export function clampScore(value: unknown, fallback = 50) {
  return typeof value === "number" && Number.isFinite(value) ? Math.min(100, Math.max(0, Math.round(value))) : fallback;
}
