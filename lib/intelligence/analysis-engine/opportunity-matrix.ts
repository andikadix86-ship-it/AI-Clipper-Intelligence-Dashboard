import type { AnalysisLevel } from "@/lib/intelligence/analysis-engine/types";

export function level(value: number): AnalysisLevel {
  return value >= 75 ? "HIGH" : value >= 52 ? "MEDIUM" : "LOW";
}

export function trendStage(direction: "RISING" | "STABLE" | "FALLING" | "UNKNOWN", recencyScore: number) {
  if (direction === "RISING" && recencyScore >= 72) return "GROWING" as const;
  if (direction === "RISING") return "EMERGING" as const;
  if (direction === "STABLE") return "PEAK" as const;
  if (direction === "FALLING") return "DECLINING" as const;
  return "UNKNOWN" as const;
}

